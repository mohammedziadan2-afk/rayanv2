import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ driverId: string }> }) {
  try {
    const { driverId } = await params

    const sessions = await sql`
      SELECT 
        ds.*,
        t.trip_number,
        (SELECT COUNT(*) FROM driver_tasks WHERE session_id = ds.id AND status = 'delivered')::int as delivered_count
      FROM driver_sessions ds
      LEFT JOIN trips t ON ds.trip_id = t.id
      WHERE ds.driver_id = ${driverId}
      ORDER BY ds.session_number DESC
    `

    return NextResponse.json(sessions || [])
  } catch (error) {
    console.error("[v0] Error fetching driver sessions:", error)
    return NextResponse.json([])
  }
}
