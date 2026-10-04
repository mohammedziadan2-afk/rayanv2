-- Create debts table for tracking receivables and payables
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  debt_type TEXT NOT NULL CHECK (debt_type IN ('receivable', 'payable')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial')),
  paid_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_debts_shipment_id ON debts(shipment_id);
CREATE INDEX IF NOT EXISTS idx_debts_tracking_number ON debts(tracking_number);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_debt_type ON debts(debt_type);
