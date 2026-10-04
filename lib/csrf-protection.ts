import crypto from "crypto"

const CSRF_TOKEN_LENGTH = 32
const csrfTokens = new Map<string, { token: string; expires: number }>()

export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex")
  const expires = Date.now() + 3600000 // ساعة واحدة

  csrfTokens.set(sessionId, { token, expires })

  // تنظيف الـ tokens القديمة
  cleanupExpiredTokens()

  return token
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId)

  if (!stored) {
    return false
  }

  if (Date.now() > stored.expires) {
    csrfTokens.delete(sessionId)
    return false
  }

  return stored.token === token
}

function cleanupExpiredTokens() {
  const now = Date.now()
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (now > data.expires) {
      csrfTokens.delete(sessionId)
    }
  }
}

export function deleteCSRFToken(sessionId: string) {
  csrfTokens.delete(sessionId)
}
