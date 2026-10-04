-- Add driver_fee column to driver_tasks table
ALTER TABLE driver_tasks
ADD COLUMN IF NOT EXISTS driver_fee NUMERIC DEFAULT 0;

-- Update status column to support new statuses
COMMENT ON COLUMN driver_tasks.status IS 'Status: pending, delivered, rejected, postponed, refused';
