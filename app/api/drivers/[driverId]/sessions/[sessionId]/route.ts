import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ driverId: string; sessionId: string }> }) {
  try {
    const { sessionId } = await params

    const result = await sql`
      SELECT 
        ds.*,
        t.trip_number,
        (SELECT COUNT(*) FROM driver_tasks WHERE session_id = ds.id AND status = 'delivered')::int as delivered_count
      FROM driver_sessions ds
      LEFT JOIN trips t ON ds.trip_id = t.id
      WHERE ds.id = ${sessionId}
      LIMIT 1
    `

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error fetching session:", error)
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 })
  }
}
