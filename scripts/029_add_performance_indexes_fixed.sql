-- إضافة Indexes لتحسين أداء الاستعلامات
-- هذا السكريبت يضيف indexes على الأعمدة المستخدمة بكثرة في WHERE, ORDER BY, و JOIN

-- ===== Shipments Table Indexes =====
-- Index على deleted_at للفلترة (الشحنات النشطة فقط)
CREATE INDEX IF NOT EXISTS idx_shipments_deleted_at ON shipments(deleted_at);

-- Index على created_at للترتيب والفلترة حسب التاريخ
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at DESC);

-- Index على tracking_number للبحث السريع
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);

-- Index على status للفلترة حسب الحالة
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

-- Composite index للاستعلامات الشائعة (deleted_at + created_at)
CREATE INDEX IF NOT EXISTS idx_shipments_active_by_date ON shipments(deleted_at, created_at DESC) WHERE deleted_at IS NULL;

-- Index على customer_name للبحث
CREATE INDEX IF NOT EXISTS idx_shipments_customer_name ON shipments(customer_name);

-- Index على receiver_phone للبحث
CREATE INDEX IF NOT EXISTS idx_shipments_receiver_phone ON shipments(receiver_phone);

-- ===== Driver Sessions Table Indexes =====
-- Index على driver_id للفلترة حسب السائق
CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver_id ON driver_sessions(driver_id);

-- Index على session_date للترتيب والفلترة حسب التاريخ
CREATE INDEX IF NOT EXISTS idx_driver_sessions_date ON driver_sessions(session_date DESC);

-- Index على is_approved للفلترة حسب حالة الاعتماد
CREATE INDEX IF NOT EXISTS idx_driver_sessions_approved ON driver_sessions(is_approved);

-- Index على trip_id للربط مع الرحلات
CREATE INDEX IF NOT EXISTS idx_driver_sessions_trip_id ON driver_sessions(trip_id);

-- Composite index للاستعلامات الشائعة (driver_id + session_date)
CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver_date ON driver_sessions(driver_id, session_date DESC);

-- Index على session_number للترتيب
CREATE INDEX IF NOT EXISTS idx_driver_sessions_number ON driver_sessions(driver_id, session_number DESC);

-- ===== Driver Tasks Table Indexes =====
-- Index على driver_id للفلترة حسب السائق
CREATE INDEX IF NOT EXISTS idx_driver_tasks_driver_id ON driver_tasks(driver_id);

-- Index على session_id للربط مع الجلسات
CREATE INDEX IF NOT EXISTS idx_driver_tasks_session_id ON driver_tasks(session_id);

-- Index على shipment_id للربط مع الشحنات
CREATE INDEX IF NOT EXISTS idx_driver_tasks_shipment_id ON driver_tasks(shipment_id);

-- Index على status للفلترة حسب الحالة
CREATE INDEX IF NOT EXISTS idx_driver_tasks_status ON driver_tasks(status);

-- Index على assigned_date للترتيب
CREATE INDEX IF NOT EXISTS idx_driver_tasks_assigned_date ON driver_tasks(assigned_date DESC);

-- Composite index للاستعلامات الشائعة (driver_id + status)
CREATE INDEX IF NOT EXISTS idx_driver_tasks_driver_status ON driver_tasks(driver_id, status);

-- Composite index (session_id + status)
CREATE INDEX IF NOT EXISTS idx_driver_tasks_session_status ON driver_tasks(session_id, status);

-- ===== Drivers Table Indexes =====
-- Index على status للفلترة حسب الحالة
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- Index على name للبحث
CREATE INDEX IF NOT EXISTS idx_drivers_name ON drivers(name);

-- Index على phone للبحث
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);

-- ===== Trips Table Indexes =====
-- Index على deleted_at للفلترة (الرحلات النشطة فقط)
CREATE INDEX IF NOT EXISTS idx_trips_deleted_at ON trips(deleted_at);

-- Index على departure_date للترتيب والفلترة
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON trips(departure_date DESC);

-- Index على status للفلترة حسب الحالة
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- Index على trip_number للبحث
CREATE INDEX IF NOT EXISTS idx_trips_number ON trips(trip_number);

-- Composite index للرحلات النشطة حسب التاريخ
CREATE INDEX IF NOT EXISTS idx_trips_active_by_date ON trips(deleted_at, departure_date DESC) WHERE deleted_at IS NULL;

-- ===== Debts Table Indexes =====
-- Index على status للفلترة حسب الحالة
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);

-- Index على shipment_id للربط مع الشحنات
CREATE INDEX IF NOT EXISTS idx_debts_shipment_id ON debts(shipment_id);

-- Index على tracking_number للبحث
CREATE INDEX IF NOT EXISTS idx_debts_tracking_number ON debts(tracking_number);

-- Index على due_date للترتيب والفلترة
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);

-- Index على receiver_phone للبحث
CREATE INDEX IF NOT EXISTS idx_debts_receiver_phone ON debts(receiver_phone);

-- ===== Shipping Requests Table Indexes =====
-- Index على status للفلترة حسب الحالة
CREATE INDEX IF NOT EXISTS idx_shipping_requests_status ON shipping_requests(status);

-- Index على request_number للبحث
CREATE INDEX IF NOT EXISTS idx_shipping_requests_number ON shipping_requests(request_number);

-- Index على request_date للترتيب
CREATE INDEX IF NOT EXISTS idx_shipping_requests_date ON shipping_requests(request_date DESC);

-- Index على customer_phone للبحث
CREATE INDEX IF NOT EXISTS idx_shipping_requests_phone ON shipping_requests(customer_phone);

-- ===== Messages Table Indexes =====
-- Index على request_number للفلترة
CREATE INDEX IF NOT EXISTS idx_messages_request_number ON messages(request_number);

-- Index على read للفلترة (الرسائل غير المقروءة)
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- Index على timestamp للترتيب
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- ===== Notifications Table Indexes =====
-- Index على status للفلترة حسب الحالة
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- Index على due_date للترتيب والفلترة
CREATE INDEX IF NOT EXISTS idx_notifications_due_date ON notifications(due_date);

-- ===== Expenses Table Indexes =====
-- Index على date للترتيب والفلترة
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);

-- Index على category للفلترة حسب الفئة
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- ===== Additional Revenues Table Indexes =====
-- Index على date للترتيب والفلترة
CREATE INDEX IF NOT EXISTS idx_additional_revenues_date ON additional_revenues(date DESC);

-- Index على category للفلترة حسب الفئة
CREATE INDEX IF NOT EXISTS idx_additional_revenues_category ON additional_revenues(category);

-- ===== Warehouse Inventory Table Indexes =====
-- Index على tracking_number للبحث
CREATE INDEX IF NOT EXISTS idx_warehouse_tracking_number ON warehouse_inventory(tracking_number);

-- Index على sender_name للبحث
CREATE INDEX IF NOT EXISTS idx_warehouse_sender_name ON warehouse_inventory(sender_name);

-- ===== News Table Indexes =====
-- Index على status للفلترة حسب الحالة
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);

-- Index على priority للترتيب
CREATE INDEX IF NOT EXISTS idx_news_priority ON news(priority DESC);

-- Index على created_at للترتيب
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
