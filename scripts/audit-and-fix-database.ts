import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

interface ColumnDefinition {
  name: string
  type: string
  nullable?: boolean
  default?: string
}

interface TableSchema {
  [tableName: string]: ColumnDefinition[]
}

// Define expected schema for all tables
const expectedSchema: TableSchema = {
  shipments: [
    { name: "id", type: "SERIAL PRIMARY KEY" },
    { name: "tracking_number", type: "TEXT NOT NULL UNIQUE" },
    { name: "sender_name", type: "TEXT NOT NULL" },
    { name: "sender_phone", type: "TEXT" },
    { name: "sender_id_number", type: "TEXT" },
    { name: "sender_address", type: "TEXT" },
    { name: "sender_country", type: "TEXT DEFAULT 'الأردن'" },
    { name: "receiver_name", type: "TEXT NOT NULL" },
    { name: "receiver_phone", type: "TEXT NOT NULL" },
    { name: "receiver_address", type: "TEXT" },
    { name: "receiver_country", type: "TEXT DEFAULT 'الأردن'" },
    { name: "shipment_type", type: "TEXT" },
    { name: "description", type: "TEXT" },
    { name: "weight", type: "DECIMAL(10,2)" },
    { name: "price", type: "DECIMAL(10,2)" },
    { name: "driver_fee", type: "DECIMAL(10,2)" },
    { name: "payment_status", type: "TEXT DEFAULT 'unpaid'" },
    { name: "delivery_status", type: "TEXT DEFAULT 'pending'" },
    { name: "trip_id", type: "INTEGER REFERENCES trips(id)" },
    { name: "customer_phone", type: "TEXT" },
    { name: "received_date", type: "DATE DEFAULT CURRENT_DATE" },
    { name: "location_x", type: "DECIMAL(10,6)" },
    { name: "location_y", type: "DECIMAL(10,6)" },
    { name: "location_label", type: "TEXT" },
    { name: "location_image", type: "TEXT" },
    { name: "current_tracking_stage", type: "INTEGER DEFAULT 1" },
    { name: "notes", type: "TEXT" },
    { name: "created_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
    { name: "deleted_at", type: "TIMESTAMPTZ" },
  ],
  drivers: [
    { name: "id", type: "SERIAL PRIMARY KEY" },
    { name: "name", type: "TEXT NOT NULL" },
    { name: "phone", type: "TEXT" },
    { name: "vehicle_info", type: "TEXT" },
    { name: "status", type: "TEXT DEFAULT 'active'" },
    { name: "city", type: "TEXT DEFAULT 'رماله'" },
    { name: "created_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
    { name: "updated_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
    { name: "deleted_at", type: "TIMESTAMPTZ" },
  ],
  trips: [
    { name: "id", type: "SERIAL PRIMARY KEY" },
    { name: "trip_number", type: "TEXT NOT NULL UNIQUE" },
    { name: "departure_date", type: "DATE" },
    { name: "shipment_ids", type: "INTEGER[]" },
    { name: "driver_name", type: "TEXT" },
    { name: "vehicle_number", type: "TEXT" },
    { name: "status", type: "TEXT DEFAULT 'scheduled'" },
    { name: "notes", type: "TEXT" },
    { name: "created_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
    { name: "updated_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
    { name: "deleted_at", type: "TIMESTAMPTZ" },
  ],
  driver_sessions: [
    { name: "id", type: "SERIAL PRIMARY KEY" },
    { name: "driver_id", type: "INTEGER REFERENCES drivers(id)" },
    { name: "trip_id", type: "INTEGER REFERENCES trips(id)" },
    { name: "session_date", type: "DATE DEFAULT CURRENT_DATE" },
    { name: "session_number", type: "INTEGER DEFAULT 1" },
    { name: "total_fees", type: "DECIMAL(10,2) DEFAULT 0" },
    { name: "collected_amount", type: "DECIMAL(10,2) DEFAULT 0" },
    { name: "approved_by", type: "TEXT" },
    { name: "approved_at", type: "TIMESTAMPTZ" },
    { name: "collected_by", type: "TEXT" },
    { name: "collected_at", type: "TIMESTAMPTZ" },
    { name: "created_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
    { name: "updated_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
  ],
  driver_tasks: [
    { name: "id", type: "SERIAL PRIMARY KEY" },
    { name: "session_id", type: "INTEGER REFERENCES driver_sessions(id)" },
    { name: "shipment_id", type: "INTEGER REFERENCES shipments(id)" },
    { name: "driver_id", type: "INTEGER REFERENCES drivers(id)" },
    { name: "trip_id", type: "INTEGER REFERENCES trips(id)" },
    { name: "delivery_type", type: "TEXT" },
    { name: "status", type: "TEXT DEFAULT 'pending'" },
    { name: "original_payment_status", type: "TEXT" },
    { name: "driver_fee", type: "DECIMAL(10,2)" },
    { name: "completed_date", type: "DATE" },
    { name: "notes", type: "TEXT" },
    { name: "created_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
  ],
  debts: [
    { name: "id", type: "SERIAL PRIMARY KEY" },
    { name: "customer_name", type: "TEXT NOT NULL" },
    { name: "customer_phone", type: "TEXT" },
    { name: "amount", type: "DECIMAL(10,2) NOT NULL" },
    { name: "debt_type", type: "TEXT" },
    { name: "paid_amount", type: "DECIMAL(10,2) DEFAULT 0" },
    { name: "remaining_amount", type: "DECIMAL(10,2)" },
    { name: "status", type: "TEXT DEFAULT 'pending'" },
    { name: "notes", type: "TEXT" },
    { name: "created_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
    { name: "updated_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
    { name: "deleted_at", type: "TIMESTAMPTZ" },
  ],
  additional_revenues: [
    { name: "id", type: "SERIAL PRIMARY KEY" },
    { name: "title", type: "TEXT" },
    { name: "description", type: "TEXT NOT NULL" },
    { name: "amount", type: "DECIMAL(10,2) NOT NULL" },
    { name: "date", type: "DATE DEFAULT CURRENT_DATE" },
    { name: "revenue_date", type: "DATE DEFAULT CURRENT_DATE" },
    { name: "category", type: "TEXT" },
    { name: "notes", type: "TEXT" },
    { name: "created_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
    { name: "updated_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
    { name: "deleted_at", type: "TIMESTAMPTZ" },
  ],
}

async function auditAndFix() {
  console.log("🔍 Starting database audit...")

  for (const [tableName, columns] of Object.entries(expectedSchema)) {
    console.log(`\n📋 Checking table: ${tableName}`)

    // Get current table columns
    const currentColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = ${tableName} AND table_schema = 'public'
    `

    const existingColumnNames = currentColumns.map((col: any) => col.column_name)

    // Check each expected column
    for (const col of columns) {
      if (!existingColumnNames.includes(col.name)) {
        console.log(`   ⚠️  Missing column: ${col.name}`)
        console.log(`   ➕ Adding column: ${col.name} ${col.type}`)

        try {
          await sql.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`)
          console.log(`   ✅ Successfully added ${col.name}`)
        } catch (error) {
          console.error(`   ❌ Failed to add ${col.name}:`, error)
        }
      } else {
        console.log(`   ✓  Column exists: ${col.name}`)
      }
    }
  }

  console.log("\n✨ Database audit complete!")
}

auditAndFix()
  .then(() => {
    console.log("\n🎉 All done!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Error during audit:", error)
    process.exit(1)
  })
