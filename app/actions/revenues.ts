"use server"

import { sql } from "@/lib/neon/server"
import { revalidatePath } from "next/cache"
import { validateCSRFTokenFromRequest, createCSRFError } from "@/lib/csrf-server"
import { sanitizeString, sanitizeNumber } from "@/lib/input-sanitizer"

export interface AdditionalRevenue {
  id: number
  title: string
  description?: string
  amount: number
  date: string
  category: string
  created_at: string
  updated_at: string
}

export async function getAdditionalRevenues() {
  try {
    const result = await sql`
      SELECT 
        id, 
        title, 
        description, 
        amount, 
        date, 
        category, 
        created_at, 
        updated_at
      FROM additional_revenues
      ORDER BY date DESC
    `

    return {
      success: true,
      data: result.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        amount: Number(row.amount),
        date: row.date,
        category: row.category,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })) as AdditionalRevenue[],
    }
  } catch (error) {
    console.error("Error fetching additional revenues:", error)
    return { success: false, data: [], error: String(error) }
  }
}

export async function getAdditionalRevenuesForBudget(startDate?: string, endDate?: string) {
  try {
    let query
    if (startDate && endDate) {
      query = sql`
        SELECT 
          id, 
          title, 
          description, 
          amount, 
          date, 
          category, 
          created_at, 
          updated_at
        FROM additional_revenues
        WHERE date >= ${startDate} AND date <= ${endDate}
        ORDER BY date DESC
      `
    } else {
      query = sql`
        SELECT 
          id, 
          title, 
          description, 
          amount, 
          date, 
          category, 
          created_at, 
          updated_at
        FROM additional_revenues
        ORDER BY date DESC
      `
    }

    const result = await query

    return {
      success: true,
      data: result.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        amount: Number(row.amount),
        date: row.date,
        category: row.category,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })) as AdditionalRevenue[],
    }
  } catch (error) {
    console.error("Error fetching additional revenues:", error)
    return { success: false, data: [], error: String(error) }
  }
}

export async function addAdditionalRevenue(
  revenue: {
    title: string
    description?: string
    amount: number
    date: string
    category: string
  },
  csrfToken?: string,
) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeString(revenue.title)
    const sanitizedDescription = revenue.description ? sanitizeString(revenue.description) : ""
    const sanitizedAmount = sanitizeNumber(revenue.amount)
    const sanitizedCategory = sanitizeString(revenue.category)

    await sql`
      INSERT INTO additional_revenues (title, description, amount, date, category)
      VALUES (${sanitizedTitle}, ${sanitizedDescription}, ${sanitizedAmount}, ${revenue.date}, ${sanitizedCategory})
    `

    revalidatePath("/budget")
    return { success: true }
  } catch (error) {
    console.error("Error adding additional revenue:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: String(error) }
  }
}

export async function updateAdditionalRevenue(
  id: string,
  revenue: {
    title: string
    description?: string
    amount: number
    date: string
    category: string
  },
  csrfToken?: string,
) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }

    // Sanitize inputs
    const sanitizedId = sanitizeString(id)
    const sanitizedTitle = sanitizeString(revenue.title)
    const sanitizedDescription = revenue.description ? sanitizeString(revenue.description) : ""
    const sanitizedAmount = sanitizeNumber(revenue.amount)
    const sanitizedCategory = sanitizeString(revenue.category)

    await sql`
      UPDATE additional_revenues
      SET 
        title = ${sanitizedTitle},
        description = ${sanitizedDescription},
        amount = ${sanitizedAmount},
        date = ${revenue.date},
        category = ${sanitizedCategory},
        updated_at = NOW()
      WHERE id = ${sanitizedId}
    `

    revalidatePath("/budget")
    return { success: true }
  } catch (error) {
    console.error("Error updating additional revenue:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: String(error) }
  }
}

export async function deleteAdditionalRevenue(id: string, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }

    const sanitizedId = sanitizeString(id)

    await sql`
      DELETE FROM additional_revenues
      WHERE id = ${sanitizedId}
    `

    revalidatePath("/budget")
    return { success: true }
  } catch (error) {
    console.error("Error deleting additional revenue:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: String(error) }
  }
}
