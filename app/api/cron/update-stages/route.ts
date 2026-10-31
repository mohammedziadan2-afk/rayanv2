import { NextResponse } from "next/server"
import { runAutoStageUpdates } from "@/app/actions/tracking"

// This API route can be called by a cron job to auto-update shipment stages
// Configure in vercel.json or use external cron service

export async function GET(request: Request) {
  try {
    // Verify cron secret if needed
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // If CRON_SECRET is set, verify it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await runAutoStageUpdates()

    return NextResponse.json({
      success: result.success,
      message: `تم تحديث ${result.count} شحنة إلى المرحلة 3`,
      count: result.count,
    })
  } catch (error) {
    console.error("[v0] Cron update stages error:", error)
    return NextResponse.json({ error: "فشل في تحديث المراحل" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0
