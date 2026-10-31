-- Add due_date column to debts table
ALTER TABLE debts ADD COLUMN IF NOT EXISTS due_date DATE;

-- Create index for faster queries on due_date
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
