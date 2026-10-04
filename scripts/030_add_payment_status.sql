-- Add payment_status column to shipments table
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- Update existing records: if payment_location is 'sender', set to 'paid', otherwise 'unpaid'
UPDATE shipments 
SET payment_status = CASE 
  WHEN payment_location = 'sender' THEN 'paid'
  ELSE 'unpaid'
END
WHERE payment_status IS NULL OR payment_status = 'unpaid';

-- Add comment to explain the column
COMMENT ON COLUMN shipments.payment_status IS 'Payment status: paid or unpaid. Only paid shipments contribute to revenue.';
