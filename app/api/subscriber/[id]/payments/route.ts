import { NextRequest, NextResponse } from 'next/server'
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const payments = await sql`
      SELECT 
        id,
        amount,
        notes,
        amount_before_payment,
        amount_after_payment,
        created_at
      FROM subscriber_payments
      WHERE subscriber_id = ${id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}
