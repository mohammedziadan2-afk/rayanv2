-- Update admin password to haifa92hh
UPDATE app_users 
SET 
  password = 'haifa92hh',
  updated_at = NOW()
WHERE username = 'admin';

-- If admin user doesn't exist, create it
INSERT INTO app_users (id, username, password, role, full_name, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'admin',
  'haifa92hh',
  'admin',
  'Administrator',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM app_users WHERE username = 'admin'
);
