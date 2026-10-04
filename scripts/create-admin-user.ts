import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

if (!process.env.NEON_DATABASE_URL) {
  console.error("[v0] Error: NEON_DATABASE_URL environment variable is required")
  process.exit(1)
}

if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
  console.error("[v0] Error: ADMIN_USERNAME and ADMIN_PASSWORD environment variables are required")
  console.error("[v0] Usage: ADMIN_USERNAME=your_username ADMIN_PASSWORD=your_password npm run create-admin")
  process.exit(1)
}

const sql = neon(process.env.NEON_DATABASE_URL)

async function createAdminUser() {
  try {
    console.log("[v0] Starting admin user creation...")

    const username = process.env.ADMIN_USERNAME!
    const password = process.env.ADMIN_PASSWORD!

    if (password.length < 10) {
      console.error("[v0] Error: Password must be at least 10 characters long")
      process.exit(1)
    }

    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log("[v0] Password hashed successfully")

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM app_users WHERE username = ${username}
    `

    if (existingUser.length > 0) {
      console.log("[v0] Admin user already exists")
      return
    }

    // Insert the admin user
    await sql`
      INSERT INTO app_users (username, password, role)
      VALUES (${username}, ${hashedPassword}, 'admin')
    `

    console.log("[v0] Admin user created successfully!")
    console.log(`[v0] Username: ${username}`)
    console.log("[v0] Role: admin")
    console.log("[v0] Please keep your credentials secure and change the password after first login.")
  } catch (error) {
    console.error("[v0] Error creating admin user:", error)
    throw error
  }
}

createAdminUser()
