import { logger } from "./logger"
import { sql } from "@/lib/neon/server"

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimits = new Map<string, RateLimitEntry>()

setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of rateLimits.entries()) {
      if (now > entry.resetAt) {
        rateLimits.delete(key)
      }
    }
  },
  5 * 60 * 1000,
)

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000,
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const key = `rate_limit:${identifier}`

  let entry = rateLimits.get(key)

  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    }
    rateLimits.set(key, entry)
  }

  entry.count++

  const allowed = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)

  if (!allowed) {
    try {
      await sql`
        INSERT INTO security_logs (event_type, username, success, details, ip_address, timestamp)
        VALUES ('rate_limit_exceeded', ${identifier}, false, ${JSON.stringify({ maxRequests: config.maxRequests, windowMs: config.windowMs })}, ${identifier}, NOW())
      `
    } catch (error) {
      logger.error("Error logging rate limit", error)
    }
  }

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
  }
}

export const RATE_LIMIT_CONFIGS = {
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  api: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
  heavy: { maxRequests: 10, windowMs: 60 * 1000 },
  standard: { maxRequests: 30, windowMs: 60 * 1000 },
}

// دالة مساعدة للحصول على معرف فريد (IP أو user ID)
export function getRateLimitIdentifier(request?: Request): string {
  const ip = request?.headers.get("x-forwarded-for")?.split(",")[0] || request?.headers.get("x-real-ip") || "unknown"
  return `ip:${ip}`
}
