import { NextResponse } from "next/server"
import { generateCSRFTokenForSession } from "@/lib/csrf-server"

export async function GET() {
  try {
    const { sessionId, token } = await generateCSRFTokenForSession()

    const response = NextResponse.json({ token })

    // No need to set it again here

    return response
  } catch (error) {
    console.error("[v0] Error generating CSRF token:", error)
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 })
  }
}
