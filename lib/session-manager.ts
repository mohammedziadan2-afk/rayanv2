import { cookies } from "next/headers"

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours

interface SessionData {
  userId: string
  username: string
  role: string
  createdAt: number
  lastActivity: number
}

const sessions = new Map<string, SessionData>()

export function createSession(userId: string, username: string, role: string): string {
  const sessionId = crypto.randomUUID()
  const now = Date.now()

  sessions.set(sessionId, {
    userId,
    username,
    role,
    createdAt: now,
    lastActivity: now,
  })

  // Set secure cookie
  cookies().set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ABSOLUTE_TIMEOUT / 1000,
    path: "/",
  })

  return sessionId
}

export function getSession(sessionId: string): SessionData | null {
  const session = sessions.get(sessionId)

  if (!session) {
    return null
  }

  const now = Date.now()

  // Check absolute timeout
  if (now - session.createdAt > ABSOLUTE_TIMEOUT) {
    sessions.delete(sessionId)
    return null
  }

  // Check inactivity timeout
  if (now - session.lastActivity > SESSION_TIMEOUT) {
    sessions.delete(sessionId)
    return null
  }

  // Update last activity
  session.lastActivity = now
  sessions.set(sessionId, session)

  return session
}

export function refreshSession(sessionId: string): boolean {
  const session = sessions.get(sessionId)

  if (!session) {
    return false
  }

  const now = Date.now()

  // Check if session expired
  if (now - session.createdAt > ABSOLUTE_TIMEOUT || now - session.lastActivity > SESSION_TIMEOUT) {
    sessions.delete(sessionId)
    return false
  }

  // Update last activity
  session.lastActivity = now
  sessions.set(sessionId, session)

  return true
}

export function destroySession(sessionId: string): void {
  sessions.delete(sessionId)
  cookies().delete("session_id")
}

export function cleanExpiredSessions(): void {
  const now = Date.now()

  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.createdAt > ABSOLUTE_TIMEOUT || now - session.lastActivity > SESSION_TIMEOUT) {
      sessions.delete(sessionId)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanExpiredSessions, 5 * 60 * 1000)
