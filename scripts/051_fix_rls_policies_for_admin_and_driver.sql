-- Fix RLS policies to grant admin full access and allow drivers to update shipment status

-- ============================================
-- 1. Fix drivers table RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admin has full access to drivers" ON drivers;
DROP POLICY IF EXISTS "Service role full access to drivers" ON drivers;
DROP POLICY IF EXISTS "Drivers can view their own profile" ON drivers;

-- Create new policies
-- Service role has full access (bypasses RLS)
CREATE POLICY "Service role full access to drivers" ON drivers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admin users have full access
CREATE POLICY "Admin has full access to drivers" ON drivers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id::text = current_user
      AND app_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id::text = current_user
      AND app_users.role = 'admin'
    )
  );

-- Drivers can view their own profile
CREATE POLICY "Drivers can view their own profile" ON drivers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id::text = current_user
      AND app_users.role = 'driver'
      AND app_users.username = drivers.name
    )
  );

-- ============================================
-- 2. Fix trips table RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admin has full access to trips" ON trips;
DROP POLICY IF EXISTS "Service role full access to trips" ON trips;

-- Create new policies
-- Service role has full access (bypasses RLS)
CREATE POLICY "Service role full access to trips" ON trips
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admin users have full access
CREATE POLICY "Admin has full access to trips" ON trips
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id::text = current_user
      AND app_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id::text = current_user
      AND app_users.role = 'admin'
    )
  );

-- ============================================
-- 3. Fix driver_tasks table RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admin has full access to driver_tasks" ON driver_tasks;
DROP POLICY IF EXISTS "Service role full access to driver_tasks" ON driver_tasks;
DROP POLICY IF EXISTS "Drivers can view their own tasks" ON driver_tasks;

-- Create new policies
-- Service role has full access (bypasses RLS)
CREATE POLICY "Service role full access to driver_tasks" ON driver_tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admin users have full access
CREATE POLICY "Admin has full access to driver_tasks" ON driver_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id::text = current_user
      AND app_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id::text = current_user
      AND app_users.role = 'admin'
    )
  );

-- Drivers can view and update their own tasks
CREATE POLICY "Drivers can view their own tasks" ON driver_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      JOIN drivers ON drivers.name = app_users.username
      WHERE app_users.id::text = current_user
      AND app_users.role = 'driver'
      AND driver_tasks.driver_id = drivers.id
    )
  );

-- Drivers can update their own tasks (status, driver_fee, completed_date, notes)
CREATE POLICY "Drivers can update their own tasks" ON driver_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      JOIN drivers ON drivers.name = app_users.username
      WHERE app_users.id::text = current_user
      AND app_users.role = 'driver'
      AND driver_tasks.driver_id = drivers.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      JOIN drivers ON drivers.name = app_users.username
      WHERE app_users.id::text = current_user
      AND app_users.role = 'driver'
      AND driver_tasks.driver_id = drivers.id
    )
  );

-- ============================================
-- 4. Fix shipments table RLS policies to allow driver updates
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON shipments;

-- Create new policies
-- Service role has full access (bypasses RLS)
CREATE POLICY "Service role full access to shipments" ON shipments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admin users have full access
CREATE POLICY "Admin has full access to shipments" ON shipments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id::text = current_user
      AND app_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id::text = current_user
      AND app_users.role = 'admin'
    )
  );

-- Drivers can view shipments assigned to them
CREATE POLICY "Drivers can view their assigned shipments" ON shipments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      JOIN drivers ON drivers.name = app_users.username
      JOIN driver_tasks ON driver_tasks.driver_id = drivers.id
      WHERE app_users.id::text = current_user
      AND app_users.role = 'driver'
      AND driver_tasks.shipment_id = shipments.id
    )
  );

-- Drivers can update status of shipments assigned to them
CREATE POLICY "Drivers can update their assigned shipments status" ON shipments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      JOIN drivers ON drivers.name = app_users.username
      JOIN driver_tasks ON driver_tasks.driver_id = drivers.id
      WHERE app_users.id::text = current_user
      AND app_users.role = 'driver'
      AND driver_tasks.shipment_id = shipments.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      JOIN drivers ON drivers.name = app_users.username
      JOIN driver_tasks ON driver_tasks.driver_id = drivers.id
      WHERE app_users.id::text = current_user
      AND app_users.role = 'driver'
      AND driver_tasks.shipment_id = shipments.id
    )
  );

-- Anyone can view shipments with tracking number (for public tracking)
CREATE POLICY "Anyone can view shipments with tracking number" ON shipments
  FOR SELECT
  USING (tracking_number IS NOT NULL);
