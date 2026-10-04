import { neon } from "@neondatabase/serverless"

if (!process.env.NEON_DATABASE_URL) {
  console.error("[v0] Error: NEON_DATABASE_URL environment variable is required")
  process.exit(1)
}

const sql = neon(process.env.NEON_DATABASE_URL)

async function setupSecurityTables() {
  try {
    console.log("[v0] Setting up security tables...")

    // Create security_logs table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS security_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES app_users(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("[v0] security_logs table ready")

    // Create index for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_security_logs_user_id 
      ON security_logs(user_id)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_security_logs_event_type 
      ON security_logs(event_type)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_security_logs_created_at 
      ON security_logs(created_at)
    `
    console.log("[v0] Indexes created")

    // Add columns to app_users if they don't exist
    try {
      await sql`
        ALTER TABLE app_users 
        ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0
      `
      console.log("[v0] Added failed_login_attempts column")
    } catch (e) {
      // Column might already exist
    }

    try {
      await sql`
        ALTER TABLE app_users 
        ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP
      `
      console.log("[v0] Added account_locked_until column")
    } catch (e) {
      // Column might already exist
    }

    try {
      await sql`
        ALTER TABLE app_users 
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
      `
      console.log("[v0] Added last_login column")
    } catch (e) {
      // Column might already exist
    }

    try {
      await sql`
        ALTER TABLE app_users 
        ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP DEFAULT NOW()
      `
      console.log("[v0] Added last_password_change column")
    } catch (e) {
      // Column might already exist
    }

    console.log("\n[v0] Security tables setup completed successfully!")
    console.log("[v0] You can now use the enhanced security features")
  } catch (error) {
    console.error("[v0] Error setting up security tables:", error)
    throw error
  }
}

setupSecurityTables()
