# دليل التثبيت والإعداد الآمن

## المتطلبات الأساسية

- Node.js 18.x أو أحدث
- PostgreSQL database (Neon recommended)
- npm أو yarn

## خطوات التثبيت

### 1. تنزيل المشروع

```bash
# تنزيل المشروع
git clone <repository-url>
cd alrayan_company

# تثبيت التبعيات
npm install
```

### 2. إعداد قاعدة البيانات

#### أ. إنشاء قاعدة البيانات في Neon

1. سجل حساب في [Neon](https://neon.tech)
2. أنشئ مشروع جديد
3. احصل على connection string

#### ب. تشغيل Migration Scripts

```bash
# تشغيل جميع migrations
npm run migrate
```

### 3. إعداد Environment Variables

أنشئ ملف `.env.local`:

```env
# Database Configuration
POSTGRES_URL=postgresql://user:password@host/database
NEON_DATABASE_URL=postgresql://user:password@host/database

# Admin Setup (استخدام مرة واحدة فقط)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=YourSecurePassword123!

# Optional: Custom Admin Username
# DEFAULT_ADMIN_USERNAME=your_custom_admin
```

### 4. إنشاء حساب المدير

```bash
# تشغيل script إنشاء المدير
npm run create-admin
```

**⚠️ مهم جداً**:
- استخدم كلمة مرور قوية (10+ أحرف، حروف كبيرة وصغيرة وأرقام)
- قم بحذف أو تعليق `DEFAULT_ADMIN_PASSWORD` من `.env.local` بعد الإنشاء
- قم بتغيير كلمة المرور من داخل التطبيق بعد أول تسجيل دخول

### 5. تشغيل التطبيق

```bash
# Development
npm run dev

# Production Build
npm run build
npm start
```

## الإعداد الآمن للإنتاج

### 1. Environment Variables

**لا تُضمن** ملف `.env.local` في Git. تأكد من أنه مدرج في `.gitignore`.

في الإنتاج (Vercel/Production):
1. أضف جميع environment variables في لوحة التحكم
2. استخدم كلمات مرور قوية ومعقدة
3. قم بتدوير الأسرار بانتظام

### 2. HTTPS

تأكد من تفعيل HTTPS في الإنتاج. التطبيق يفرض HTTPS عبر:
- Strict-Transport-Security header
- Secure cookie flag

### 3. Database Security

- استخدم strong passwords لقاعدة البيانات
- قم بتفعيل SSL للاتصال بقاعدة البيانات
- حدد IP whitelist في Neon إن أمكن

### 4. النسخ الاحتياطية

قم بإعداد نسخ احتياطية تلقائية:

```bash
# يدوي
npm run backup

# أو استخدم الواجهة: الإعدادات > النسخ الاحتياطية
```

### 5. المراقبة

- راقب `security_logs` table بانتظام
- قم بإعداد alerts لـ:
  - محاولات تسجيل دخول فاشلة متكررة
  - Rate limit violations
  - Account lockouts

## التحديثات الأمنية

### تحديث التبعيات

```bash
# فحص الثغرات
npm audit

# إصلاح الثغرات
npm audit fix

# تحديث التبعيات
npm update
```

### Security Patches

عند صدور security patches:

1. قم بتحديث التبعيات المتأثرة
2. اختبر التطبيق كاملاً
3. deploy التحديثات فوراً
4. وثّق التغييرات

## Troubleshooting

### مشكلة: لا يمكن تسجيل الدخول

**الحل**:
```bash
# إعادة تعيين كلمة مرور admin
ADMIN_USERNAME=admin ADMIN_PASSWORD=NewSecurePassword123! npm run create-admin
```

### مشكلة: Database connection error

**تحقق من**:
- صحة POSTGRES_URL في .env.local
- اتصال الإنترنت
- أن قاعدة البيانات تعمل

### مشكلة: Rate limit exceeded

**الحل**:
- انتظر 15 دقيقة
- أو restart التطبيق لإعادة تعيين rate limits

## الدعم

للمساعدة:
- documentation: راجع SECURITY.md
- issues: افتح issue في GitHub
- email: support@alrayan.example
