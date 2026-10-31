import { NextResponse } from "next/server"
import { getShekelRate } from "@/app/actions/settings"

export async function GET() {
  try {
    const rate = await getShekelRate()
    return NextResponse.json({ rate })
  } catch (error) {
    console.error("Error fetching shekel rate:", error)
    return NextResponse.json({ rate: 0.77 }) // Default rate
  }
}
