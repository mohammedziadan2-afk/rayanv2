import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// POST - Add shipments to subscriber
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const shipment_ids: number[] = body.shipment_ids || []
    const cash_items: { task_id: number; amount: number; note?: string | null; driver_id?: number | null; session_id?: number | null }[] =
      body.cash_items || []
    
    if (shipment_ids.length === 0 && cash_items.length === 0) {
      return NextResponse.json(
        { error: "يجب تحديد عناصر للإضافة" },
        { status: 400 }
      )
    }
    
    // Insert each shipment
    for (const shipmentId of shipment_ids) {
      await sql`
        INSERT INTO subscriber_shipments (subscriber_id, shipment_id)
        VALUES (${id}, ${shipmentId})
        ON CONFLICT (subscriber_id, shipment_id) DO NOTHING
      `
    }
    
    // Insert each cash item (financial amount from a session)
    for (const cash of cash_items) {
      await sql`
        INSERT INTO subscriber_cash_items (subscriber_id, task_id, amount, note, driver_id, session_id)
        VALUES (${id}, ${cash.task_id}, ${cash.amount || 0}, ${cash.note || null}, ${cash.driver_id || null}, ${cash.session_id || null})
        ON CONFLICT (subscriber_id, task_id) DO NOTHING
      `
    }
    
    const count = shipment_ids.length + cash_items.length
    return NextResponse.json({ 
      success: true, 
      message: `تمت إضافة ${count} عنصر` 
    })
  } catch (error: any) {
    console.error("Error adding shipments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
