import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ driverId: string; sessionId: string }> }) {
  try {
    const { sessionId } = await params

    const tasks = await sql`
      SELECT 
        dt.*,
        s.id as shipment_id,
        s.tracking_number,
        s.description,
        s.receiver_name,
        s.receiver_phone,
        s.receiver_address,
        s.price as amount,
        s.payment_status
      FROM driver_tasks dt
      LEFT JOIN shipments s ON dt.shipment_id = s.id
      WHERE dt.session_id = ${sessionId}
      ORDER BY dt.created_at ASC
    `

    const formattedTasks = (tasks || []).map((task: any) => ({
      ...task,
      shipments: {
        id: task.shipment_id,
        tracking_number: task.tracking_number,
        description: task.description,
        receiver_name: task.receiver_name,
        receiver_phone: task.receiver_phone,
        receiver_address: task.receiver_address,
        amount: task.amount,
        payment_status: task.payment_status,
      },
    }))

    return NextResponse.json(formattedTasks)
  } catch (error) {
    console.error("[v0] Error fetching session tasks:", error)
    return NextResponse.json([])
  }
}
