-- Create visitors tracking table
CREATE TABLE IF NOT EXISTS site_visitors (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  referrer TEXT,
  page_visited VARCHAR(500),
  visit_date DATE DEFAULT CURRENT_DATE,
  visit_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id VARCHAR(100),
  is_excluded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_visitors_ip ON site_visitors(ip_address);
CREATE INDEX IF NOT EXISTS idx_visitors_date ON site_visitors(visit_date);
CREATE INDEX IF NOT EXISTS idx_visitors_country ON site_visitors(country);

-- Create excluded IPs table (for excluding your own visits)
CREATE TABLE IF NOT EXISTS excluded_ips (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL UNIQUE,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
