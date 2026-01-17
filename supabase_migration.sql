-- Add login_key to branches table
ALTER TABLE branches ADD COLUMN IF NOT EXISTS login_key VARCHAR(20);

-- Enable RLS to allow public access to branches specifically for login check (if needed)
-- Or ideally, create a secure function to verify key. For now, we assume implicit access or existing policies.
-- Ideally, ensure login_key is unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_login_key ON branches(login_key);

-- Add branch_id to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
