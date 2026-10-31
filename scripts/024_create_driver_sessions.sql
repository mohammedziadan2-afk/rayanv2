-- Create driver_sessions table to track driver work sessions
CREATE TABLE IF NOT EXISTS driver_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_revenue NUMERIC DEFAULT 0,
  total_driver_fee NUMERIC DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add session_id to driver_tasks
ALTER TABLE driver_tasks ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES driver_sessions(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver_id ON driver_sessions(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_date ON driver_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_driver_tasks_session_id ON driver_tasks(session_id);

COMMENT ON TABLE driver_sessions IS 'Tracks driver work sessions with summary statistics';
COMMENT ON COLUMN driver_sessions.session_date IS 'Date and time when the session was created';
COMMENT ON COLUMN driver_sessions.total_revenue IS 'Total revenue from delivered shipments in this session';
COMMENT ON COLUMN driver_sessions.total_driver_fee IS 'Total driver fees for delivered shipments in this session';
COMMENT ON COLUMN driver_sessions.delivered_count IS 'Number of shipments delivered in this session';
