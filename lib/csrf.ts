import { createHash, randomBytes } from "crypto"

// Generate a secure random secret if not provided
function getCSRFSecret(): string {
  const secret = process.env.CSRF_SECRET
  if (!secret) {
    // In production, this should always be set via environment variable
    console.warn("[SECURITY WARNING] CSRF_SECRET not set. Using random secret - tokens will not persist across restarts.")
    return randomBytes(32).toString("hex")
  }
  return secret
}

// Cache the secret for the lifetime of the process
let cachedSecret: string | null = null
function getCachedSecret(): string {
  if (!cachedSecret) {
    cachedSecret = getCSRFSecret()
  }
  return cachedSecret
}

export function generateCSRFToken(sessionId: string): string {
  // Generate token based on session ID + secret + timestamp
  const secret = getCachedSecret()
  const timestamp = Date.now().toString()

  const hash = createHash("sha256")
    .update(sessionId + secret + timestamp)
    .digest("hex")

  // Return token in format: hash.timestamp
  return `${hash}.${timestamp}`
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  if (!token || !token.includes(".")) {
    return false
  }

  const [hash, timestamp] = token.split(".")
  const tokenAge = Date.now() - Number.parseInt(timestamp, 10)

  // Token expires after 1 hour
  const TOKEN_EXPIRY = 60 * 60 * 1000
  if (tokenAge > TOKEN_EXPIRY) {
    return false
  }

  // Regenerate hash and compare using constant-time comparison
  const secret = getCachedSecret()
  const expectedHash = createHash("sha256")
    .update(sessionId + secret + timestamp)
    .digest("hex")

  // Use timing-safe comparison to prevent timing attacks
  if (hash.length !== expectedHash.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < hash.length; i++) {
    result |= hash.charCodeAt(i) ^ expectedHash.charCodeAt(i)
  }
  
  return result === 0
}

export function deleteCSRFToken(_sessionId: string): void {
  // No-op since we don't store tokens anymore
}
