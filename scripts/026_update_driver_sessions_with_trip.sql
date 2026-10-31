-- Add trip_id to driver_sessions table to link sessions with trips
ALTER TABLE driver_sessions ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_driver_sessions_trip_id ON driver_sessions(trip_id);

COMMENT ON COLUMN driver_sessions.trip_id IS 'Links the session to a specific trip';
