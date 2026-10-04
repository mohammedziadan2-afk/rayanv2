-- Create driver_tasks table to store assigned shipments for drivers
CREATE TABLE IF NOT EXISTS driver_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('included', 'not_included')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'delivered', 'failed')),
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(driver_id, shipment_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_driver_tasks_driver_id ON driver_tasks(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_tasks_shipment_id ON driver_tasks(shipment_id);
CREATE INDEX IF NOT EXISTS idx_driver_tasks_status ON driver_tasks(status);
CREATE INDEX IF NOT EXISTS idx_driver_tasks_assigned_date ON driver_tasks(assigned_date);

-- Add comment
COMMENT ON TABLE driver_tasks IS 'Stores assigned shipments for drivers with delivery type and status';
