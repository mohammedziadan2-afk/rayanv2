-- حذف أعمدة payment_method و payment_location من جدول shipments
-- هذه الأعمدة لم تعد مستخدمة، تم استبدالها بـ payment_status

ALTER TABLE shipments
DROP COLUMN IF EXISTS payment_method,
DROP COLUMN IF EXISTS payment_location;

-- تأكيد أن payment_status موجود
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- إنشاء index على payment_status لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_shipments_payment_status ON shipments(payment_status);
