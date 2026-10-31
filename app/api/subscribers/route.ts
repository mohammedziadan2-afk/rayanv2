import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

// Helper function to ensure tables exist
async function ensureTablesExist() {
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
  
  await sql`
    CREATE TABLE IF NOT EXISTS subscriber_shipments (
      id SERIAL PRIMARY KEY,
      subscriber_id INTEGER REFERENCES subscribers(id) ON DELETE CASCADE,
      shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(subscriber_id, shipment_id)
    )
  `
}

// GET - Fetch all subscribers
export async function GET() {
  try {
    // Ensure tables exist
    await ensureTablesExist()
    
    const subscribers = await sql`
      SELECT 
        s.id,
        s.username,
        s.full_name,
        s.phone,
        s.company_name,
        s.is_active,
        s.created_at,
        COUNT(ss.shipment_id) as shipments_count
      FROM subscribers s
      LEFT JOIN subscriber_shipments ss ON s.id = ss.subscriber_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `
    
    return NextResponse.json({ subscribers })
  } catch (error: any) {
    console.error("Error fetching subscribers:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new subscriber
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, full_name, phone, company_name, is_active } = body
    
    if (!username || !password || !full_name) {
      return NextResponse.json(
        { error: "اسم المستخدم وكلمة المرور والاسم مطلوبين" },
        { status: 400 }
      )
    }
    
    // Check if username already exists
    const existing = await sql`
      SELECT id FROM subscribers WHERE username = ${username}
    `
    
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "اسم المستخدم موجود مسبقاً" },
        { status: 400 }
      )
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10)
    
    // Insert subscriber
    const result = await sql`
      INSERT INTO subscribers (username, password_hash, full_name, phone, company_name, is_active)
      VALUES (${username}, ${password_hash}, ${full_name}, ${phone || null}, ${company_name || null}, ${is_active ?? true})
      RETURNING id, username, full_name, phone, company_name, is_active, created_at
    `
    
    return NextResponse.json({ subscriber: result[0] })
  } catch (error: any) {
    console.error("Error creating subscriber:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
