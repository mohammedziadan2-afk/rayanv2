-- Enable RLS on app_users table
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on app_users
-- Since we're using custom authentication (not Supabase Auth),
-- we need to allow all operations for the service role
CREATE POLICY "Allow all operations on app_users" ON app_users
FOR ALL
USING (true)
WITH CHECK (true);
