-- 1. Create Merchants table
-- This table links to Supabase Auth users
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    store_name TEXT NOT NULL,
    settings JSONB DEFAULT '{"reset_timer": 5000}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
    phone TEXT NOT NULL,
    points INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure phone is unique per merchant
    UNIQUE(merchant_id, phone)
);

-- 2.5 Create Branches table
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Transactions table (Audit Log)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    branch_id UUID REFERENCES public.branches(id),
    type TEXT CHECK (type IN ('add', 'redeem')) NOT NULL,
    amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Loyalty Options table
CREATE TABLE IF NOT EXISTS public.loyalty_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('add', 'redeem')) NOT NULL,
    label TEXT NOT NULL,
    value INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Profiles table for RBAC (Admin/Merchant)
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'merchant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role public.user_role DEFAULT 'merchant'::public.user_role,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Merchants
CREATE POLICY "Merchants can view own data" ON public.merchants FOR ALL USING (auth.uid() = id);

-- Customers
CREATE POLICY "Merchants can manage their customers" ON public.customers FOR ALL USING (auth.uid() = merchant_id);

-- Branches
CREATE POLICY "Merchants can manage their branches" ON public.branches FOR ALL USING (auth.uid() = merchant_id);

-- Transactions
CREATE POLICY "Merchants can view their transactions" ON public.transactions FOR ALL USING (auth.uid() = merchant_id);

-- Loyalty Options
CREATE POLICY "Merchants can manage their loyalty options" ON public.loyalty_options FOR ALL USING (auth.uid() = merchant_id);

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger to automatically create a merchant profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create Merchant Entry
  INSERT INTO public.merchants (id, store_name)
  VALUES (new.id, 'My Store');
  
  -- Create Profile Entry
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'merchant');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-up the trigger (drop if exists to ensure order/updates)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
