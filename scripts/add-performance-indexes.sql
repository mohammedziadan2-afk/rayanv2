-- إضافة Indexes لتحسين أداء الاستعلامات الأكثر استخداماً

-- Shipments table indexes
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_customer_phone ON shipments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_shipments_trip_id ON shipments(trip_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_deleted_at ON shipments(deleted_at) WHERE deleted_at IS NOT NULL;

-- Driver tasks indexes
CREATE INDEX IF NOT EXISTS idx_driver_tasks_driver_id ON driver_tasks(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_tasks_status ON driver_tasks(status);
CREATE INDEX IF NOT EXISTS idx_driver_tasks_created_at ON driver_tasks(created_at DESC);

-- Driver sessions indexes
CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver_id ON driver_sessions(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_status ON driver_sessions(status);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_session_date ON driver_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_approved ON driver_sessions(approved);

-- Trips indexes
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON trips(departure_date DESC);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);

-- Debts indexes
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_customer_phone ON debts(customer_phone);
CREATE INDEX IF NOT EXISTS idx_debts_created_at ON debts(created_at DESC);

-- Additional revenues indexes
CREATE INDEX IF NOT EXISTS idx_additional_revenues_date ON additional_revenues(date DESC);
CREATE INDEX IF NOT EXISTS idx_additional_revenues_created_at ON additional_revenues(created_at DESC);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);

-- Tracking history indexes
CREATE INDEX IF NOT EXISTS idx_tracking_history_shipment_id ON shipment_tracking_history(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_stage ON shipment_tracking_history(stage);
CREATE INDEX IF NOT EXISTS idx_tracking_history_timestamp ON shipment_tracking_history(timestamp DESC);

-- Security logs indexes
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_customer_phone ON messages(customer_phone);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Ratings indexes
CREATE INDEX IF NOT EXISTS idx_ratings_driver_id ON ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_ratings_shipment_id ON ratings(shipment_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ratings(rating);

-- Composite indexes للاستعلامات المعقدة
CREATE INDEX IF NOT EXISTS idx_shipments_status_created ON shipments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver_date ON driver_sessions(driver_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_trips_status_departure ON trips(status, departure_date DESC);

-- تحليل الجداول لتحديث الإحصائيات
ANALYZE shipments;
ANALYZE driver_tasks;
ANALYZE driver_sessions;
ANALYZE trips;
ANALYZE debts;
ANALYZE additional_revenues;
ANALYZE expenses;
ANALYZE shipment_tracking_history;
ANALYZE security_logs;
ANALYZE messages;
ANALYZE notifications;
ANALYZE ratings;

-- إضافة تعليقات على الـ indexes
COMMENT ON INDEX idx_shipments_tracking_number IS 'تسريع البحث برقم التتبع';
COMMENT ON INDEX idx_shipments_status IS 'تسريع الفلترة حسب حالة الشحنة';
COMMENT ON INDEX idx_driver_sessions_driver_date IS 'تسريع جلب جلسات سائق معين بالتاريخ';
COMMENT ON INDEX idx_trips_status_departure IS 'تسريع جلب الرحلات حسب الحالة والتاريخ';
