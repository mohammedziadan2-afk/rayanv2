import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
  }

  try {
    // Get session details
    const sessionResult = await sql`
      SELECT 
        ds.id,
        ds.session_number,
        ds.total_revenue,
        ds.total_driver_fee,
        ds.remaining_collection,
        ds.is_approved,
        ds.approved_at,
        d.name as driver_name
      FROM driver_sessions ds
      JOIN drivers d ON ds.driver_id = d.id
      WHERE ds.id = ${sessionId}
    `

    if (sessionResult.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const session = sessionResult[0]

    // Get shipments for this session
    const shipmentsResult = await sql`
      SELECT 
        dt.id as task_id,
        dt.driver_fee,
        dt.delivery_type,
        s.id as shipment_id,
        s.tracking_number,
        s.recipient_name,
        s.recipient_phone,
        s.description,
        s.price,
        s.collection_method
      FROM driver_tasks dt
      JOIN shipments s ON dt.shipment_id = s.id
      WHERE dt.session_id = ${sessionId}
      ORDER BY dt.id
    `

    return NextResponse.json({
      session: {
        id: session.id,
        session_number: session.session_number,
        total_revenue: session.total_revenue,
        total_driver_fee: session.total_driver_fee,
        remaining_collection: session.remaining_collection,
        is_approved: session.is_approved,
        approved_at: session.approved_at,
        driver_name: session.driver_name,
      },
      shipments: shipmentsResult.map((s: any) => ({
        task_id: s.task_id,
        shipment_id: s.shipment_id,
        tracking_number: s.tracking_number,
        recipient_name: s.recipient_name,
        recipient_phone: s.recipient_phone,
        description: s.description,
        price: s.price,
        driver_fee: s.driver_fee,
        delivery_type: s.delivery_type,
        collection_method: s.collection_method,
      })),
    })
  } catch (error) {
    console.error("Error fetching collection summary:", error)
    return NextResponse.json({ error: "Failed to fetch collection summary" }, { status: 500 })
  }
}
