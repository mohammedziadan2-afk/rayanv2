import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

if (!process.env.NEON_DATABASE_URL) {
  console.error("[v0] Error: NEON_DATABASE_URL environment variable is required")
  process.exit(1)
}

const sql = neon(process.env.NEON_DATABASE_URL)

// Legacy SHA-256 hashing function for comparison
function legacyHashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

async function migratePasswordsToBcrypt() {
  try {
    console.log("[v0] Starting password migration to bcrypt...")

    // Get all users
    const users = await sql`
      SELECT id, username, password FROM app_users
    `

    console.log(`[v0] Found ${users.length} users to check`)

    let migrated = 0
    let alreadyBcrypt = 0
    let errors = 0

    for (const user of users) {
      try {
        // Check if password is already bcrypt (bcrypt hashes start with $2a$, $2b$, or $2y$)
        if (user.password.startsWith("$2")) {
          console.log(`[v0] User '${user.username}' already using bcrypt`)
          alreadyBcrypt++
          continue
        }

        console.log(`[v0] Migrating user '${user.username}'...`)

        // For legacy passwords, we need to prompt for password reset
        // or use a default if specified
        const defaultPassword = process.env.MIGRATION_DEFAULT_PASSWORD

        if (!defaultPassword) {
          console.log(`[v0] Skipping '${user.username}' - no default password specified`)
          console.log(`[v0] User will need to reset password on next login`)
          continue
        }

        // Hash with bcrypt
        const hashedPassword = await bcrypt.hash(defaultPassword, 10)

        // Update user password
        await sql`
          UPDATE app_users 
          SET password = ${hashedPassword},
              updated_at = NOW()
          WHERE id = ${user.id}
        `

        // Log security event
        await sql`
          INSERT INTO security_logs (user_id, event_type, details, ip_address)
          VALUES (${user.id}, 'password_migration', 'Password migrated to bcrypt', 'system')
        `

        console.log(`[v0] User '${user.username}' migrated successfully`)
        migrated++
      } catch (error) {
        console.error(`[v0] Error migrating user '${user.username}':`, error)
        errors++
      }
    }

    console.log("\n[v0] Migration Summary:")
    console.log(`[v0] Total users: ${users.length}`)
    console.log(`[v0] Already using bcrypt: ${alreadyBcrypt}`)
    console.log(`[v0] Migrated: ${migrated}`)
    console.log(`[v0] Errors: ${errors}`)

    if (migrated > 0) {
      console.log("\n[v0] IMPORTANT: Users migrated with default password should change their passwords on next login")
    }
  } catch (error) {
    console.error("[v0] Error during migration:", error)
    throw error
  }
}

migratePasswordsToBcrypt()
