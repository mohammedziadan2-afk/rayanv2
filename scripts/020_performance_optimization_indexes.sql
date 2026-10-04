-- إضافة indexes لتحسين أداء الاستعلامات الأكثر استخداماً

-- Shipments table indexes
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_deleted_at ON shipments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_delivery_date ON shipments(delivery_date);
CREATE INDEX IF NOT EXISTS idx_shipments_receiver_phone ON shipments(receiver_phone);
CREATE INDEX IF NOT EXISTS idx_shipments_sender_phone ON shipments(sender_phone);

-- Trips table indexes
CREATE INDEX IF NOT EXISTS idx_trips_trip_number ON trips(trip_number);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_deleted_at ON trips(deleted_at);
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON trips(departure_date DESC);

-- Debts table indexes
CREATE INDEX IF NOT EXISTS idx_debts_tracking_number ON debts(tracking_number);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_shipment_id ON debts(shipment_id);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);

-- Expenses table indexes
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Shipping requests table indexes
CREATE INDEX IF NOT EXISTS idx_shipping_requests_request_number ON shipping_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_shipping_requests_status ON shipping_requests(status);
CREATE INDEX IF NOT EXISTS idx_shipping_requests_request_date ON shipping_requests(request_date DESC);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_request_number ON messages(request_number);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_due_date ON notifications(due_date);

-- Warehouse inventory table indexes
CREATE INDEX IF NOT EXISTS idx_warehouse_tracking_number ON warehouse_inventory(tracking_number);
CREATE INDEX IF NOT EXISTS idx_warehouse_sender_name ON warehouse_inventory(sender_name);

-- News table indexes
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_news_priority ON news(priority DESC);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);

-- Additional revenues table indexes
CREATE INDEX IF NOT EXISTS idx_additional_revenues_date ON additional_revenues(date DESC);
CREATE INDEX IF NOT EXISTS idx_additional_revenues_category ON additional_revenues(category);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_shipments_status_deleted ON shipments(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_trips_status_deleted ON trips(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_debts_status_shipment ON debts(status, shipment_id);
