-- Add location_image column to shipments table to store map screenshots
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS location_image TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN shipments.location_image IS 'Base64 encoded screenshot of the map when location was saved';
