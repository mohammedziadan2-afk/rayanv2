-- جدول المشتركين (أصحاب الطلبات)
CREATE TABLE IF NOT EXISTS subscribers (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company_name VARCHAR(255),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول ربط الشحنات بالمشتركين
CREATE TABLE IF NOT EXISTS subscriber_shipments (
  id SERIAL PRIMARY KEY,
  subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subscriber_id, shipment_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriber_shipments_subscriber ON subscriber_shipments(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_shipments_shipment ON subscriber_shipments(shipment_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_username ON subscribers(username);
CREATE INDEX IF NOT EXISTS idx_subscribers_is_active ON subscribers(is_active);
