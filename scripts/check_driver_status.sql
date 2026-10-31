-- فحص حالة السائق محمد شديد
-- ابحث عن السائق
SELECT 
  d.id as driver_id,
  d.name as driver_name,
  d.phone,
  d.status
FROM drivers d
WHERE d.name LIKE '%محمد شديد%';

-- فحص جلساته غير المقبوضة
SELECT 
  ds.id as session_id,
  ds.start_time,
  ds.end_time,
  ds.is_approved,
  ds.is_collected,
  COUNT(dt.id) as total_tasks,
  COUNT(CASE WHEN dt.status = 'delivered' THEN 1 END) as delivered_tasks,
  COUNT(CASE WHEN dt.status = 'postponed' THEN 1 END) as postponed_tasks,
  COUNT(CASE WHEN dt.status = 'pending' THEN 1 END) as pending_tasks
FROM driver_sessions ds
LEFT JOIN driver_tasks dt ON ds.id = dt.session_id
WHERE ds.driver_id = (SELECT id FROM drivers WHERE name LIKE '%محمد شديد%' LIMIT 1)
  AND ds.is_approved = false
GROUP BY ds.id, ds.start_time, ds.end_time, ds.is_approved, ds.is_collected
ORDER BY ds.start_time DESC;

-- فحص المهام المعلقة في الجلسات النشطة
SELECT 
  dt.id as task_id,
  dt.status,
  dt.driver_fee,
  s.id as shipment_id,
  s.tracking_number,
  s.delivery_status,
  s.payment_status
FROM driver_tasks dt
JOIN shipments s ON dt.shipment_id = s.id
JOIN driver_sessions ds ON dt.session_id = ds.id
WHERE ds.driver_id = (SELECT id FROM drivers WHERE name LIKE '%محمد شديد%' LIMIT 1)
  AND ds.is_approved = false
  AND dt.status != 'delivered'
ORDER BY dt.created_at DESC;
