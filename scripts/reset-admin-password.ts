import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

if (!process.env.NEON_DATABASE_URL) {
  console.error("[v0] Error: NEON_DATABASE_URL environment variable is required")
  process.exit(1)
}

if (!process.env.NEW_PASSWORD) {
  console.error("[v0] Error: NEW_PASSWORD environment variable is required")
  console.error("[v0] Usage: NEW_PASSWORD=your_new_password npm run reset-admin-password")
  console.error("[v0] Password must be at least 10 characters long")
  process.exit(1)
}

const sql = neon(process.env.NEON_DATABASE_URL)

async function resetAdminPassword() {
  try {
    console.log("[v0] Starting admin password reset...")

    const newPassword = process.env.NEW_PASSWORD!
    const username = process.env.ADMIN_USERNAME || "admin"

    // Validate password strength
    if (newPassword.length < 10) {
      console.error("[v0] Error: Password must be at least 10 characters long")
      process.exit(1)
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      console.error(
        "[v0] Error: Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      )
      process.exit(1)
    }

    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    console.log("[v0] Password hashed successfully with bcrypt")

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM app_users WHERE username = ${username}
    `

    if (existingUser.length === 0) {
      console.error(`[v0] Error: User '${username}' not found`)
      process.exit(1)
    }

    // Update the admin user password
    await sql`
      UPDATE app_users 
      SET password = ${hashedPassword}, 
          updated_at = NOW()
      WHERE username = ${username}
    `

    // Log security event
    await sql`
      INSERT INTO security_logs (user_id, event_type, details, ip_address)
      VALUES (${existingUser[0].id}, 'password_reset', 'Password reset via script', 'system')
    `

    console.log("[v0] Admin password reset successfully!")
    console.log(`[v0] Username: ${username}`)
    console.log("[v0] Please login with your new password and keep it secure.")
  } catch (error) {
    console.error("[v0] Error resetting admin password:", error)
    throw error
  }
}

resetAdminPassword()
