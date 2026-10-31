-- Script to create all tables in Neon database
-- مؤسسة الريان واريان للشحن والتوصيل

-- 1. Company Info Table
CREATE TABLE IF NOT EXISTS company_info (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. App Users Table (Admin & System Users)
CREATE TABLE IF NOT EXISTS app_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle_info TEXT,
  status TEXT DEFAULT 'active',
  city TEXT DEFAULT 'رماله',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 4. Driver Sessions Table
CREATE TABLE IF NOT EXISTS driver_sessions (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER REFERENCES drivers(id),
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  is_approved BOOLEAN DEFAULT FALSE,
  is_collected BOOLEAN DEFAULT FALSE,
  session_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Shipments Table
CREATE TABLE IF NOT EXISTS shipments (
  id SERIAL PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT,
  sender_address TEXT,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  weight NUMERIC(10,2),
  dimensions TEXT,
  description TEXT,
  declared_value NUMERIC(10,2),
  shipping_cost NUMERIC(10,2),
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'unpaid',
  delivery_status TEXT DEFAULT 'pending',
  notes TEXT,
  trip_id INTEGER,
  customer_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 6. Driver Tasks Table
CREATE TABLE IF NOT EXISTS driver_tasks (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES driver_sessions(id),
  driver_id INTEGER REFERENCES drivers(id),
  shipment_id INTEGER REFERENCES shipments(id),
  status TEXT DEFAULT 'pending',
  driver_fee NUMERIC(10,2),
  delivery_notes TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Trips Table
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  trip_number TEXT UNIQUE NOT NULL,
  departure_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  departure_date DATE,
  arrival_date DATE,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 8. Shipment Tracking History Table
CREATE TABLE IF NOT EXISTS shipment_tracking_history (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id),
  status TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Revenues Table
CREATE TABLE IF NOT EXISTS revenues (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT DEFAULT 'shipping',
  revenue_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Additional Revenues Table
CREATE TABLE IF NOT EXISTS additional_revenues (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  revenue_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT DEFAULT 'operational',
  expense_date DATE DEFAULT CURRENT_DATE,
  session_id INTEGER REFERENCES driver_sessions(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Debts Table
CREATE TABLE IF NOT EXISTS debts (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'unpaid',
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 14. News/Announcements Table
CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Warehouse Inventory Table
CREATE TABLE IF NOT EXISTS warehouse_inventory (
  id SERIAL PRIMARY KEY,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'piece',
  min_quantity INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Warehouse Edit History Table
CREATE TABLE IF NOT EXISTS warehouse_edit_history (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES warehouse_inventory(id),
  old_quantity INTEGER,
  new_quantity INTEGER,
  change_reason TEXT,
  changed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Security Logs Table
CREATE TABLE IF NOT EXISTS security_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id INTEGER,
  username TEXT,
  ip_address TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Budget Summaries Table
CREATE TABLE IF NOT EXISTS budget_summaries (
  id SERIAL PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenues NUMERIC(10,2) DEFAULT 0,
  total_expenses NUMERIC(10,2) DEFAULT 0,
  net_profit NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Shipping Requests Table
CREATE TABLE IF NOT EXISTS shipping_requests (
  id SERIAL PRIMARY KEY,
  request_number TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_address TEXT,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 21. Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER REFERENCES drivers(id),
  session_id INTEGER REFERENCES driver_sessions(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Backups Table
CREATE TABLE IF NOT EXISTS backups (
  id SERIAL PRIMARY KEY,
  backup_name TEXT NOT NULL,
  backup_date TIMESTAMPTZ DEFAULT NOW(),
  file_size BIGINT,
  status TEXT DEFAULT 'completed',
  notes TEXT
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(delivery_status);
CREATE INDEX IF NOT EXISTS idx_shipments_customer_phone ON shipments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_shipments_trip_id ON shipments(trip_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at);
CREATE INDEX IF NOT EXISTS idx_shipments_deleted_at ON shipments(deleted_at);

CREATE INDEX IF NOT EXISTS idx_driver_tasks_driver_id ON driver_tasks(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_tasks_session_id ON driver_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_driver_tasks_status ON driver_tasks(status);
CREATE INDEX IF NOT EXISTS idx_driver_tasks_created_at ON driver_tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver_id ON driver_sessions(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_status ON driver_sessions(is_approved);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_collected ON driver_sessions(is_collected);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_date ON driver_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver_date ON driver_sessions(driver_id, session_date);

CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON trips(departure_date);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);
CREATE INDEX IF NOT EXISTS idx_trips_deleted_at ON trips(deleted_at);
CREATE INDEX IF NOT EXISTS idx_trips_status_departure ON trips(status, departure_date);

CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_customer_phone ON debts(customer_phone);
CREATE INDEX IF NOT EXISTS idx_debts_created_at ON debts(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_tracking_history_shipment_id ON shipment_tracking_history(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_created_at ON shipment_tracking_history(created_at);

CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_username ON security_logs(username);

CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(revenue_date);
CREATE INDEX IF NOT EXISTS idx_revenues_category ON revenues(category);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_session_id ON expenses(session_id);

CREATE INDEX IF NOT EXISTS idx_ratings_driver_id ON ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_ratings_session_id ON ratings(session_id);

-- Insert default admin user
INSERT INTO app_users (username, password, role)
VALUES ('Ziadan85dd', encode(digest('Ziadan85dd', 'sha256'), 'hex'), 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert default company info
INSERT INTO company_info (name, address, phone, email)
VALUES ('مؤسسة الريان واريان للشحن والتوصيل', 'فلسطين - رماله', '+970', 'info@alrayan.ps')
ON CONFLICT DO NOTHING;
