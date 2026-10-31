import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// DELETE - Remove a cash item (financial amount) from subscriber
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; cashItemId: string }> }
) {
  try {
    const { id, cashItemId } = await params

    await sql`
      DELETE FROM subscriber_cash_items
      WHERE subscriber_id = ${id} AND id = ${cashItemId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error removing cash item:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
