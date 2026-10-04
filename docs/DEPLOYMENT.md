# دليل النشر - مؤسسة الريان واريان للشحن

## متطلبات النشر

### Environment Variables المطلوبة
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
DEFAULT_ADMIN_PASSWORD=your_secure_password

# Optional
NODE_ENV=production
```

## خطوات النشر على Vercel

### 1. الإعداد الأولي
```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# ربط المشروع
vercel link
```

### 2. إضافة Environment Variables
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DEFAULT_ADMIN_PASSWORD
```

### 3. النشر
```bash
# نشر للمعاينة
vercel

# نشر للإنتاج
vercel --prod
```

## ما بعد النشر

### 1. تشغيل Migration Scripts
```bash
# إنشاء indexes
psql $DATABASE_URL -f scripts/add-performance-indexes.sql

# تحديث الشحنات القديمة
psql $DATABASE_URL -f scripts/update-old-delivered-shipments.sql
```

### 2. التحقق من صحة النشر
- زيارة `/api/health` للتحقق من صحة النظام
- تسجيل الدخول والتحقق من الصلاحيات
- اختبار إنشاء شحنة جديدة
- التحقق من التقارير والإحصائيات

### 3. المراقبة
- فعّل Vercel Analytics
- راقب `/api/health` بانتظام
- راجع security_logs يومياً

## الصيانة

### نسخ احتياطي دوري
```bash
# يدوي
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# مجدول (cron)
0 2 * * * pg_dump $DATABASE_URL > /backups/backup_$(date +\%Y\%m\%d).sql
```

### تحديث Dependencies
```bash
# كل شهر
npm update
npm audit fix

# إعادة النشر
vercel --prod
```

## استكشاف الأخطاء

### مشاكل شائعة

**خطأ: "Failed to fetch"**
- تحقق من CORS settings
- راجع environment variables
- افحص Supabase connection

**بطء الأداء**
- راجع database indexes
- فعّل caching
- قلل حجم الصفحات

**مشاكل RLS**
- راجع RLS policies في Supabase
- تأكد من service role key صحيح

## الدعم
للحصول على مساعدة: support@alrayan.com
