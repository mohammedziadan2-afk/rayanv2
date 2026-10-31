-- Add indexes to improve query performance
-- This script adds indexes on frequently queried columns

-- Shipments table indexes
CREATE INDEX IF NOT EXISTS idx_shipments_deleted_at ON shipments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_receiver_phone ON shipments(receiver_phone);

-- Driver tasks indexes
CREATE INDEX IF NOT EXISTS idx_driver_tasks_driver_id ON driver_tasks(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_tasks_session_id ON driver_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_driver_tasks_shipment_id ON driver_tasks(shipment_id);
CREATE INDEX IF NOT EXISTS idx_driver_tasks_status ON driver_tasks(status);

-- Driver sessions indexes
CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver_id ON driver_sessions(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_created_at ON driver_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_is_committed ON driver_sessions(is_committed);

-- Trips table indexes
CREATE INDEX IF NOT EXISTS idx_trips_deleted_at ON trips(deleted_at);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_trip_number ON trips(trip_number);
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON trips(departure_date DESC);

-- Expenses table indexes
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Debts table indexes
CREATE INDEX IF NOT EXISTS idx_debts_created_at ON debts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debts_is_paid ON debts(is_paid);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_request_number ON messages(request_number);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Shipping requests indexes
CREATE INDEX IF NOT EXISTS idx_shipping_requests_request_number ON shipping_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_shipping_requests_created_at ON shipping_requests(created_at DESC);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_shipments_deleted_created ON shipments(deleted_at, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_driver_tasks_driver_session ON driver_tasks(driver_id, session_id);
CREATE INDEX IF NOT EXISTS idx_trips_deleted_departure ON trips(deleted_at, departure_date DESC) WHERE deleted_at IS NULL;
