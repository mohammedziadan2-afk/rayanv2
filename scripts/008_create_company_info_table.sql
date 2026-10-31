-- Create company_info table for storing company details
CREATE TABLE IF NOT EXISTS company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on company_info" ON company_info
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default company info if not exists
INSERT INTO company_info (name, address, phone)
VALUES ('شركة الشحن', 'العنوان الافتراضي', '0000000000')
ON CONFLICT DO NOTHING;
