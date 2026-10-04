import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// PUT - Update issue note
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; shipmentId: string }> }
) {
  try {
    const { id, shipmentId } = await params
    const { issue_note } = await request.json()
    
    await sql`
      UPDATE subscriber_shipments 
      SET issue_note = ${issue_note || null}
      WHERE subscriber_id = ${id} AND shipment_id = ${shipmentId}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating issue note:", error)
    return NextResponse.json({ error: "Failed to update issue note" }, { status: 500 })
  }
}

// DELETE - Remove issue note
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; shipmentId: string }> }
) {
  try {
    const { id, shipmentId } = await params
    
    await sql`
      UPDATE subscriber_shipments 
      SET issue_note = NULL
      WHERE subscriber_id = ${id} AND shipment_id = ${shipmentId}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing issue note:", error)
    return NextResponse.json({ error: "Failed to remove issue note" }, { status: 500 })
  }
}
