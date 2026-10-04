-- Add session_number column to driver_sessions table
ALTER TABLE driver_sessions ADD COLUMN IF NOT EXISTS session_number INTEGER;

-- Update existing rows with sequential numbers per driver
WITH numbered_sessions AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY driver_id ORDER BY session_date, created_at) as row_num
  FROM driver_sessions
  WHERE session_number IS NULL
)
UPDATE driver_sessions
SET session_number = numbered_sessions.row_num
FROM numbered_sessions
WHERE driver_sessions.id = numbered_sessions.id;

-- Create a unique index on session_number for each driver
CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_sessions_driver_session_number 
ON driver_sessions(driver_id, session_number);

-- Add comment
COMMENT ON COLUMN driver_sessions.session_number IS 'Sequential session number for each driver';
