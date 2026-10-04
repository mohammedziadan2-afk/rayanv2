-- Create warehouse edit history table to track quantity changes
CREATE TABLE IF NOT EXISTS warehouse_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_item_id UUID NOT NULL REFERENCES warehouse_inventory(id) ON DELETE CASCADE,
  edit_type TEXT NOT NULL, -- 'received' or 'delivered'
  old_quantity NUMERIC NOT NULL,
  new_quantity NUMERIC NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_warehouse_edit_history_item_id ON warehouse_edit_history(warehouse_item_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_edit_history_edited_at ON warehouse_edit_history(edited_at DESC);
