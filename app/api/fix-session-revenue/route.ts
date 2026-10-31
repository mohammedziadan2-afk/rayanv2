import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()

    const tasks = await sql`
      SELECT 
        dt.driver_fee,
        dt.delivery_type,
        dt.original_payment_status,
        s.price
      FROM driver_tasks dt
      LEFT JOIN shipments s ON dt.shipment_id = s.id
      WHERE dt.session_id = ${sessionId}
        AND dt.status = 'delivered'
    `

    let totalRevenue = 0
    let totalDriverFee = 0

    for (const task of tasks) {
      const wasOriginallyPaid = task.original_payment_status === "paid"
      const isNotIncluded = task.delivery_type === "not_included"
      const driverFee = Number(task.driver_fee) || 0

      totalDriverFee += driverFee

      if (wasOriginallyPaid) {
        // الشحنات المدفوعة مسبقاً: فقط driver_fee إذا كان not_included
        if (isNotIncluded) {
          totalRevenue += driverFee
        }
      } else {
        // الشحنات غير المدفوعة: السعر الكامل + driver_fee إذا not_included
        totalRevenue += Number(task.price) || 0
        if (isNotIncluded) {
          totalRevenue += driverFee
        }
      }
    }

    const remainingCollection = totalRevenue - totalDriverFee

    await sql`
      UPDATE driver_sessions
      SET 
        total_revenue = ${totalRevenue},
        total_driver_fee = ${totalDriverFee},
        remaining_collection = ${remainingCollection}
      WHERE id = ${sessionId}
    `

    return NextResponse.json({ success: true, totalRevenue, totalDriverFee, remainingCollection })
  } catch (error) {
    console.error("Error fixing session revenue:", error)
    return NextResponse.json({ error: "Failed to fix session revenue" }, { status: 500 })
  }
}
