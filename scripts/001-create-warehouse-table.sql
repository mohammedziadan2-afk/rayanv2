-- إنشاء جدول مستودع الشحنات
CREATE TABLE IF NOT EXISTS public.warehouse_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_name TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  shipment_type TEXT NOT NULL,
  warehouse_quantity NUMERIC NOT NULL DEFAULT 0,
  delivered_quantity NUMERIC NOT NULL DEFAULT 0,
  remaining_quantity NUMERIC GENERATED ALWAYS AS (warehouse_quantity - delivered_quantity) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_created_at ON public.warehouse_inventory(created_at DESC);

-- تفعيل Row Level Security
ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسة للسماح بجميع العمليات (يمكن تخصيصها لاحقاً)
CREATE POLICY "Enable all operations for warehouse_inventory" ON public.warehouse_inventory
  FOR ALL
  USING (true)
  WITH CHECK (true);
