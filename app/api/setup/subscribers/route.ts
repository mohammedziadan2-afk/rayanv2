import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    // Create subscribers table
    await sql`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(200) NOT NULL,
        phone VARCHAR(50),
        company_name VARCHAR(200),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Create subscriber_shipments junction table
    await sql`
      CREATE TABLE IF NOT EXISTS subscriber_shipments (
        id SERIAL PRIMARY KEY,
        subscriber_id INTEGER REFERENCES subscribers(id) ON DELETE CASCADE,
        shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
        delivery_fee DECIMAL(10,2) DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(subscriber_id, shipment_id)
      )
    `
    
    // Add delivery_fee column if it doesn't exist (for existing tables)
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriber_shipments' AND column_name='delivery_fee') THEN
          ALTER TABLE subscriber_shipments ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0;
        END IF;
      END $$;
    `
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_subscriber_shipments_subscriber ON subscriber_shipments(subscriber_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_subscriber_shipments_shipment ON subscriber_shipments(shipment_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_subscribers_username ON subscribers(username)`
    
    return NextResponse.json({ success: true, message: "Tables created successfully" })
  } catch (error: any) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('subscribers', 'subscriber_shipments')
    `
    return NextResponse.json({ tables })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
