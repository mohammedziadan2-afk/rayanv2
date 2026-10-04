import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicRoutes = ["/", "/login", "/customer-track", "/customers", "/track", "/track-shipment", "/request-shipping", "/subscriber-login"]

const publicPatterns = [
  /^\/track-request\/.+$/,
  /^\/shipment\/.+$/,
  /^\/driver-view\/.+$/,
  /^\/subscriber\/.+$/,
  /^\/_next\/.+$/,
  /^\/api\/.+$/,
  /^\/favicon\.ico$/,
  /^\/images\/.+$/,
  /^\/manifest\.json$/,
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route is public
  const isPublicRoute = publicRoutes.includes(pathname) || publicPatterns.some((pattern) => pattern.test(pathname))

  const response = NextResponse.next()

  // Basic security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-XSS-Protection", "1; mode=block")

  // Strict-Transport-Security (HSTS) - forces HTTPS
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

  // Permissions Policy - restrict browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()",
  )

  // Content-Security-Policy - stricter in production
  const isProduction = process.env.NODE_ENV === 'production'
  const cspHeader = [
    "default-src 'self'",
    // In production, avoid unsafe-eval; in dev, Next.js requires it
    isProduction 
      ? "script-src 'self' 'unsafe-inline' https://*.supabase.co https://vercel.live https://*.neon.tech"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://vercel.live https://*.neon.tech",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://*.neon.tech https://vercel.live wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ")

  response.headers.set("Content-Security-Policy", cspHeader)

  if (isPublicRoute) {
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|manifest.json).*)",
  ],
}
