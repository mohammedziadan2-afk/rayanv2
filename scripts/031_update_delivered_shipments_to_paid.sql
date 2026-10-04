-- تحديث حالة الدفع لجميع الشحنات المسلمة إلى مدفوع
-- Update payment status for all delivered shipments to paid

UPDATE shipments
SET payment_status = 'paid'
WHERE status = 'delivered'
  AND (payment_status IS NULL OR payment_status = 'unpaid');

-- عرض عدد الشحنات التي تم تحديثها
-- Display count of updated shipments
SELECT COUNT(*) as updated_count
FROM shipments
WHERE status = 'delivered' AND payment_status = 'paid';
