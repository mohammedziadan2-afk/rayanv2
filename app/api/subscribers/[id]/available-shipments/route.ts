import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    
    // Get shipments that are NOT already assigned to this subscriber
    const shipments = await sql`
      SELECT 
        s.id,
        s.tracking_number,
        s.receiver_name,
        s.receiver_address,
        s.total_amount,
        s.status
      FROM shipments s
      WHERE s.deleted_at IS NULL
        AND s.id NOT IN (
          SELECT shipment_id FROM subscriber_shipments WHERE subscriber_id = ${id}
        )
        AND (
          s.tracking_number ILIKE ${'%' + search + '%'}
          OR s.receiver_name ILIKE ${'%' + search + '%'}
          OR s.sender_name ILIKE ${'%' + search + '%'}
        )
      ORDER BY s.created_at DESC
      LIMIT 50
    `
    
    return NextResponse.json({ shipments })
  } catch (error: any) {
    console.error("Error fetching available shipments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
