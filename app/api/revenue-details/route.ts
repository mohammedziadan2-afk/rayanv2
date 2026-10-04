import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Get all approved sessions with their tasks
    const sessions = await sql`
      SELECT 
        ds.id as session_id,
        ds.driver_id,
        d.name as driver_name,
        ds.total_revenue,
        ds.total_driver_fee,
        ds.remaining_collection
      FROM driver_sessions ds
      JOIN drivers d ON ds.driver_id = d.id
      ORDER BY ds.id DESC
      LIMIT 10
    `

    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session: any) => {
        const shipments = await sql`
          SELECT 
            dt.id,
            s.tracking_number,
            s.price,
            dt.driver_fee,
            dt.delivery_type,
            dt.original_payment_status,
            s.payment_status as current_payment_status
          FROM driver_tasks dt
          LEFT JOIN shipments s ON dt.shipment_id = s.id
          WHERE dt.session_id = ${session.session_id}
          ORDER BY dt.id
        `

        const shipmentsWithCalc = shipments.map((ship: any) => {
          // الشحنة تدخل في الإيراد فقط إذا كانت unpaid في الأصل
          const shouldInclude = ship.original_payment_status === "unpaid"

          let revenueAmount = 0
          if (shouldInclude) {
            // إذا كانت unpaid في الأصل، نحسب المبلغ الكامل
            revenueAmount = Number.parseFloat(ship.price || "0")
          }

          // إضافة أجرة التوصيل إذا كانت not_included
          if (ship.delivery_type === "not_included") {
            revenueAmount += Number.parseFloat(ship.driver_fee || "0")
          }

          return {
            id: ship.id,
            tracking_number: ship.tracking_number,
            price: Number.parseFloat(ship.price || "0"),
            driver_fee: Number.parseFloat(ship.driver_fee || "0"),
            delivery_type: ship.delivery_type,
            original_payment_status: ship.original_payment_status,
            current_payment_status: ship.current_payment_status,
            should_include_in_revenue: shouldInclude,
            revenue_amount: revenueAmount,
          }
        })

        return {
          session_id: session.session_id,
          driver_id: session.driver_id,
          driver_name: session.driver_name,
          total_revenue: Number.parseFloat(session.total_revenue || "0"),
          total_driver_fee: Number.parseFloat(session.total_driver_fee || "0"),
          remaining_collection: Number.parseFloat(session.remaining_collection || "0"),
          shipments: shipmentsWithCalc,
        }
      }),
    )

    return NextResponse.json(sessionsWithDetails)
  } catch (error: any) {
    console.error("[v0] Error fetching revenue details:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
