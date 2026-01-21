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
                return (profile && profile.role) || null;
            } catch (err) {
                console.error("[store] getUserRole error:", err.message);
                return null;
            }
        } catch (err) {
            console.error("[store] getUserRole catch:", err);
            return null;
        }
    },

    // Terminal Session Management
    verifyBranchKey: async (key) => {
        // Query branches by key
        const { data, error } = await supabase
            .from('branches')
            .select('id, name, merchant_id, is_active, store_name:merchants(store_name)')
            .eq('login_key', key)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
            branch_id: data.id,
            branch_name: data.name,
            merchant_id: data.merchant_id,
            is_active: data.is_active !== false, // Default to true if null
            store_name: (data.store_name && data.store_name.store_name) || 'Unknown Store'
        };
    },

    setTerminalSession: (sessionData) => {
        localStorage.setItem('loyalty_terminal_session', JSON.stringify(sessionData));
    },

    getTerminalSession: () => {
        const data = localStorage.getItem('loyalty_terminal_session');
        return data ? JSON.parse(data) : null;
    },

    clearTerminalSession: () => {
        localStorage.removeItem('loyalty_terminal_session');
    },

    // Get current User ID (Merchant ID) or Terminal's Merchant ID
    getMerchantId: async () => {
        // 1. Try Supabase Auth (Admin/Merchant Owner)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) return user.id;

        // 2. Try Terminal Session
        const terminalSession = store.getTerminalSession();
        if (terminalSession && terminalSession.merchant_id) return terminalSession.merchant_id;

        throw new Error('Not logged in');
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
        const terminalSession = store.getTerminalSession();
        const branchId = (terminalSession && terminalSession.branch_id) || null;

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
            branch_id: branchId
        }]);

        return customer.points;
    },

    // Redeem points
    redeemPoints: async (phone, amount) => {
        const merchantId = await store.getMerchantId();
        const terminalSession = store.getTerminalSession();
        const branchId = (terminalSession && terminalSession.branch_id) || null;

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
            amount: amount,
            branch_id: branchId
        }]);

        return updatedCustomer.points;
    },

    // Fetch dynamic options (Presets)
    getLoyaltyOptions: async (branchId = null) => {
        const merchantId = await store.getMerchantId();
        const terminalSession = store.getTerminalSession();
        const activeBranchId = branchId || (terminalSession && terminalSession.branch_id);

        let query = supabase
            .from('loyalty_options')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('is_active', true);

        if (activeBranchId) {
            query = query.eq('branch_id', activeBranchId);
        } else {
            // If No branchId provided and no terminal session, 
            // we return options where branch_id is null (merchant-wide) 
            // OR we could return empty. Let's return where branch_id is null for legacy support.
            query = query.is('branch_id', null);
        }

        const { data, error } = await query
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data;
    }
};
