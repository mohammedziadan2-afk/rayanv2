"use server"

import { sql } from "@/lib/neon/server"
import { validateCSRFTokenFromRequest, createCSRFError } from "@/lib/csrf-server"
import { sanitizeString, sanitizeNumber } from "@/lib/input-sanitizer"

export interface Expense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface DriverSessionExpense {
  id: string
  driver_name: string // اسم السائق
  session_number: number
  session_date: string
  total_driver_fee_included: number // أجرة السائق للشحنات شامل التوصيل فقط
}

export async function getExpenses() {
  try {
    const expenses = await sql`
      SELECT 
        id,
        category,
        description,
        amount,
        expense_date as date,
        created_at,
        updated_at,
        deleted_at
      FROM expenses 
      WHERE deleted_at IS NULL 
      ORDER BY expense_date DESC, created_at DESC
    `
    return expenses as Expense[]
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return []
  }
}

export async function getExpensesForBudget(startDate?: string, endDate?: string) {
  try {
    let expenses

    if (startDate && endDate) {
      expenses = await sql`
        SELECT 
          id,
          category,
          description,
          amount,
          expense_date as date,
          created_at,
          updated_at,
          deleted_at
        FROM expenses 
        WHERE deleted_at IS NULL 
        AND expense_date >= ${startDate}
        AND expense_date <= ${endDate}
        ORDER BY expense_date DESC
      `
    } else if (startDate) {
      expenses = await sql`
        SELECT 
          id,
          category,
          description,
          amount,
          expense_date as date,
          created_at,
          updated_at,
          deleted_at
        FROM expenses 
        WHERE deleted_at IS NULL 
        AND expense_date >= ${startDate}
        ORDER BY expense_date DESC
      `
    } else if (endDate) {
      expenses = await sql`
        SELECT 
          id,
          category,
          description,
          amount,
          expense_date as date,
          created_at,
          updated_at,
          deleted_at
        FROM expenses 
        WHERE deleted_at IS NULL 
        AND expense_date <= ${endDate}
        ORDER BY expense_date DESC
      `
    } else {
      expenses = await sql`
        SELECT 
          id,
          category,
          description,
          amount,
          expense_date as date,
          created_at,
          updated_at,
          deleted_at
        FROM expenses 
        WHERE deleted_at IS NULL 
        ORDER BY expense_date DESC
      `
    }

    return expenses as Expense[]
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return []
  }
}

export async function getDriverSessionExpenses(): Promise<DriverSessionExpense[]> {
  try {
    const sessions = await sql`
      SELECT 
        ds.id,
        d.name as driver_name,
        ds.session_date,
        ds.session_number,
        COALESCE(
          (SELECT SUM(driver_fee)
           FROM driver_tasks dt
           WHERE dt.session_id = ds.id
           AND dt.status = 'delivered'), 0
        ) as total_driver_fee_included
      FROM driver_sessions ds
      INNER JOIN drivers d ON d.id = ds.driver_id
      WHERE ds.is_approved = true
      ORDER BY ds.session_date DESC
    `

    return sessions
      .filter((s: any) => s.total_driver_fee_included > 0)
      .map((s: any) => ({
        id: s.id.toString(),
        driver_name: s.driver_name,
        session_number: Number(s.session_number) || 0,
        session_date: s.session_date,
        total_driver_fee_included: Number(s.total_driver_fee_included),
      }))
  } catch (error) {
    console.error("Error fetching driver sessions:", error)
    return []
  }
}

export async function getDriverSessionExpensesForBudget(
  startDate?: string,
  endDate?: string,
): Promise<DriverSessionExpense[]> {
  try {
    let sessions

    if (startDate && endDate) {
      sessions = await sql`
        SELECT 
          ds.id,
          d.name as driver_name,
          ds.session_date,
          ds.session_number,
          COALESCE(
            (SELECT SUM(driver_fee)
             FROM driver_tasks dt
             WHERE dt.session_id = ds.id
             AND dt.status = 'delivered'), 0
          ) as total_driver_fee_included
        FROM driver_sessions ds
        INNER JOIN drivers d ON d.id = ds.driver_id
        WHERE ds.is_approved = true
        AND ds.session_date >= ${startDate}::date
        AND ds.session_date <= ${endDate}::date
        ORDER BY ds.session_date DESC
      `
    } else {
      sessions = await sql`
        SELECT 
          ds.id,
          d.name as driver_name,
          ds.session_date,
          ds.session_number,
          COALESCE(
            (SELECT SUM(driver_fee)
             FROM driver_tasks dt
             WHERE dt.session_id = ds.id
             AND dt.status = 'delivered'), 0
          ) as total_driver_fee_included
        FROM driver_sessions ds
        INNER JOIN drivers d ON d.id = ds.driver_id
        WHERE ds.is_approved = true
        ORDER BY ds.session_date DESC
      `
    }

    return sessions
      .filter((s: any) => s.total_driver_fee_included > 0)
      .map((s: any) => ({
        id: s.id.toString(),
        driver_name: s.driver_name,
        session_number: Number(s.session_number) || 0,
        session_date: s.session_date,
        total_driver_fee_included: Number(s.total_driver_fee_included),
      }))
  } catch (error) {
    console.error("Error fetching driver sessions:", error)
    return []
  }
}

export async function createExpense(expense: Omit<Expense, "id" | "created_at" | "updated_at">, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)

    if (!isCsrfValid) {
      throw createCSRFError()
    }

    // Sanitize inputs
    const sanitizedDescription = sanitizeString(expense.description)
    const sanitizedAmount = sanitizeNumber(expense.amount)
    const sanitizedCategory = sanitizeString(expense.category)

    const [newExpense] = await sql`
      INSERT INTO expenses (description, amount, category, expense_date)
      VALUES (${sanitizedDescription}, ${sanitizedAmount}, ${sanitizedCategory}, ${expense.date || new Date().toISOString().split("T")[0]})
      RETURNING *
    `

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("expensesUpdated"))
    }

    return { success: true, data: newExpense as Expense }
  } catch (error: any) {
    console.error("[v0] Error creating expense:", error)
    if (error.message?.includes("CSRF") || error.message?.includes("رمز الحماية")) {
      return { success: false, error: "رمز الحماية غير صحيح. الرجاء إعادة تحميل الصفحة والمحاولة مرة أخرى." }
    }
    return { success: false, error: error.message }
  }
}

export async function updateExpense(id: string, updates: Partial<Expense>, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }

    // Sanitize inputs
    const sanitizedDescription = updates.description ? sanitizeString(updates.description) : null
    const sanitizedAmount = updates.amount !== undefined ? sanitizeNumber(updates.amount) : null
    const sanitizedCategory = updates.category ? sanitizeString(updates.category) : null

    const [updatedExpense] = await sql`
      UPDATE expenses 
      SET 
        description = COALESCE(${sanitizedDescription}, description),
        amount = COALESCE(${sanitizedAmount}, amount),
        category = COALESCE(${sanitizedCategory}, category),
        expense_date = COALESCE(${updates.date}, expense_date),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("expensesUpdated"))
    }

    return { success: true, data: updatedExpense as Expense }
  } catch (error: any) {
    console.error("Error updating expense:", error)
    if (error.message?.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: error.message }
  }
}

export async function deleteExpense(id: string, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }

    const sanitizedId = sanitizeString(id)

    await sql`
      UPDATE expenses 
      SET deleted_at = NOW()
      WHERE id = ${sanitizedId}
    `

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("expensesUpdated"))
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting expense:", error)
    if (error.message?.includes("CSRF")) {
      return { success: false, error: "رمز الحماية غير صحيح. الرجاء إعادة تحميل الصفحة والمحاولة مرة أخرى." }
    }
    return { success: false, error: error.message }
  }
}

export const getAllExpenses = getExpenses
