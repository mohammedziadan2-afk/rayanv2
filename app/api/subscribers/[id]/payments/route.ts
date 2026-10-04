import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

// Get all payments for a subscriber
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const payments = await sql`
      SELECT * FROM subscriber_payments 
      WHERE subscriber_id = ${id}
      ORDER BY created_at DESC
    `
    
    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

// Create a new payment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { amount, notes, amount_before_payment, amount_after_payment } = await request.json()
    
    const result = await sql`
      INSERT INTO subscriber_payments (subscriber_id, amount, notes, amount_before_payment, amount_after_payment)
      VALUES (${id}, ${amount}, ${notes || ''}, ${amount_before_payment}, ${amount_after_payment})
      RETURNING *
    `
    
    return NextResponse.json({ payment: result[0] })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
