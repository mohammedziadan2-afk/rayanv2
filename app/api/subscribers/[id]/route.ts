import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

// GET - Fetch single subscriber with their shipments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get subscriber
    const subscribers = await sql`
      SELECT id, username, full_name, phone, company_name, is_active, created_at
      FROM subscribers
      WHERE id = ${id}
    `
    
    if (subscribers.length === 0) {
      return NextResponse.json({ error: "المشترك غير موجود" }, { status: 404 })
    }
    
    // Get subscriber's shipments (with the latest session they belong to)
    const shipments = await sql`
      SELECT 
        s.id,
        s.tracking_number,
        s.sender_name,
        s.receiver_name,
        s.receiver_phone,
        s.receiver_address,
        s.shipment_type,
        s.status,
        s.delivery_status,
        s.total_amount,
        s.price,
        s.current_tracking_stage,
        s.created_at,
        ss.added_at,
        COALESCE(ss.delivery_fee, 0) as delivery_fee,
        COALESCE(sess.driver_fee, 0) as driver_fee,
        ss.issue_note,
        sess.session_id,
        sess.session_number,
        sess.session_date,
        sess.driver_name
      FROM shipments s
      INNER JOIN subscriber_shipments ss ON s.id = ss.shipment_id
      LEFT JOIN LATERAL (
        SELECT 
          dse.id AS session_id,
          dse.session_number,
          dse.session_date,
          dt.driver_fee AS driver_fee,
          d.name AS driver_name
        FROM driver_tasks dt
        INNER JOIN driver_sessions dse ON dt.session_id = dse.id
        LEFT JOIN drivers d ON dse.driver_id = d.id
        WHERE dt.shipment_id = s.id
        ORDER BY dse.session_date DESC NULLS LAST, dse.id DESC
        LIMIT 1
      ) sess ON true
      WHERE ss.subscriber_id = ${id}
        AND s.deleted_at IS NULL
      ORDER BY ss.added_at DESC
    `
    
    // Get subscriber's cash items (financial amounts from sessions)
    let cash_items: any[] = []
    try {
      cash_items = await sql`
        SELECT 
          sci.id,
          sci.task_id,
          sci.amount,
          sci.note,
          sci.added_at,
          d.name as driver_name
        FROM subscriber_cash_items sci
        LEFT JOIN drivers d ON sci.driver_id = d.id
        WHERE sci.subscriber_id = ${id}
        ORDER BY sci.added_at DESC
      `
    } catch (e) {
      // Table may not exist yet in some environments
      cash_items = []
    }
    
    return NextResponse.json({
      subscriber: subscribers[0],
      shipments,
      cash_items
    })
  } catch (error: any) {
    console.error("Error fetching subscriber:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update subscriber
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { password, full_name, phone, company_name, is_active } = body
    
    // If password provided, hash it
    let updateQuery
    if (password && password.trim() !== '') {
      const password_hash = await bcrypt.hash(password, 10)
      updateQuery = sql`
        UPDATE subscribers 
        SET 
          full_name = COALESCE(${full_name}, full_name),
          phone = ${phone || null},
          company_name = ${company_name || null},
          is_active = COALESCE(${is_active}, is_active),
          password_hash = ${password_hash},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id, username, full_name, phone, company_name, is_active
      `
    } else {
      updateQuery = sql`
        UPDATE subscribers 
        SET 
          full_name = COALESCE(${full_name}, full_name),
          phone = ${phone || null},
          company_name = ${company_name || null},
          is_active = COALESCE(${is_active}, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id, username, full_name, phone, company_name, is_active
      `
    }
    
    const result = await updateQuery
    
    if (result.length === 0) {
      return NextResponse.json({ error: "المشترك غير موجود" }, { status: 404 })
    }
    
    return NextResponse.json({ subscriber: result[0] })
  } catch (error: any) {
    console.error("Error updating subscriber:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete subscriber
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await sql`DELETE FROM subscribers WHERE id = ${id}`
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting subscriber:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
