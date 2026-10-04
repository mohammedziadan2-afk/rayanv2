"use server"

import { sql } from "@/lib/neon/server"
import { revalidatePath } from "next/cache"

export interface CompanyInfo {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
}

export async function getCompanyInfo() {
  try {
    const result = await sql`
      SELECT * FROM company_info LIMIT 1
    `

    return (result[0] as CompanyInfo) || null
  } catch (error) {
    console.error("Error fetching company info:", error)
    return null
  }
}

export async function updateCompanyInfo(info: Partial<CompanyInfo>) {
  try {
    // Check if company info exists
    const existing = await sql`
      SELECT id FROM company_info LIMIT 1
    `

    if (existing.length > 0) {
      // Update existing record
      const updates: string[] = []
      const values: any[] = []
      let paramIndex = 1

      if (info.name !== undefined) {
        updates.push(`name = $${paramIndex++}`)
        values.push(info.name)
      }
      if (info.address !== undefined) {
        updates.push(`address = $${paramIndex++}`)
        values.push(info.address)
      }
      if (info.phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`)
        values.push(info.phone)
      }
      if (info.email !== undefined) {
        updates.push(`email = $${paramIndex++}`)
        values.push(info.email)
      }
      if (info.logo_url !== undefined) {
        updates.push(`logo_url = $${paramIndex++}`)
        values.push(info.logo_url)
      }

      updates.push(`updated_at = NOW()`)
      values.push(existing[0].id)

      const result = await sql.query(
        `UPDATE company_info SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
        values,
      )

      revalidatePath("/settings")
      return result.rows[0] as CompanyInfo
    } else {
      // Create new record
      const result = await sql`
        INSERT INTO company_info (name, address, phone, email, logo_url)
        VALUES (${info.name || ""}, ${info.address || null}, ${info.phone || null}, ${info.email || null}, ${info.logo_url || null})
        RETURNING *
      `

      revalidatePath("/settings")
      return result[0] as CompanyInfo
    }
  } catch (error) {
    console.error("Error updating company info:", error)
    throw new Error("Failed to update company info")
  }
}
