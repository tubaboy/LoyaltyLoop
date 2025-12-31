-- 1. Create Merchants table
-- This table links to Supabase Auth users
CREATE TABLE public.merchants (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    store_name TEXT NOT NULL,
    settings JSONB DEFAULT '{"reset_timer": 5000}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Customers table
CREATE TABLE public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
    phone TEXT NOT NULL,
    points INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure phone is unique per merchant
    UNIQUE(merchant_id, phone)
);

-- 3. Create Transactions table (Audit Log)
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('add', 'redeem')) NOT NULL,
    amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Loyalty Options table
CREATE TABLE public.loyalty_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('add', 'redeem')) NOT NULL,
    label TEXT NOT NULL,
    value INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_options ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Merchant can only see their own data)
CREATE POLICY "Merchants can view own data" ON public.merchants
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Merchants can manage their customers" ON public.customers
    FOR ALL USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can view their transactions" ON public.transactions
    FOR ALL USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can manage their loyalty options" ON public.loyalty_options
    FOR ALL USING (auth.uid() = merchant_id);

-- Trigger to automatically create a merchant profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.merchants (id, store_name)
  VALUES (new.id, 'My Store'); -- Default name, can be updated later
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
