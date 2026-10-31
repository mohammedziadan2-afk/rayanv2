import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { driverId, sessionId, tripId, shipmentIds } = body

    if (!driverId || !sessionId || !shipmentIds || shipmentIds.length === 0) {
      return NextResponse.json({ success: false, error: "بيانات غير مكتملة" }, { status: 400 })
    }

    // Get shipments data to store original payment status
    const shipmentsData = await sql`
      SELECT id, payment_status, price
      FROM shipments
      WHERE id = ANY(${shipmentIds.map((id: string) => Number.parseInt(id))})
    `

    const paymentStatusMap = new Map(
      shipmentsData?.map((s: any) => [s.id.toString(), { payment_status: s.payment_status, price: s.price }]) || []
    )

    // Insert tasks for each shipment
    for (const shipmentId of shipmentIds) {
      const shipmentData = paymentStatusMap.get(shipmentId) || { payment_status: "unpaid", price: 0 }
      
      await sql`
        INSERT INTO driver_tasks (
          driver_id, 
          shipment_id, 
          session_id,
          trip_id, 
          delivery_type, 
          status, 
          original_payment_status, 
          driver_collects,
          driver_fee
        )
        VALUES (
          ${Number.parseInt(driverId)},
          ${Number.parseInt(shipmentId)},
          ${Number.parseInt(sessionId)},
          ${tripId ? Number.parseInt(tripId) : null},
          'not_included',
          'pending',
          ${shipmentData.payment_status || "unpaid"},
          false,
          0
        )
        ON CONFLICT (shipment_id) 
        WHERE session_id IS NOT NULL
        DO NOTHING
      `
    }

    // Update shipments status to in-transit
    const now = new Date().toISOString()
    await sql`
      UPDATE shipments
      SET current_tracking_stage = 4, stage_4_entered_at = ${now}, status = 'in-transit'
      WHERE id = ANY(${shipmentIds.map((id: string) => Number.parseInt(id))})
    `

    // Add tracking history entries
    for (const shipmentId of shipmentIds) {
      await sql`
        INSERT INTO shipment_tracking_history (shipment_id, stage, stage_name, entered_at, status)
        VALUES (${Number.parseInt(shipmentId)}, 4, 'وصول الطلب للمركز والتوزيع', ${now}, 'in_transit')
        ON CONFLICT DO NOTHING
      `
    }

    return NextResponse.json({ success: true, count: shipmentIds.length })
  } catch (error) {
    console.error("Error adding shipments to session:", error)
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء إضافة الشحنات" }, { status: 500 })
  }
}
