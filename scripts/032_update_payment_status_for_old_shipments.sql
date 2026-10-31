-- تحديث حالة الدفع للشحنات القديمة
-- الشحنات التي تم توصيلها تصبح مدفوعة
-- الشحنات الأخرى تصبح غير مدفوعة (يمكن تعديلها يدوياً)

-- تحديث الشحنات التي تم توصيلها إلى مدفوع
UPDATE shipments
SET payment_status = 'paid'
WHERE status = 'delivered'
  AND (payment_status IS NULL OR payment_status = 'unpaid');

-- تحديث باقي الشحنات إلى غير مدفوع
UPDATE shipments
SET payment_status = 'unpaid'
WHERE payment_status IS NULL;
