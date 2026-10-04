import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.NEON_POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No database connection string found");
  process.exit(1);
}

const sql = neon(connectionString);

async function migrate() {
  try {
    await sql`ALTER TABLE driver_tasks ADD COLUMN IF NOT EXISTS cash_note TEXT`;
    console.log("Successfully added cash_note column to driver_tasks table");
  } catch (error) {
    console.error("Migration error:", error.message);
    process.exit(1);
  }
}

migrate();
