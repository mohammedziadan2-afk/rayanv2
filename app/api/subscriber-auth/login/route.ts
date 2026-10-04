import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { sanitizeString } from "@/lib/input-sanitizer"
import { checkRateLimit, AUTH_RATE_LIMIT, getRateLimitHeaders } from "@/lib/rate-limiter-api"

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown"
    
    // Check rate limit using stricter AUTH_RATE_LIMIT
    const rateLimit = checkRateLimit(`subscriber-login:${clientIp}`, AUTH_RATE_LIMIT)
    if (!rateLimit.allowed) {
      const errorMessage = rateLimit.blocked 
        ? "تم حظر IP الخاص بك مؤقتاً بسبب محاولات متكررة. حاول لاحقاً."
        : "تم تجاوز عدد المحاولات المسموحة. حاول بعد 15 دقيقة."
      
      return NextResponse.json(
        { error: errorMessage },
        { 
          status: 429,
          headers: {
            ...getRateLimitHeaders(rateLimit),
            "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000))
          }
        }
      )
    }
    
    const body = await request.json()
    const { username, password } = body
    
    if (!username || !password) {
      return NextResponse.json(
        { error: "اسم المستخدم وكلمة المرور مطلوبين" },
        { status: 400 }
      )
    }
    
    // Sanitize input
    const sanitizedUsername = sanitizeString(username)
    
    // Find subscriber
    const subscribers = await sql`
      SELECT id, username, password_hash, full_name, is_active
      FROM subscribers
      WHERE username = ${sanitizedUsername}
    `
    
    if (subscribers.length === 0) {
      // Use same error message to prevent username enumeration
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
        { status: 401 }
      )
    }
    
    const subscriber = subscribers[0]
    
    // Check if active
    if (!subscriber.is_active) {
      return NextResponse.json(
        { error: "حسابك غير فعال. تواصل مع الإدارة." },
        { status: 403 }
      )
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, subscriber.password_hash)
    
    if (!isValid) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
        { status: 401 }
      )
    }
    
    // Return subscriber info (without password)
    return NextResponse.json({
      success: true,
      subscriber: {
        id: subscriber.id,
        username: subscriber.username,
        full_name: subscriber.full_name
      }
    })
  } catch (error: any) {
    // Don't expose internal error details
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "حدث خطأ في تسجيل الدخول. حاول مرة أخرى." }, 
      { status: 500 }
    )
  }
}
