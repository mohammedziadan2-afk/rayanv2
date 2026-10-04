import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { validateCSRFTokenFromRequest } from "@/lib/csrf-server"
import { sanitizeString } from "@/lib/input-sanitizer"
import { checkRateLimit } from "@/lib/rate-limiter-api"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimitResult = checkRateLimit(`shipping-request:${ip}`, {
      maxRequests: 5, // 5 requests
      windowMs: 15 * 60 * 1000, // per 15 minutes
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً",
          resetTime: rateLimitResult.resetTime,
        },
        { status: 429 },
      )
    }

    const data = await request.json()

    const csrfToken = data.csrf_token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      return NextResponse.json({ success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }, { status: 403 })
    }

    const sanitizedCustomerName = sanitizeString(data.customer_name)
    const sanitizedCustomerPhone = sanitizeString(data.customer_phone)
    const sanitizedPickupAddress = sanitizeString(data.pickup_address)
    const sanitizedDeliveryAddress = sanitizeString(data.delivery_address)
    const sanitizedPackageDescription = data.package_description ? sanitizeString(data.package_description) : null

    const requestNumber = data.request_number || `REQ${Date.now().toString().slice(-8)}`

    const result = await sql`
      INSERT INTO shipping_requests (
        customer_name,
        customer_phone,
        pickup_address,
        delivery_address,
        package_description,
        request_number,
        status,
        created_at
      ) VALUES (
        ${sanitizedCustomerName},
        ${sanitizedCustomerPhone},
        ${sanitizedPickupAddress},
        ${sanitizedDeliveryAddress},
        ${sanitizedPackageDescription},
        ${requestNumber},
        'pending',
        NOW()
      )
      RETURNING id, request_number
    `

    return NextResponse.json({
      success: true,
      id: result[0]?.id,
      request_number: result[0]?.request_number,
      remaining: rateLimitResult.remaining,
    })
  } catch (error: any) {
    console.error("[v0] Error creating shipping request:", error)
    if (error.message?.includes("CSRF")) {
      return NextResponse.json({ success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: "حدث خطأ في إرسال الطلب. حاول مرة أخرى." }, { status: 500 })
  }
}
