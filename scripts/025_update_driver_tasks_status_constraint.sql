-- Update driver_tasks status constraint to include new statuses
-- Drop the old constraint
ALTER TABLE driver_tasks DROP CONSTRAINT IF EXISTS driver_tasks_status_check;

-- Add new constraint with updated status values
ALTER TABLE driver_tasks ADD CONSTRAINT driver_tasks_status_check 
  CHECK (status IN ('pending', 'delivered', 'rejected', 'postponed', 'refused'));

-- Add comment
COMMENT ON COLUMN driver_tasks.status IS 'Status of the delivery task: pending, delivered, rejected, postponed, refused';
