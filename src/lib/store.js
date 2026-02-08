import { supabase } from './supabase';

const TERMINAL_SESSION_KEY = 'loyalty_terminal_session';

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
        localStorage.removeItem('loyalty_role'); // Clear role cache
    },

    isLoggedIn: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    },

    getCachedRole: () => {
        return localStorage.getItem('loyalty_role');
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
                setTimeout(() => reject(new Error('Database query timed out (3s)')), 3000)
            );

            try {
                const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]);
                console.log("[store] getUserRole: Query finished!", { profile, error });
                if (error) throw error;

                const role = (profile && profile.role) || null;
                if (role) {
                    localStorage.setItem('loyalty_role', role);
                } else {
                    localStorage.removeItem('loyalty_role');
                }
                return role;
            } catch (err) {
                console.error("[store] getUserRole error:", err.message);
                return localStorage.getItem('loyalty_role'); // Fallback to cache on error if possible
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
            .select('id, name, merchant_id, is_active, daily_redemption_limit, theme_color, reset_interval, enable_confetti, enable_sound, logo_url, point_collection_effect, redemption_effect, store_name:merchants(store_name)')
            .eq('login_key', key)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
            branch_id: data.id,
            branch_name: data.name,
            merchant_id: data.merchant_id,
            is_active: data.is_active !== false, // Default to true if null
            daily_redemption_limit: data.daily_redemption_limit ?? 2,
            theme_color: data.theme_color || 'teal',
            reset_interval: data.reset_interval || 10,
            enable_confetti: data.enable_confetti !== false, // Default true
            enable_sound: data.enable_sound !== false, // Default true
            logo_url: data.logo_url || null,
            store_name: (data.store_name && data.store_name.store_name) || 'Unknown Store',
            point_collection_effect: data.point_collection_effect || 'shower',
            redemption_effect: data.redemption_effect || 'confetti'
        };
    },

    setTerminalSession: (sessionData) => {
        localStorage.setItem(TERMINAL_SESSION_KEY, JSON.stringify(sessionData));
    },

    updateTerminalSettings: function (settings) {
        const currentSession = this.getTerminalSession();
        if (!currentSession) return false;

        const newSession = {
            ...currentSession,
            theme_color: settings.theme_color || currentSession.theme_color,
            reset_interval: settings.reset_interval || currentSession.reset_interval,
            enable_confetti: settings.enable_confetti !== undefined ? settings.enable_confetti : currentSession.enable_confetti,
            enable_sound: settings.enable_sound !== undefined ? settings.enable_sound : (currentSession.enable_sound ?? true), // Default true
            daily_redemption_limit: settings.daily_redemption_limit !== undefined ? settings.daily_redemption_limit : currentSession.daily_redemption_limit,
            point_collection_effect: settings.point_collection_effect || currentSession.point_collection_effect || 'shower',
            redemption_effect: settings.redemption_effect || currentSession.redemption_effect || 'confetti'
        };

        localStorage.setItem(TERMINAL_SESSION_KEY, JSON.stringify(newSession));
        return true;
    },

    getTerminalSession: () => {
        const data = localStorage.getItem(TERMINAL_SESSION_KEY);
        if (!data) return null;
        const session = JSON.parse(data);
        // Ensure enable_sound defaults to true if not explicitly set
        if (session && session.enable_sound === undefined) {
            session.enable_sound = true;
        }
        return session;
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

    // Get redemption count for today (current branch)
    getRedemptionCountToday: async (phone) => {
        const merchantId = await store.getMerchantId();
        const terminalSession = store.getTerminalSession();
        const branchId = (terminalSession && terminalSession.branch_id) || null;

        if (!branchId) return 0; // If no branch, we can't check branch-specific limit

        // 1. Get Customer ID
        const { data: customer, error: fetchError } = await supabase
            .from('customers')
            .select('id')
            .eq('merchant_id', merchantId)
            .eq('phone', phone)
            .maybeSingle();

        if (fetchError || !customer) return 0;

        // 2. Query transactions for today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { count, error: countError } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customer.id)
            .eq('branch_id', branchId)
            .eq('type', 'redeem')
            .gte('created_at', todayStart.toISOString())
            .lte('created_at', todayEnd.toISOString());

        if (countError) throw countError;
        return count || 0;
    },

    // Redeem points
    redeemPoints: async (phone, amount, isManual = false) => {
        const merchantId = await store.getMerchantId();
        const terminalSession = store.getTerminalSession();
        const branchId = (terminalSession && terminalSession.branch_id) || null;

        // 0. Check Daily Limit (Only if not manual)
        if (!isManual) {
            const limit = terminalSession?.daily_redemption_limit ?? 2;
            if (limit > 0) {
                const dailyCount = await store.getRedemptionCountToday(phone);
                if (dailyCount >= limit) {
                    throw new Error('Limit reached');
                }
            }
        }

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
            type: isManual ? 'manual_redeem' : 'redeem',
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
    },

    updatePassword: async (newPassword) => {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
        return true;
    }
};
