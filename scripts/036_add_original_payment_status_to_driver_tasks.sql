-- Add original_payment_status column to driver_tasks table
-- This tracks the payment status when the shipment was first assigned to the driver
ALTER TABLE driver_tasks
ADD COLUMN IF NOT EXISTS original_payment_status TEXT CHECK (original_payment_status IN ('paid', 'unpaid'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_driver_tasks_original_payment_status ON driver_tasks(original_payment_status);

-- Add comment
COMMENT ON COLUMN driver_tasks.original_payment_status IS 'Original payment status when shipment was assigned to driver (paid/unpaid)';
