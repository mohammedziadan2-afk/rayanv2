import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// PUT - Update delivery fee for a shipment
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; shipmentId: string }> }
) {
  try {
    const { id, shipmentId } = await params
    const { delivery_fee } = await request.json()
    
    const result = await sql`
      UPDATE subscriber_shipments 
      SET delivery_fee = ${delivery_fee || 0}
      WHERE subscriber_id = ${id} AND shipment_id = ${shipmentId}
      RETURNING *
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: "الشحنة غير موجودة" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, data: result[0] })
  } catch (error: any) {
    console.error("Error updating delivery fee:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
