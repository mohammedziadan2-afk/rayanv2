-- إضافة عمود is_read لتتبع الطلبات الجديدة
ALTER TABLE shipping_requests 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- تحديث الطلبات الموجودة كـ "مقروءة"
UPDATE shipping_requests 
SET is_read = true 
WHERE is_read IS NULL;
