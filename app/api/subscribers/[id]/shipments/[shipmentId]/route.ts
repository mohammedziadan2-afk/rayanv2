import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// DELETE - Remove shipment from subscriber
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; shipmentId: string }> }
) {
  try {
    const { id, shipmentId } = await params
    
    await sql`
      DELETE FROM subscriber_shipments 
      WHERE subscriber_id = ${id} AND shipment_id = ${shipmentId}
    `
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error removing shipment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
