-- Create additional_revenues table for custom revenue entries
CREATE TABLE IF NOT EXISTS additional_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_additional_revenues_date ON additional_revenues(date);
CREATE INDEX IF NOT EXISTS idx_additional_revenues_category ON additional_revenues(category);

-- Add RLS policies
ALTER TABLE additional_revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON additional_revenues
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON additional_revenues
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON additional_revenues
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON additional_revenues
  FOR DELETE USING (true);
