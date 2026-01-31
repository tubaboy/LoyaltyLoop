const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://loyaltyloop.zeabur.app',
        process.env.FRONTEND_URL // Allow setting via env var
    ].filter(Boolean),
    credentials: true
}));
app.use(express.json());

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Health Check
app.get('/', (req, res) => {
    res.send('LoyaltyLoop API is running');
});

// Create Merchant API
app.post('/create-merchant', async (req, res) => {
    try {
        // 1. Verify Authorization Header (Ensure request comes from a logged-in Admin)
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid user token' });
        }

        // 2. Verify Admin Role (check profiles table)
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin only' });
        }

        // 3. Extract Body Data
        const { email, password, store_name, ...details } = req.body;

        if (!email || !password || !store_name) {
            return res.status(400).json({ error: 'Email, password, and store name are required' });
        }

        // 4. Create User (Auth)
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'merchant' }
        });

        if (createError) {
            console.error('Auth API Error:', createError.message);
            return res.status(400).json({ error: 'Auth API Error: ' + createError.message });
        }

        const newUserId = authData.user.id;

        // 5. Create Profile Entry
        await supabaseAdmin.from('profiles').upsert({
            id: newUserId,
            role: 'merchant'
        });

        // Helper to generate 4-char store code
        function generateStoreCode() {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = '';
            for (let i = 0; i < 4; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        }

        // 6. Create Merchant Entry
        const { error: dbError } = await supabaseAdmin
            .from('merchants')
            .upsert({
                id: newUserId,
                email,
                store_name,
                store_code: generateStoreCode(), // Generate code explicitly
                recovery_password: password,
                ...details
            });

        if (dbError) {
            console.error('Database Error:', dbError.message);
            // Rollback: try to delete the created user if DB insert fails
            await supabaseAdmin.auth.admin.deleteUser(newUserId);
            return res.status(400).json({ error: 'Database Error: ' + dbError.message });
        }

        // Success Response
        res.status(200).json({
            success: true,
            user: authData.user,
            message: 'Merchant created successfully'
        });

    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
