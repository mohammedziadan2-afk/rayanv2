-- إضافة عمود رقم التتبع لربط شحنات المستودع بالشحنات الرئيسية
ALTER TABLE warehouse_inventory
ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- إضافة فهرس لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_warehouse_tracking_number ON warehouse_inventory(tracking_number);
