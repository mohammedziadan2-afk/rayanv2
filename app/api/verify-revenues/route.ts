import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const sessions = await sql`
      SELECT 
        ds.id,
        ds.driver_name,
        ds.total_revenue,
        ds.total_driver_fee,
        ds.remaining_collection,
        ds.is_approved
      FROM driver_sessions ds
      WHERE ds.is_approved = true
      ORDER BY ds.id DESC
      LIMIT 50
    `

    const sessionsWithTasks = await Promise.all(
      sessions.map(async (session: any) => {
        const tasks = await sql`
          SELECT 
            dt.shipment_id,
            dt.original_payment_status,
            dt.driver_fee,
            dt.delivery_type,
            s.tracking_number,
            s.payment_status as current_payment_status,
            s.price
          FROM driver_tasks dt
          LEFT JOIN shipments s ON dt.shipment_id = s.id
          WHERE dt.session_id = ${session.id}
            AND dt.status = 'delivered'
        `

        const tasksWithRevenue = tasks.map((task: any) => {
          const wasOriginallyPaid = task.original_payment_status === "paid"
          const isNotIncluded = task.delivery_type === "not_included"

          let calculatedRevenue = 0
          if (wasOriginallyPaid) {
            if (isNotIncluded) {
              calculatedRevenue = Number(task.driver_fee) || 0
            }
          } else {
            calculatedRevenue = Number(task.price) || 0
            if (isNotIncluded) {
              calculatedRevenue += Number(task.driver_fee) || 0
            }
          }

          return {
            shipment_id: task.shipment_id,
            tracking_number: task.tracking_number,
            original_payment_status: task.original_payment_status,
            current_payment_status: task.current_payment_status,
            price: Number(task.price) || 0,
            driver_fee: Number(task.driver_fee) || 0,
            delivery_type: task.delivery_type,
            calculated_revenue: calculatedRevenue,
          }
        })

        return {
          ...session,
          tasks: tasksWithRevenue,
        }
      }),
    )

    return NextResponse.json({ sessions: sessionsWithTasks })
  } catch (error) {
    console.error("Error verifying revenues:", error)
    return NextResponse.json({ error: "Failed to verify revenues" }, { status: 500 })
  }
}
