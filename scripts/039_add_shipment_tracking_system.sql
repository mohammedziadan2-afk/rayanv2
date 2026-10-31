-- إضافة جدول تتبع مراحل الشحنات
CREATE TABLE IF NOT EXISTS shipment_tracking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL CHECK (stage >= 1 AND stage <= 5),
  stage_name TEXT NOT NULL,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة عمود المرحلة الحالية في جدول الشحنات
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS current_tracking_stage INTEGER DEFAULT 1 CHECK (current_tracking_stage >= 1 AND current_tracking_stage <= 5),
ADD COLUMN IF NOT EXISTS stage_2_entered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stage_3_entered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stage_4_entered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stage_5_entered_at TIMESTAMP WITH TIME ZONE;

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_history_shipment_id ON shipment_tracking_history(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipments_current_tracking_stage ON shipments(current_tracking_stage);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);

-- تحديث الشحنات الموجودة لتكون في المرحلة المناسبة
UPDATE shipments 
SET current_tracking_stage = CASE 
  WHEN status = 'delivered' THEN 5
  WHEN status = 'in_transit' THEN 4
  WHEN status = 'pending' THEN 1
  ELSE 1
END
WHERE current_tracking_stage IS NULL;
