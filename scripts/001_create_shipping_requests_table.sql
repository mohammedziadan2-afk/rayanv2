-- Create shipping_requests table
CREATE TABLE IF NOT EXISTS public.shipping_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  pickup_location TEXT NOT NULL,
  pickup_address TEXT,
  delivery_location TEXT NOT NULL,
  delivery_address TEXT,
  package_description TEXT,
  estimated_weight NUMERIC,
  estimated_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_shipping_requests_status ON public.shipping_requests(status);
CREATE INDEX IF NOT EXISTS idx_shipping_requests_customer_name ON public.shipping_requests(customer_name);
CREATE INDEX IF NOT EXISTS idx_shipping_requests_request_number ON public.shipping_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_shipping_requests_request_date ON public.shipping_requests(request_date DESC);

-- Insert sample data
INSERT INTO public.shipping_requests (request_number, customer_name, customer_phone, pickup_location, pickup_address, delivery_location, delivery_address, package_description, estimated_weight, estimated_value, status, notes, request_date)
VALUES
  ('REQ-2024-001', 'أحمد محمد', '0791234567', 'عمان', 'شارع الجامعة، عمان', 'إربد', 'شارع الملك عبدالله، إربد', 'أجهزة إلكترونية', 5.5, 250.00, 'pending', 'يرجى التعامل بحذر', NOW() - INTERVAL '2 days'),
  ('REQ-2024-002', 'فاطمة علي', '0797654321', 'الزرقاء', 'حي الجامعة، الزرقاء', 'عمان', 'شارع المدينة المنورة، عمان', 'ملابس', 3.0, 150.00, 'approved', NULL, NOW() - INTERVAL '1 day'),
  ('REQ-2024-003', 'محمود حسن', '0798765432', 'عمان', 'شارع الرينبو، عمان', 'العقبة', 'شارع الكورنيش، العقبة', 'مستلزمات طبية', 8.0, 500.00, 'processing', 'طلب عاجل', NOW() - INTERVAL '5 hours'),
  ('REQ-2024-004', 'سارة خالد', '0799876543', 'إربد', 'شارع الجامعة الأردنية، إربد', 'عمان', 'شارع الجاردنز، عمان', 'كتب ومستندات', 2.5, 80.00, 'pending', NULL, NOW() - INTERVAL '3 hours'),
  ('REQ-2024-005', 'عمر يوسف', '0790123456', 'عمان', 'شارع مكة، عمان', 'الكرك', 'شارع الملك حسين، الكرك', 'أثاث منزلي', 25.0, 800.00, 'rejected', 'الوزن يتجاوز الحد المسموح', NOW() - INTERVAL '1 hour'),
  ('REQ-2024-006', 'ليلى أحمد', '0792345678', 'السلط', 'شارع الحمام، السلط', 'عمان', 'شارع الوحدات، عمان', 'هدايا', 1.5, 120.00, 'approved', NULL, NOW() - INTERVAL '30 minutes'),
  ('REQ-2024-007', 'خالد محمود', '0793456789', 'عمان', 'شارع الجامعة الأردنية، عمان', 'معان', 'شارع الملك عبدالله، معان', 'قطع غيار سيارات', 15.0, 600.00, 'processing', 'يحتاج تغليف خاص', NOW()),
  ('REQ-2024-008', 'نور الدين', '0794567890', 'جرش', 'شارع الآثار، جرش', 'عمان', 'شارع الجاردنز، عمان', 'تحف ومنتجات يدوية', 4.0, 300.00, 'pending', NULL, NOW());
