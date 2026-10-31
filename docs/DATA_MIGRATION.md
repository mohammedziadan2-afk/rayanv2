# دليل نقل البيانات من Supabase إلى Neon

## الخطوة 1: تصدير البيانات من Supabase

### الطريقة الأولى: استخدام Supabase Dashboard (الأسهل)

1. افتح [Supabase Dashboard](https://supabase.com/dashboard/project/kcncyhdvzexvrwsmetow)
2. اذهب إلى **Database** > **Backups**
3. اضغط على **Download Backup**
4. سيتم تحميل ملف SQL يحتوي على جميع البيانات

### الطريقة الثانية: استخدام pg_dump

```bash
# استبدل [PASSWORD] و [HOST] بالقيم الصحيحة من Supabase
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  --data-only \
  --inserts \
  --column-inserts \
  --no-owner \
  --no-acl \
  -f supabase_backup.sql
```

## الخطوة 2: استيراد البيانات إلى Neon

### استخدام psql

```bash
# استخدم NEON_DATABASE_URL من متغيرات البيئة
psql "${NEON_DATABASE_URL}" < supabase_backup.sql
```

### استخدام Neon Console

1. افتح [Neon Console](https://console.neon.tech/app/projects/steep-bird-66805341)
2. اذهب إلى **SQL Editor**
3. الصق محتوى ملف SQL المصدر
4. اضغط **Run**

## الخطوة 3: التحقق من البيانات

بعد الاستيراد، تحقق من أن البيانات تم نقلها بنجاح:

```sql
-- تحقق من عدد الشحنات
SELECT COUNT(*) FROM shipments WHERE deleted_at IS NULL;

-- تحقق من عدد السائقين
SELECT COUNT(*) FROM drivers WHERE deleted_at IS NULL;

-- تحقق من عدد الرحلات
SELECT COUNT(*) FROM trips WHERE deleted_at IS NULL;

-- تحقق من المستخدمين
SELECT COUNT(*) FROM app_users;
```

## ملاحظات مهمة

1. **المستخدم الافتراضي**: بعد النقل، قد تحتاج لإعادة تعيين كلمات مرور المستخدمين
2. **الصور والملفات**: إذا كان لديك صور أو ملفات مخزنة في Supabase Storage، يجب نقلها يدوياً
3. **التتابع (Sequences)**: قد تحتاج لضبط قيم التتابع بعد الاستيراد

```sql
-- ضبط قيم التتابع للجداول الرئيسية
SELECT setval('shipments_id_seq', (SELECT MAX(id) FROM shipments));
SELECT setval('drivers_id_seq', (SELECT MAX(id) FROM drivers));
SELECT setval('trips_id_seq', (SELECT MAX(id) FROM trips));
```

## استكشاف الأخطاء

### خطأ: "relation already exists"

إذا حصلت على هذا الخطأ، الجداول موجودة بالفعل. استخدم:

```sql
-- امسح البيانات القديمة (احذر!)
TRUNCATE TABLE shipments CASCADE;
```

### خطأ: "duplicate key value"

قد يكون هناك تضارب في المفاتيح الأساسية. جرب:

```bash
# استخدم --clean لمسح البيانات القديمة أولاً
psql "${NEON_DATABASE_URL}" --clean < supabase_backup.sql
