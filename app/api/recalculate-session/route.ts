import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {

    const { sessionId } = await request.json()

    // Get all tasks for this session
    const tasks = await sql`
      SELECT 
        dt.id,
        dt.driver_collects,
        dt.driver_fee,
        s.price
      FROM driver_tasks dt
      LEFT JOIN shipments s ON dt.shipment_id = s.id
      WHERE dt.session_id = ${sessionId}
    `

    // Calculate total revenue
    let totalRevenue = 0
    let totalDriverFee = 0

    for (const task of tasks) {
      const driverFee = Number.parseFloat(task.driver_fee || "0")
      totalDriverFee += driverFee

      // Only add price if driver collects it
      if (task.driver_collects) {
        const price = Number.parseFloat(task.price || "0")
        totalRevenue += price
      }
    }

    const remainingCollection = totalRevenue - totalDriverFee

    // Update session
    await sql`
      UPDATE driver_sessions
      SET 
        total_revenue = ${totalRevenue},
        total_driver_fee = ${totalDriverFee},
        remaining_collection = ${remainingCollection}
      WHERE id = ${sessionId}
    `

    return NextResponse.json({
      success: true,
      totalRevenue,
      totalDriverFee,
      remainingCollection,
    })
  } catch (error) {
    console.error("Error recalculating session:", error)
    return NextResponse.json({ success: false, error: "Failed to recalculate" }, { status: 500 })
  }
}
