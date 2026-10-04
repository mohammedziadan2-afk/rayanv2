-- Drop unused payment columns from shipments table
-- These columns have been replaced with payment_status

ALTER TABLE shipments 
DROP COLUMN IF EXISTS payment_method,
DROP COLUMN IF EXISTS payment_location;

-- Add comment to track the change
COMMENT ON COLUMN shipments.payment_status IS 'Payment status: paid or unpaid. Replaces payment_method and payment_location.';
