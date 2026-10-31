import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // جلب جميع الجلسات غير المقبوضة مع معلومات السائق
    const sessions = await sql`
      SELECT 
        ds.id,
        ds.driver_id,
        d.name as driver_name,
        ds.session_date,
        ds.session_number,
        ds.is_approved,
        ds.is_collected,
        ds.total_revenue,
        ds.total_driver_fee,
        ds.remaining_collection,
        (SELECT COUNT(*) FROM driver_tasks dt WHERE dt.session_id = ds.id) as total_shipments
      FROM driver_sessions ds
      JOIN drivers d ON ds.driver_id = d.id
      WHERE ds.is_collected = false
        AND d.deleted_at IS NULL
      ORDER BY d.name, ds.session_date DESC
    `

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    console.error("Error fetching all active sessions:", error)
    return NextResponse.json(
      { error: "فشل في تحميل الجلسات" },
      { status: 500 }
    )
  }
}
