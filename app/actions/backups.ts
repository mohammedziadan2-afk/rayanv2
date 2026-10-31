"use server"

import { sql } from "@/lib/neon/server"
import { revalidatePath } from "next/cache"

export interface Backup {
  id: string
  name: string
  date: string
  size: string
  data: {
    shipments: any[]
    expenses: any[]
    shippingRequests: any[]
    warehouse: any[]
    trips: any[]
  }
  created_at?: string
  updated_at?: string
}

export async function getBackups(): Promise<Backup[]> {
  try {
    const data = await sql`
      SELECT 
        id::text, 
        backup_name as name, 
        created_at as date, 
        backup_size as size,
        '{}'::jsonb as data
      FROM backups 
      ORDER BY created_at DESC
    `

    return data || []
  } catch (error) {
    console.error("Error fetching backups:", error)
    return []
  }
}

export async function createBackup(): Promise<{ success: boolean; backup?: Backup; error?: string }> {
  try {
    const [shipments, expenses, requests, warehouse, trips] = await Promise.all([
      sql`SELECT * FROM shipments WHERE deleted_at IS NULL`,
      sql`SELECT * FROM expenses WHERE deleted_at IS NULL`,
      sql`SELECT * FROM shipping_requests`,
      sql`SELECT * FROM warehouse_inventory`,
      sql`SELECT * FROM trips WHERE deleted_at IS NULL`,
    ])

    const backupData = {
      shipments: shipments || [],
      expenses: expenses || [],
      shippingRequests: requests || [],
      warehouse: warehouse || [],
      trips: trips || [],
    }

    const backupSize = `${(JSON.stringify(backupData).length / 1024).toFixed(2)} KB`
    const backupName = `نسخة احتياطية ${new Date().toLocaleDateString("ar-SA")}`

    const result = await sql`
      INSERT INTO backups (backup_name, backup_size, status, created_at)
      VALUES (${backupName}, ${backupSize}, 'completed', NOW())
      RETURNING id::text, backup_name as name, created_at as date, backup_size as size
    `

    revalidatePath("/settings")
    return {
      success: true,
      backup: {
        ...result[0],
        data: backupData,
      },
    }
  } catch (error: any) {
    console.error("Error creating backup:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      DELETE FROM backups 
      WHERE id = ${backupId}
    `

    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting backup:", error)
    return { success: false, error: error.message }
  }
}

export async function restoreBackup(backup: Backup): Promise<{ success: boolean; error?: string }> {
  try {
    if (backup.data.shipments && backup.data.shipments.length > 0) {
      await sql`DELETE FROM shipments`
      for (const shipment of backup.data.shipments) {
        await sql`
          INSERT INTO shipments (tracking_number, sender_name, receiver_name, receiver_phone, receiver_address, shipment_type, price, created_at)
          VALUES (${shipment.tracking_number}, ${shipment.sender_name}, ${shipment.receiver_name}, ${shipment.receiver_phone}, ${shipment.receiver_address}, ${shipment.shipment_type}, ${shipment.price}, ${shipment.created_at})
        `
      }
    }

    // Similar for other tables...

    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Error restoring backup:", error)
    return { success: false, error: error.message }
  }
}
