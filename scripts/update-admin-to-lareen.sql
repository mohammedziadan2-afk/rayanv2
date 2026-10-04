-- تحديث كلمة مرور الأدمن مباشرة إلى lareen85hh@
UPDATE app_users 
SET password = 'lareen85hh@', 
    updated_at = NOW()
WHERE username = 'admin' AND role = 'admin';

-- عرض النتيجة للتأكد
SELECT username, role, updated_at 
FROM app_users 
WHERE username = 'admin';
