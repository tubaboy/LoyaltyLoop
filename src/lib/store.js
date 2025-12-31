import { supabase } from './supabase';

export const store = {
    // Current merchant session (still tracked for now, but should move to Supabase Auth)
    getMerchantId: () => localStorage.getItem('loyalty_merchant'),

    // Get points for a specific phone (creates customer record if not exists)
    getPoints: async (phone) => {
        const merchantId = store.getMerchantId();
        if (!merchantId) throw new Error('Not logged in');

        // Try to find customer
        let { data: customer, error } = await supabase
            .from('customers')
            .select('points, id')
            .eq('merchant_id', merchantId)
            .eq('phone', phone)
            .single();

        if (error && error.code === 'PGRST116') {
            // Customer not found, return 0 (will create on first transaction)
            return 0;
        }

        if (error) throw error;
        return customer.points;
    },

    // Add points
    addPoints: async (phone, amount = 1) => {
        const merchantId = store.getMerchantId();
        if (!merchantId) throw new Error('Not logged in');

        // 1. Get or Create Customer
        let { data: customer, error: fetchError } = await supabase
            .from('customers')
            .select('id, points')
            .eq('merchant_id', merchantId)
            .eq('phone', phone)
            .single();

        if (fetchError && fetchError.code === 'PGRST116') {
            // Create new customer
            const { data: newCustomer, error: createError } = await supabase
                .from('customers')
                .insert([{ merchant_id: merchantId, phone, points: amount }])
                .select()
                .single();
            if (createError) throw createError;
            customer = newCustomer;
        } else if (customer) {
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
            merchant_id: merchantId,
            customer_id: customer.id,
            type: 'add',
            amount: amount
        }]);

        return customer.points;
    },

    // Redeem points
    redeemPoints: async (phone, amount) => {
        const merchantId = store.getMerchantId();
        if (!merchantId) throw new Error('Not logged in');

        // 1. Get Customer
        const { data: customer, error: fetchError } = await supabase
            .from('customers')
            .select('id, points')
            .eq('merchant_id', merchantId)
            .eq('phone', phone)
            .single();

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

    // Auth (Simplified for now, using localStorage to store the merchant's UUID from Supabase Auth)
    login: (merchantId) => {
        localStorage.setItem('loyalty_merchant', merchantId);
        return true;
    },

    // Fetch dynamic options (Presets)
    getLoyaltyOptions: async () => {
        const merchantId = store.getMerchantId();
        if (!merchantId) throw new Error('Not logged in');

        const { data, error } = await supabase
            .from('loyalty_options')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data;
    },

    logout: () => {
        localStorage.removeItem('loyalty_merchant');
    },

    isLoggedIn: () => {
        return !!localStorage.getItem('loyalty_merchant');
    }
};
