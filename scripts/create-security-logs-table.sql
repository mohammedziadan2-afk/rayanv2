-- Creating security_logs table for audit trail
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  username TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  details TEXT,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_logs_username ON security_logs(username);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);

-- Add RLS policies
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all security logs
CREATE POLICY "Admin can view security logs" ON security_logs
  FOR SELECT
  USING (true);

-- Service role can insert security logs
CREATE POLICY "Service role can insert security logs" ON security_logs
  FOR INSERT
  WITH CHECK (true);
