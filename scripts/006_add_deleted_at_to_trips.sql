-- Add deleted_at column to trips table for soft delete functionality
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance on deleted items
CREATE INDEX IF NOT EXISTS idx_trips_deleted_at ON trips(deleted_at);

-- Add comment to explain the column
COMMENT ON COLUMN trips.deleted_at IS 'Timestamp when the trip was soft deleted. NULL means not deleted.';
