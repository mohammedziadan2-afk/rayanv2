-- Add deposit and total_amount fields to shipments table
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS deposit DECIMAL(10,2) DEFAULT 0;

-- Update existing records to set total_amount equal to price (the existing amount)
UPDATE shipments SET total_amount = COALESCE(price, 0), deposit = 0 WHERE total_amount IS NULL OR total_amount = 0;
