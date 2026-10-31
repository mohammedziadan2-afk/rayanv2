-- إصلاح حالة جلسة السائق محمد شديد

-- 1. ابحث عن الجلسات التي جميع مهامها مكتملة لكنها غير مقفلة
WITH completed_sessions AS (
  SELECT 
    ds.id as session_id,
    ds.driver_id,
    d.name as driver_name,
    COUNT(dt.id) as total_tasks,
    COUNT(CASE WHEN dt.status = 'delivered' THEN 1 END) as delivered_tasks,
    COUNT(CASE WHEN dt.status = 'postponed' THEN 1 END) as postponed_tasks,
    COUNT(CASE WHEN dt.status = 'pending' THEN 1 END) as pending_tasks
  FROM driver_sessions ds
  JOIN drivers d ON ds.driver_id = d.id
  LEFT JOIN driver_tasks dt ON ds.id = dt.session_id
  WHERE ds.is_approved = false
    AND d.name LIKE '%محمد شديد%'
  GROUP BY ds.id, ds.driver_id, d.name
  HAVING COUNT(CASE WHEN dt.status = 'pending' THEN 1 END) = 0
     AND COUNT(dt.id) > 0
)
SELECT * FROM completed_sessions;

-- 2. إقفال الجلسات المكتملة تلقائياً
UPDATE driver_sessions
SET 
  is_approved = true,
  approved_at = NOW()
WHERE id IN (
  SELECT ds.id
  FROM driver_sessions ds
  LEFT JOIN driver_tasks dt ON ds.id = dt.session_id
  WHERE ds.is_approved = false
  GROUP BY ds.id
  HAVING COUNT(CASE WHEN dt.status = 'pending' THEN 1 END) = 0
     AND COUNT(dt.id) > 0
);

-- 3. التحقق من النتيجة - عرض الجلسات غير المقبوضة للسائق محمد شديد
SELECT 
  d.name as driver_name,
  ds.id as session_id,
  ds.start_time,
  ds.is_approved,
  ds.is_collected,
  ds.total_revenue,
  ds.total_driver_fee,
  ds.delivered_count
FROM drivers d
JOIN driver_sessions ds ON d.id = ds.driver_id
WHERE d.name LIKE '%محمد شديد%'
  AND ds.is_approved = true
  AND ds.is_collected = false
ORDER BY ds.start_time DESC;
