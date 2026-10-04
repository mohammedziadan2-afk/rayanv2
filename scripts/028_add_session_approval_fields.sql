-- Add approval and collection tracking fields to driver_sessions
ALTER TABLE driver_sessions ADD COLUMN IF NOT EXISTS remaining_collection NUMERIC DEFAULT 0;
ALTER TABLE driver_sessions ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE driver_sessions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE driver_sessions ADD COLUMN IF NOT EXISTS approved_by UUID;

COMMENT ON COLUMN driver_sessions.remaining_collection IS 'Amount remaining to be collected from driver (revenue - driver fees)';
COMMENT ON COLUMN driver_sessions.is_approved IS 'Whether the session has been approved and finalized';
COMMENT ON COLUMN driver_sessions.approved_at IS 'Timestamp when the session was approved';
COMMENT ON COLUMN driver_sessions.approved_by IS 'User ID who approved the session';
