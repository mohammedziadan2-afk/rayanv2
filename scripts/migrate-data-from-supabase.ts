import { neon } from "@neondatabase/serverless"

/**
 * هذا السكريبت لنقل البيانات من Supabase إلى Neon
 *
 * الخطوات المطلوبة:
 * 1. تصدير البيانات من Supabase (استخدم أداة pg_dump أو Supabase Dashboard)
 * 2. تشغيل هذا السكريبت لاستيراد البيانات إلى Neon
 *
 * للتصدير من Supabase:
 * - اذهب إلى Supabase Dashboard > Settings > Database
 * - انسخ Connection String
 * - استخدم pg_dump: pg_dump -h <host> -U postgres -d postgres --data-only --inserts > data.sql
 *
 * أو استخدم Supabase Studio:
 * - Database > Backups > Download Backup
 */

const sql = neon(process.env.NEON_DATABASE_URL!)

console.log("[v0] بدء نقل البيانات من Supabase إلى Neon...")
console.log("[v0] تأكد من أنك قمت بتصدير البيانات من Supabase أولاً!")

console.log(`
==============================================
📋 دليل نقل البيانات من Supabase إلى Neon
==============================================

الطريقة 1: استخدام Supabase Dashboard
--------------------------------------
1. اذهب إلى: https://supabase.com/dashboard/project/kcncyhdvzexvrwsmetow
2. اضغط على "Database" من القائمة الجانبية
3. اضغط على "Backups"
4. اضغط على "Download Backup" لتحميل نسخة احتياطية كاملة

الطريقة 2: استخدام pg_dump (من سطر الأوامر)
-----------------------------------------------
1. احصل على Connection String من Supabase:
   Settings > Database > Connection String
   
2. استخدم pg_dump لتصدير البيانات فقط:
   pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \\
     --data-only \\
     --inserts \\
     --column-inserts \\
     -t shipments \\
     -t drivers \\
     -t trips \\
     -t app_users \\
     -t company_info \\
     -t driver_sessions \\
     -t driver_tasks \\
     -t shipment_tracking_history \\
     -t invoices \\
     -t invoice_items \\
     -t expenses \\
     -t debts \\
     -t news \\
     -t shipment_ratings \\
     -t shipping_requests \\
     -t additional_revenues \\
     -t notifications \\
     -t warehouse_inventory \\
     -t messages \\
     -t backups \\
     > supabase_data.sql

3. بعد ذلك، استورد البيانات إلى Neon باستخدام:
   psql "${process.env.NEON_DATABASE_URL}" < supabase_data.sql

الطريقة 3: نسخ يدوي للجداول المهمة
------------------------------------
إذا كانت لديك بيانات قليلة، يمكنك:

1. فتح Supabase Table Editor
2. تحديد جميع الصفوف من كل جدول
3. نسخها كـ CSV أو JSON
4. استيرادها يدوياً في Neon عبر SQL

مثال على استعلام النسخ:
SELECT * FROM shipments WHERE deleted_at IS NULL;

الجداول الأساسية التي يجب نقلها:
✓ company_info (معلومات الشركة)
✓ app_users (المستخدمين)
✓ drivers (السائقين)
✓ trips (الرحلات)
✓ shipments (الشحنات)
✓ driver_sessions (جلسات السائقين)
✓ driver_tasks (مهام السائقين)
✓ expenses (المصروفات)
✓ debts (الديون)
✓ invoices + invoice_items (الفواتير)

==============================================
`)

console.log("[v0] الرجاء متابعة الدليل أعلاه لنقل بياناتك من Supabase إلى Neon")
