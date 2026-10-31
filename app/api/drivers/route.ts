import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {

    const drivers = await sql`
      SELECT 
        d.*,
        COALESCE(ut.undelivered_count, 0)::int as undelivered_tasks_count,
        COALESCE(us.uncollected_count, 0)::int as uncollected_sessions_count
      FROM drivers d
      LEFT JOIN (
        SELECT driver_id, COUNT(*) as undelivered_count
        FROM driver_tasks
        WHERE status != 'delivered'
        GROUP BY driver_id
      ) ut ON ut.driver_id = d.id
      LEFT JOIN (
        SELECT driver_id, COUNT(*) as uncollected_count
        FROM driver_sessions
        WHERE is_approved = true AND is_collected = false
        GROUP BY driver_id
      ) us ON us.driver_id = d.id
      WHERE d.deleted_at IS NULL
      ORDER BY d.name ASC
    `

    return NextResponse.json(drivers || [])
  } catch (error) {
    console.error("[v0] Error fetching drivers:", error)
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 })
  }
}
