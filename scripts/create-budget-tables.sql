-- Create budget system tables

-- جدول الميزانية النهائية (حفظ النتائج المحسوبة)
CREATE TABLE IF NOT EXISTS budget_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_revenue NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  final_budget NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE budget_summaries ENABLE ROW LEVEL SECURITY;

-- Policies for budget_summaries
CREATE POLICY "Allow all operations on budget_summaries"
ON budget_summaries FOR ALL
USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_budget_summaries_dates ON budget_summaries(start_date, end_date);
