import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL)

async function fixSessionShipmentsTracking() {
  try {
    const now = new Date().toISOString()

    // Find all shipments that are in driver_tasks (assigned to sessions) 
    // but have tracking_stage less than 4
    const result = await sql`
      UPDATE shipments s
      SET current_tracking_stage = 4, stage_4_entered_at = ${now}
      WHERE s.id IN (
        SELECT DISTINCT dt.shipment_id 
        FROM driver_tasks dt 
        WHERE dt.session_id IS NOT NULL 
          AND dt.shipment_id IS NOT NULL
          AND dt.task_type IS DISTINCT FROM 'cash_receipt'
      )
      AND (s.current_tracking_stage IS NULL OR s.current_tracking_stage < 4)
      RETURNING s.id, s.tracking_number
    `

    console.log(`Updated ${result.length} shipments to tracking stage 4:`)
    for (const row of result) {
      console.log(`  - Shipment ${row.tracking_number} (ID: ${row.id})`)

      // Add tracking history for each updated shipment
      await sql`
        INSERT INTO shipment_tracking_history (shipment_id, status, stage, stage_name, entered_at)
        VALUES (${row.id}, 'in_transit', 4, 'وصول الطلب للمركز والتوزيع', ${now})
        ON CONFLICT DO NOTHING
      `
    }

    console.log("Done!")
  } catch (error) {
    console.error("Error:", error)
  }
}

fixSessionShipmentsTracking()
