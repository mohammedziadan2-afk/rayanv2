-- تحديث جدول الشحنات ليتوافق مع البنية الحالية
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS sender_phone TEXT,
ADD COLUMN IF NOT EXISTS sender_address TEXT,
ADD COLUMN IF NOT EXISTS sender_country TEXT,
ADD COLUMN IF NOT EXISTS receiver_name TEXT,
ADD COLUMN IF NOT EXISTS receiver_phone TEXT,
ADD COLUMN IF NOT EXISTS receiver_address TEXT,
ADD COLUMN IF NOT EXISTS receiver_country TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS weight NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS payment_location TEXT DEFAULT 'sender',
ADD COLUMN IF NOT EXISTS location JSONB;

-- إنشاء فهرس لرقم التتبع
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
