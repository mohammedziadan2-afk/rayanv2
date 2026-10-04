-- Add item_name column to warehouse_inventory table
ALTER TABLE warehouse_inventory
ADD COLUMN IF NOT EXISTS item_name TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN warehouse_inventory.item_name IS 'Name of the warehouse item';
