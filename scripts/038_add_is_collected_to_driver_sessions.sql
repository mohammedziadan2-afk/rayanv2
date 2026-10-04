-- Add is_collected column to driver_sessions table
ALTER TABLE driver_sessions
ADD COLUMN IF NOT EXISTS is_collected BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN driver_sessions.is_collected IS 'Indicates whether the session collection has been received from the driver';

-- Update existing sessions to false (not collected yet)
UPDATE driver_sessions
SET is_collected = false
WHERE is_collected IS NULL;
