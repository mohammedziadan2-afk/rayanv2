-- Fix RLS policies for debts table
-- Since this is an admin system, we'll allow full access

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations on debts" ON debts;

-- Disable RLS for debts table (since this is an admin-only system)
ALTER TABLE debts DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, uncomment the following:
-- ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow all operations on debts" ON debts
-- FOR ALL
-- USING (true)
-- WITH CHECK (true);
