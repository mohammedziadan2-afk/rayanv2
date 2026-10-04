import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ driverId: string }> }) {
  try {
    const { driverId } = await params

    const result = await sql`
      SELECT * FROM drivers
      WHERE id = ${driverId}
      LIMIT 1
    `

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error fetching driver:", error)
    return NextResponse.json({ error: "Failed to fetch driver" }, { status: 500 })
  }
}
