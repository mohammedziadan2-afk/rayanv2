"use server"

import { sql } from "@/lib/neon/server"

export interface AuthUser {
  id: string
  username: string
  role: "admin" | "user"
  full_name?: string
  last_activity?: string
}

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

export async function getCurrentUser(userId: string): Promise<AuthUser | null> {
  try {
    const [user] = await sql`
      SELECT id, username, role, full_name, last_activity
      FROM app_users 
      WHERE id = ${userId}
      LIMIT 1
    `

    if (!user) {
      return null
    }

    if (user.last_activity) {
      const lastActivity = new Date(user.last_activity).getTime()
      const now = Date.now()

      if (now - lastActivity > SESSION_TIMEOUT) {
        console.log(`[v0] Session expired for user ${user.username}`)
        return null
      }
    }

    await sql`
      UPDATE app_users 
      SET last_activity = NOW()
      WHERE id = ${userId}
    `

    return user as AuthUser
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function requireAuth(userId: string | null): Promise<AuthUser> {
  if (!userId) {
    throw new Error("غير مصرح - يرجى تسجيل الدخول")
  }

  const user = await getCurrentUser(userId)

  if (!user) {
    throw new Error("انتهت صلاحية الجلسة - يرجى تسجيل الدخول مرة أخرى")
  }

  return user
}

export async function requireAdmin(userId: string | null): Promise<AuthUser> {
  const user = await requireAuth(userId)

  if (user.role !== "admin") {
    await sql`
      INSERT INTO security_logs (event_type, username, success, details, timestamp)
      VALUES ('unauthorized_access', ${user.username}, false, 'Attempted to access admin resource', NOW())
    `
    throw new Error("غير مصرح - يتطلب صلاحيات المدير")
  }

  return user
}

export async function checkPermission(user: AuthUser, requiredRole: "admin" | "user"): Promise<boolean> {
  if (requiredRole === "admin") {
    return user.role === "admin"
  }
  return true
}

export async function logoutUser(userId: string): Promise<void> {
  try {
    await sql`
      UPDATE app_users 
      SET last_activity = NULL
      WHERE id = ${userId}
    `
  } catch (error) {
    console.error("Error logging out user:", error)
  }
}
