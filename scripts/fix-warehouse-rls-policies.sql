-- Enable RLS on warehouse tables if not already enabled
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_edit_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all operations for warehouse_inventory" ON warehouse_inventory;
DROP POLICY IF EXISTS "Admin has full access to warehouse_edit_history" ON warehouse_edit_history;
DROP POLICY IF EXISTS "Service role full access to warehouse_edit_history" ON warehouse_edit_history;

-- Create comprehensive policies for warehouse_inventory
-- Allow service role complete access (bypasses RLS)
CREATE POLICY "Service role full access to warehouse_inventory"
ON warehouse_inventory
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow admin full access to all warehouse inventory operations
CREATE POLICY "Admin full access to warehouse_inventory"
ON warehouse_inventory
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.id::text = current_setting('request.jwt.claims', true)::json->>'sub'
    AND app_users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.id::text = current_setting('request.jwt.claims', true)::json->>'sub'
    AND app_users.role = 'admin'
  )
);

-- Allow all authenticated users to read warehouse inventory
CREATE POLICY "Authenticated users can read warehouse_inventory"
ON warehouse_inventory
FOR SELECT
TO authenticated
USING (true);

-- Create comprehensive policies for warehouse_edit_history
-- Allow service role complete access (bypasses RLS)
CREATE POLICY "Service role full access to warehouse_edit_history"
ON warehouse_edit_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow admin full access to warehouse edit history
CREATE POLICY "Admin full access to warehouse_edit_history"
ON warehouse_edit_history
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.id::text = current_setting('request.jwt.claims', true)::json->>'sub'
    AND app_users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.id::text = current_setting('request.jwt.claims', true)::json->>'sub'
    AND app_users.role = 'admin'
  )
);

-- Allow authenticated users to read warehouse edit history
CREATE POLICY "Authenticated users can read warehouse_edit_history"
ON warehouse_edit_history
FOR SELECT
TO authenticated
USING (true);

-- Add helpful comment
COMMENT ON TABLE warehouse_inventory IS 'Warehouse inventory with RLS policies for admin and service role';
COMMENT ON TABLE warehouse_edit_history IS 'Warehouse edit history with RLS policies for admin and service role';
