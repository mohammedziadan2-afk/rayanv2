-- تحديث جميع الشحنات القديمة التي تم تسليمها لتصبح في المرحلة 5

-- تحديث current_tracking_stage و stage_5_entered_at للشحنات المسلمة
UPDATE shipments 
SET 
  current_tracking_stage = 5,
  stage_5_entered_at = COALESCE(updated_at, created_at)
WHERE 
  status = 'delivered' 
  AND (current_tracking_stage IS NULL OR current_tracking_stage < 5);

-- إضافة سجلات في جدول التتبع للشحنات المسلمة التي لا يوجد لها سجل في المرحلة 5
INSERT INTO shipment_tracking_history (shipment_id, stage, stage_name, entered_at)
SELECT 
  s.id,
  5,
  'تم تسليم الشحنة بنجاح',
  COALESCE(s.updated_at, s.created_at)
FROM shipments s
WHERE 
  s.status = 'delivered'
  AND NOT EXISTS (
    SELECT 1 
    FROM shipment_tracking_history sth 
    WHERE sth.shipment_id = s.id AND sth.stage = 5
  );
