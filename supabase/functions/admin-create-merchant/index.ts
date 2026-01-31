import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) throw new Error('Unauthorized: ' + (authError?.message || 'Invalid user'))

        // Verify admin role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') throw new Error('Forbidden: Admin only')

        const body = await req.json()
        const { email, password, store_name, ...details } = body

        if (!email || !password || !store_name) {
            throw new Error('Email, password, and store name are required')
        }

        // 1. Create User
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'merchant' }
        })

        if (createError) {
            console.error('Auth API Error:', createError.message)
            throw new Error('Auth API Error: ' + createError.message)
        }

        // 2. Profile Entry (Ensuring it exists before merchant)
        await supabaseAdmin.from('profiles').upsert({
            id: authData.user.id,
            role: 'merchant'
        })

        // 3. Merchant Entry (Using upsert for safety)
        const { error: dbError } = await supabaseAdmin
            .from('merchants')
            .upsert({
                id: authData.user.id,
                email,
                store_name,
                recovery_password: password,
                ...details
            })

        if (dbError) {
            console.error('Database Error:', dbError.message)
            throw new Error('Database Error: ' + dbError.message)
        }

        return new Response(JSON.stringify({ success: true, user: authData.user }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Server Catch:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
