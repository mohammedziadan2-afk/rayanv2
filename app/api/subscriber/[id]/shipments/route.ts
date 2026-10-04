import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET - Fetch shipments for subscriber (read-only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verify subscriber exists and is active
    const subscribers = await sql`
      SELECT id, is_active FROM subscribers WHERE id = ${id}
    `
    
    if (subscribers.length === 0) {
      return NextResponse.json({ error: "المشترك غير موجود" }, { status: 404 })
    }
    
    if (!subscribers[0].is_active) {
      return NextResponse.json({ error: "الحساب غير فعال" }, { status: 403 })
    }
    
    // Get subscriber's shipments with delivery fees
    const shipments = await sql`
      SELECT 
        s.id,
        s.tracking_number,
        s.receiver_name,
        s.receiver_address,
        s.total_amount,
        s.status,
        s.delivery_status,
        s.current_tracking_stage,
        s.created_at,
        COALESCE(ss.delivery_fee, 0) as delivery_fee,
        ss.issue_note
      FROM shipments s
      INNER JOIN subscriber_shipments ss ON s.id = ss.shipment_id
      WHERE ss.subscriber_id = ${id}
        AND s.deleted_at IS NULL
      ORDER BY ss.added_at DESC
    `
    
    return NextResponse.json({ shipments })
  } catch (error: any) {
    console.error("Error fetching subscriber shipments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
