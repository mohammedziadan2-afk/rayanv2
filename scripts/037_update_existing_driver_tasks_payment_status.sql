-- Update existing driver_tasks to set original_payment_status based on current shipment payment_status
-- This is needed for tasks that were created before the original_payment_status column was added

UPDATE driver_tasks dt
SET original_payment_status = COALESCE(s.payment_status, 'unpaid')
FROM shipments s
WHERE dt.shipment_id = s.id
AND dt.original_payment_status IS NULL;

-- تعديل script لحذف القيم الخاطئة للشحنات القديمة
-- حذف القيم الموجودة في original_payment_status للشحنات القديمة
-- لأنها قد تكون خاطئة (تم تحديثها بناءً على payment_status بعد اعتماد الجلسة)
UPDATE driver_tasks
SET original_payment_status = NULL
WHERE original_payment_status IS NOT NULL
AND created_at < NOW() - INTERVAL '1 day';

-- Set default value for any remaining NULL values
UPDATE driver_tasks
SET original_payment_status = 'unpaid'
WHERE original_payment_status IS NULL;

-- ملاحظة: الشحنات الجديدة ستحصل على original_payment_status الصحيح عند إضافتها
-- الشحنات التي original_payment_status = NULL ستُعتبر unpaid (تم تحصيلها من السائق)
