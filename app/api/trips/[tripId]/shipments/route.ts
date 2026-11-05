import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
    const searchParams = request.nextUrl.searchParams
    const availableOnly = searchParams.get("available") === "true"

    let shipments

    if (availableOnly) {
      // Get shipments that are not already assigned to a driver session
      shipments = await sql`
        SELECT s.id, s.tracking_number, s.receiver_name, s.receiver_phone,
               COALESCE(NULLIF(s.description, ''), s.shipment_type, 'شحنة') as description,
               s.price, s.status, s.payment_status
        FROM shipments s
        WHERE s.trip_id = ${tripId}
        AND s.deleted_at IS NULL
        AND s.id NOT IN (
          SELECT dt.shipment_id 
          FROM driver_tasks dt 
          WHERE dt.session_id IS NOT NULL
        )
        AND s.status NOT IN ('delivered', 'cancelled', 'returned')
        ORDER BY s.created_at DESC
      `
    } else {
      // Get all shipments in the trip
      shipments = await sql`
        SELECT s.id, s.tracking_number, s.receiver_name, s.receiver_phone,
               COALESCE(NULLIF(s.description, ''), s.shipment_type, 'شحنة') as description,
               s.price, s.status, s.payment_status
        FROM shipments s
        WHERE s.trip_id = ${tripId}
        AND s.deleted_at IS NULL
        ORDER BY s.created_at DESC
      `
    }

    return NextResponse.json({ shipments: shipments || [] })
  } catch (error) {
    console.error("Error fetching trip shipments:", error)
    return NextResponse.json({ shipments: [], error: "فشل في جلب الشحنات" }, { status: 500 })
  }
}
