import { cookies } from "next/headers"
import { generateCSRFToken, validateCSRFToken } from "./csrf"

const CSRF_COOKIE_NAME = "csrf_session"
const CSRF_COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

export async function getOrCreateCSRFSession(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!sessionId) {
    sessionId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36)

    cookieStore.set(CSRF_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CSRF_COOKIE_MAX_AGE,
      path: "/",
    })
  }

  return sessionId
}

export async function generateCSRFTokenForSession(): Promise<{ sessionId: string; token: string }> {
  const sessionId = await getOrCreateCSRFSession()
  const token = generateCSRFToken(sessionId)
  return { sessionId, token }
}

export async function validateCSRFTokenFromRequest(token: string | null | undefined): Promise<boolean> {
  if (!token) {
    return false
  }

  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(CSRF_COOKIE_NAME)?.value

    if (!sessionId) {
      return false
    }

    return validateCSRFToken(sessionId, token)
  } catch {
    return false
  }
}

export function createCSRFError() {
  return new Error("رمز الحماية غير صحيح. الرجاء إعادة تحميل الصفحة والمحاولة مرة أخرى.")
}
