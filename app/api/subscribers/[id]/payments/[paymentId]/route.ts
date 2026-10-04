import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const { paymentId } = await params
    const { amount, notes } = await request.json()

    await sql`
      UPDATE subscriber_payments 
      SET amount = ${amount}, notes = ${notes}
      WHERE id = ${paymentId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const { paymentId } = await params

    await sql`DELETE FROM subscriber_payments WHERE id = ${paymentId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting payment:", error)
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 })
  }
}
