// Enhanced rate limiter for API routes with sliding window and IP tracking

interface RateLimitRecord {
  count: number
  resetTime: number
  blocked: boolean
  blockExpiry?: number
}

// Use WeakRef-friendly storage with automatic cleanup
const requestCounts = new Map<string, RateLimitRecord>()

// Track suspicious IPs that hit rate limits repeatedly
const suspiciousIPs = new Map<string, { violations: number; lastViolation: number }>()

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  blockDurationMs?: number  // How long to block after repeated violations
  maxViolations?: number    // Number of violations before blocking
}

export const DEFAULT_API_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,  // 15 minutes block
  maxViolations: 3,  // Block after 3 violations
}

// Stricter limits for authentication endpoints
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,  // 15 minutes
  blockDurationMs: 60 * 60 * 1000,  // 1 hour block
  maxViolations: 2,
}

// Stricter limits for sensitive operations
export const SENSITIVE_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 3,
  windowMs: 60 * 1000,
  blockDurationMs: 30 * 60 * 1000,
  maxViolations: 2,
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_API_RATE_LIMIT,
): {
  allowed: boolean
  remaining: number
  resetTime: number
  blocked?: boolean
} {
  const now = Date.now()
  const record = requestCounts.get(identifier)
  
  // Check if IP is blocked due to repeated violations
  const ipKey = identifier.split(':')[0]
  const suspiciousRecord = suspiciousIPs.get(ipKey)
  if (suspiciousRecord && suspiciousRecord.violations >= (config.maxViolations || 3)) {
    const blockExpiry = suspiciousRecord.lastViolation + (config.blockDurationMs || 15 * 60 * 1000)
    if (now < blockExpiry) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockExpiry,
        blocked: true,
      }
    } else {
      // Reset violations after block expires
      suspiciousIPs.delete(ipKey)
    }
  }

  if (!record || now > record.resetTime) {
    // New window
    const resetTime = now + config.windowMs
    requestCounts.set(identifier, { count: 1, resetTime, blocked: false })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    }
  }

  if (record.count >= config.maxRequests) {
    // Rate limit exceeded - track violation
    const existing = suspiciousIPs.get(ipKey) || { violations: 0, lastViolation: 0 }
    suspiciousIPs.set(ipKey, {
      violations: existing.violations + 1,
      lastViolation: now,
    })
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  // Increment count
  record.count++
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  }
}

// Get rate limit headers for response
export function getRateLimitHeaders(result: ReturnType<typeof checkRateLimit>): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
    ...(result.blocked ? { 'X-RateLimit-Blocked': 'true' } : {}),
  }
}

// Cleanup old entries periodically (more aggressive cleanup)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    
    // Cleanup request counts
    for (const [key, record] of requestCounts.entries()) {
      if (now > record.resetTime + 60000) { // 1 minute grace period
        requestCounts.delete(key)
      }
    }
    
    // Cleanup old suspicious IP records (after 24 hours)
    for (const [key, record] of suspiciousIPs.entries()) {
      if (now - record.lastViolation > 24 * 60 * 60 * 1000) {
        suspiciousIPs.delete(key)
      }
    }
    
    // Prevent memory issues - limit map sizes
    if (requestCounts.size > 10000) {
      const entries = Array.from(requestCounts.entries())
      entries.sort((a, b) => a[1].resetTime - b[1].resetTime)
      entries.slice(0, 5000).forEach(([key]) => requestCounts.delete(key))
    }
  }, 30 * 1000) // cleanup every 30 seconds
}
