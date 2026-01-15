import { supabase } from './supabase';

export const store = {
    // Auth
    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data; // session
    },

    logout: async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('loyalty_merchant'); // Cleanup legacy
    },

    isLoggedIn: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    },

    getUserRole: async (currentUser = null) => {
        try {
            let user = currentUser;

            if (!user) {
                console.log("[store] getUserRole: getting user from auth...");
                const { data } = await supabase.auth.getUser();
                user = data.user;
            }

            if (!user) {
                console.log("[store] getUserRole: no user found");
                return null;
            }
            console.log("[store] getUserRole: Starting query for:", user.id);
            console.log("[store] getUserRole: Starting database query...");

            const queryPromise = supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database query timed out (10s)')), 10000)
            );

            try {
                const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]);
                console.log("[store] getUserRole: Query finished!", { profile, error });
                if (error) throw error;
                return profile?.role || null;
            } catch (err) {
                console.error("[store] getUserRole error:", err.message);
                return null;
            }
        } catch (err) {
            console.error("[store] getUserRole catch:", err);
            return null;
        }
    },

    // Get current User ID (Merchant ID)
    getMerchantId: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');
        return user.id;
    },

    // Get points for a specific phone
    getPoints: async (phone) => {
        const merchantId = await store.getMerchantId();

        // Try to find customer
        let { data: customer, error } = await supabase
            .from('customers')
            .select('points, id')
            .eq('merchant_id', merchantId) // RLS enforces this, but good to be explicit
            .eq('phone', phone)
            .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

        if (error) throw error;
        if (!customer) return 0;

        return customer.points;
    },

    // Add points
    addPoints: async (phone, amount = 1) => {
        const merchantId = await store.getMerchantId();

        // 1. Get or Create Customer
        let { data: customer, error: fetchError } = await supabase
            .from('customers')
            .select('id, points')
            .eq('merchant_id', merchantId)
            .eq('phone', phone)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (!customer) {
            // Create new customer
            const { data: newCustomer, error: createError } = await supabase
                .from('customers')
                .insert([{ merchant_id: merchantId, phone, points: amount }])
                .select()
                .single();
            if (createError) throw createError;
            customer = newCustomer;
        } else {
            // Update existing
            const { data: updatedCustomer, error: updateError } = await supabase
                .from('customers')
                .update({ points: customer.points + amount })
                .eq('id', customer.id)
                .select()
                .single();
            if (updateError) throw updateError;
            customer = updatedCustomer;
        }

        // 2. Log Transaction
        await supabase.from('transactions').insert([{
            merchant_id: merchantId, // Explicitly set needed
            customer_id: customer.id,
            type: 'add',
            amount: amount,
            // branch_id: TODO - get from context/local storage?
            // For now leave null or update later
        }]);

        return customer.points;
    },

    // Redeem points
    redeemPoints: async (phone, amount) => {
        const merchantId = await store.getMerchantId();

        // 1. Get Customer
        const { data: customer, error: fetchError } = await supabase
            .from('customers')
            .select('id, points')
            .eq('merchant_id', merchantId)
            .eq('phone', phone)
            .maybeSingle();

        if (fetchError || !customer) return false;
        if (customer.points < amount) return false;

        // 2. Update Points
        const { data: updatedCustomer, error: updateError } = await supabase
            .from('customers')
            .update({ points: customer.points - amount })
            .eq('id', customer.id)
            .select()
            .single();

        if (updateError) throw updateError;

        // 3. Log Transaction
        await supabase.from('transactions').insert([{
            merchant_id: merchantId,
            customer_id: customer.id,
            type: 'redeem',
            amount: amount
        }]);

        return updatedCustomer.points;
    },

    // Fetch dynamic options (Presets)
    getLoyaltyOptions: async () => {
        const merchantId = await store.getMerchantId();

        const { data, error } = await supabase
            .from('loyalty_options')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data;
    }
};
