import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    
    // Create subscriber_payments table
    await sql`
      CREATE TABLE IF NOT EXISTS subscriber_payments (
        id SERIAL PRIMARY KEY,
        subscriber_id INTEGER REFERENCES subscribers(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        notes TEXT,
        amount_before_payment DECIMAL(10,2) DEFAULT 0,
        amount_after_payment DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    return NextResponse.json({ success: true, message: "Subscriber payments table created" })
  } catch (error) {
    console.error("Error creating subscriber payments table:", error)
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 })
  }
}
