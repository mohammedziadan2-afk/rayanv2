-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج المستخدم الافتراضي
INSERT INTO app_users (username, password, role, full_name)
VALUES ('admin', 'admin123', 'admin', 'المدير')
ON CONFLICT (username) DO NOTHING;
