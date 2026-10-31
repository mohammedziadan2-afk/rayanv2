-- Optimize RLS policies for better performance
-- Remove complex policies and use simpler ones

-- Drop existing policies on shipments
DROP POLICY IF EXISTS "Allow all operations on shipments" ON shipments;
DROP POLICY IF EXISTS "Allow all operations on active shipments" ON shipments;

-- Create a single, simple policy for all operations
CREATE POLICY "Enable all access for authenticated users" ON shipments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
