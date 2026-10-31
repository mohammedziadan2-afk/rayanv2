"use server"
import { sql } from "@/lib/neon/server"
import { SecureLogger } from "@/lib/secure-logger"
import bcrypt from "bcryptjs"
import { validatePassword } from "@/lib/password-policy"
import { sanitizeString } from "@/lib/input-sanitizer"
import { validateCSRFTokenFromRequest } from "@/lib/csrf-server"
import { logAudit } from "@/lib/audit-logger"

export interface User {
  id: string
  username: string
  password: string
  role: "admin" | "user"
  full_name?: string
  created_at: string
  updated_at: string
}

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockoutUntil?: number }>()
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const ACCOUNT_LOCKOUT_THRESHOLD = 10 // Lock account after 10 failed attempts
const ACCOUNT_LOCKOUT_DURATION = 60 * 60 * 1000 // 1 hour

async function logSecurityEvent(event: string, username: string, success: boolean, details?: string) {
  try {
    // Log to security_logs table (legacy)
    await sql`
      INSERT INTO security_logs (event_type, username, success, details, ip_address, timestamp)
      VALUES (${event}, ${username}, ${success}, ${details}, 'server', NOW())
    `
    
    // Also log to audit_logs (new system)
    await logAudit({
      action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      userId: username,
      userType: 'admin',
      details: { event, details },
      severity: success ? 'INFO' : 'CRITICAL'
    })
  } catch (error) {
    SecureLogger.error("Failed to log security event", error)
  }
}

function checkRateLimit(username: string): { allowed: boolean; remainingTime?: number; accountLocked?: boolean } {
  const now = Date.now()
  const attempts = loginAttempts.get(username)

  if (!attempts) {
    return { allowed: true }
  }

  if (attempts.count >= ACCOUNT_LOCKOUT_THRESHOLD) {
    if (attempts.lockoutUntil && now < attempts.lockoutUntil) {
      const remainingTime = Math.ceil((attempts.lockoutUntil - now) / 1000 / 60)
      return { allowed: false, remainingTime, accountLocked: true }
    } else {
      loginAttempts.delete(username)
      return { allowed: true }
    }
  }

  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(username)
    return { allowed: true }
  }

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_DURATION - (now - attempts.lastAttempt)) / 1000 / 60)
    return { allowed: false, remainingTime }
  }

  return { allowed: true }
}

function recordLoginAttempt(username: string, success: boolean) {
  const now = Date.now()
  const attempts = loginAttempts.get(username)

  if (success) {
    loginAttempts.delete(username)
  } else {
    if (!attempts) {
      loginAttempts.set(username, { count: 1, lastAttempt: now })
    } else {
      const newCount = attempts.count + 1

      if (newCount >= ACCOUNT_LOCKOUT_THRESHOLD) {
        loginAttempts.set(username, {
          count: newCount,
          lastAttempt: now,
          lockoutUntil: now + ACCOUNT_LOCKOUT_DURATION,
        })
      } else {
        loginAttempts.set(username, { count: newCount, lastAttempt: now })
      }
    }
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)
  return hash
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!hash.startsWith("$2") && hash.length === 64) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return passwordHash === hash
  }

  if (hash.startsWith("$2")) {
    return await bcrypt.compare(password, hash)
  }

  return password === hash
}

export async function getUsers() {
  try {
    return await retryWithBackoff(async () => {
      const users = await sql`
        SELECT * FROM app_users 
        ORDER BY created_at DESC
      `

      return (users as User[]) || []
    })
  } catch (error) {
    return []
  }
}

export async function loginUser(username: string, password: string, csrfToken?: string) {
  const CSRF_ENABLED = true // تغيير إلى true لتفعيل CSRF

  const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
  if (!isCsrfValid) {
    await logSecurityEvent("csrf_validation_failed", username || "unknown", false, "Invalid CSRF token on login")
    return { error: "رمز الحماية غير صحيح. الرجاء إعادة تحميل الصفحة والمحاولة مرة أخرى." }
  }

  const sanitizedUsername = sanitizeString(username)

  const rateLimitCheck = checkRateLimit(sanitizedUsername)
  if (!rateLimitCheck.allowed) {
    const message = rateLimitCheck.accountLocked
      ? `الحساب مقفل مؤقتاً. حاول مرة أخرى بعد ${rateLimitCheck.remainingTime} دقيقة`
      : `تم تجاوز عدد المحاولات المسموحة. حاول مرة أخرى بعد ${rateLimitCheck.remainingTime} دقيقة`

    await logSecurityEvent(
      rateLimitCheck.accountLocked ? "account_locked" : "login_blocked",
      sanitizedUsername,
      false,
      message,
    )
    return { error: message }
  }

  const [data] = await sql`
    SELECT * FROM app_users 
    WHERE username = ${sanitizedUsername}
    LIMIT 1
  `

  if (!data) {
    recordLoginAttempt(sanitizedUsername, false)
    await logSecurityEvent("login_failed", sanitizedUsername, false, "User not found")
    return null
  }

  let isPasswordValid = false

  isPasswordValid = await comparePassword(password, data.password)

  if (isPasswordValid && !data.password.startsWith("$2")) {
    const hashedPassword = await hashPassword(password)
    await sql`
      UPDATE app_users 
      SET password = ${hashedPassword}, updated_at = NOW()
      WHERE id = ${data.id}
    `
    await logSecurityEvent("password_upgraded", sanitizedUsername, true, "Upgraded to bcrypt")
  }

  if (!isPasswordValid) {
    recordLoginAttempt(sanitizedUsername, false)
    await logSecurityEvent("login_failed", sanitizedUsername, false, "Invalid password")
    return null
  }

  recordLoginAttempt(sanitizedUsername, true)
  await logSecurityEvent("login_success", sanitizedUsername, true)

  return data as User
}

export async function createUser(
  username: string,
  password: string,
  role: "admin" | "user",
  fullName?: string,
  csrfToken?: string,
) {
  const CSRF_ENABLED = true

  const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
  if (!isCsrfValid) {
    await logSecurityEvent("csrf_validation_failed", username, false, "Invalid CSRF token on user creation")
    return { success: false, error: "رمز الحماية غير صحيح. الرجاء إعادة تحميل الصفحة والمحاولة مرة أخرى." }
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.errors.join(". ") }
  }

  const sanitizedUsername = sanitizeString(username)
  const sanitizedFullName = fullName ? sanitizeString(fullName) : undefined

  const [existing] = await sql`
    SELECT id FROM app_users 
    WHERE username = ${sanitizedUsername}
    LIMIT 1
  `

  if (existing) {
    return { success: false, error: "اسم المستخدم موجود بالفعل" }
  }

  const hashedPassword = await hashPassword(password)

  const [data] = await sql`
    INSERT INTO app_users (username, password, role, full_name)
    VALUES (${sanitizedUsername}, ${hashedPassword}, ${role}, ${sanitizedFullName})
    RETURNING *
  `

  if (!data) {
    SecureLogger.error("Error creating user", new Error("Failed to create user"))
    return { success: false, error: "فشل في إنشاء المستخدم" }
  }

  await logSecurityEvent("user_created", sanitizedUsername, true, `Role: ${role}`)

  return { success: true, data: data as User }
}

export async function updateUserPassword(userId: string, newPassword: string, csrfToken?: string) {
  const CSRF_ENABLED = true

  const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
  if (!isCsrfValid) {
    await logSecurityEvent("csrf_validation_failed", userId, false, "Invalid CSRF token on password change")
    return { success: false, error: "رمز الحماية غير صحيح. الرجاء إعادة تحميل الصفحة والمحاولة مرة أخرى." }
  }

  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.errors.join(". ") }
  }

  const hashedPassword = await hashPassword(newPassword)

  await sql`
    UPDATE app_users 
    SET password = ${hashedPassword}, updated_at = NOW()
    WHERE id = ${userId}
  `

  const [user] = await sql`
    SELECT username FROM app_users 
    WHERE id = ${userId}
    LIMIT 1
  `

  if (user) {
    await logSecurityEvent("password_changed", user.username, true)
  }

  return { success: true }
}

export async function deleteUser(userId: string, csrfToken?: string) {
  const CSRF_ENABLED = true

  const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
  if (!isCsrfValid) {
    await logSecurityEvent("csrf_validation_failed", userId, false, "Invalid CSRF token on user deletion")
    return { success: false, error: "رمز الحماية غير صحيح. الرجاء إعادة تحميل الصفحة والمحاولة مرة أخرى." }
  }

  const [user] = await sql`
    SELECT username FROM app_users 
    WHERE id = ${userId}
    LIMIT 1
  `

  await sql`
    DELETE FROM app_users 
    WHERE id = ${userId}
  `

  if (user) {
    await logSecurityEvent("user_deleted", user.username, true)
  }

  return { success: true }
}

export async function initializeDefaultAdmin() {
  const users = await sql`
    SELECT id FROM app_users 
    LIMIT 1
  `

  if (users && users.length > 0) {
    return { success: true, message: "Users already exist" }
  }

  if (!process.env.DEFAULT_ADMIN_PASSWORD) {
    throw new Error("DEFAULT_ADMIN_PASSWORD environment variable is required for initial setup")
  }

  const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin"
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD

  const passwordValidation = validatePassword(defaultPassword)
  if (!passwordValidation.valid) {
    throw new Error(
      "DEFAULT_ADMIN_PASSWORD does not meet security requirements: " + passwordValidation.errors.join(", "),
    )
  }

  const hashedPassword = await hashPassword(defaultPassword)

  try {
    await sql`
      INSERT INTO app_users (username, password, role, full_name)
      VALUES (${defaultUsername}, ${hashedPassword}, 'admin', 'المدير')
    `

    await logSecurityEvent("default_admin_created", defaultUsername, true)

    return { success: true, message: "Default admin created" }
  } catch (error) {
    SecureLogger.error("Error creating default admin", error)
    return { success: false, error: String(error) }
  }
}
