-- Add sender_id_number column to shipments table
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS sender_id_number TEXT;

COMMENT ON COLUMN shipments.sender_id_number IS 'رقم الهوية أو جواز السفر للمرسل';
