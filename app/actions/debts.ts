"use server"

import { sql } from "@/lib/neon/server"
import { revalidatePath } from "next/cache"

export interface DebtData {
  id: string
  shipmentId: string | null
  trackingNumber: string
  receiverName: string
  receiverPhone: string
  amount: number
  debtType: "receivable" | "payable"
  status: "pending" | "paid" | "partial"
  paidAmount: number
  remainingAmount: number
  notes?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
}

export async function createDebt(debt: Omit<DebtData, "id" | "createdAt" | "updatedAt">) {
  try {
    const result = await sql`
      INSERT INTO debts (
        customer_name, customer_phone,
        amount, debt_type, status, paid_amount, remaining_amount,
        notes
      )
      VALUES (
        ${debt.receiverName}, ${debt.receiverPhone},
        ${debt.amount}, ${debt.debtType}, ${debt.status}, ${debt.paidAmount}, ${debt.remainingAmount},
        ${debt.notes || null}
      )
      RETURNING *
    `

    revalidatePath("/debts")

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("debtsUpdated"))
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[v0] Error creating debt:", error)
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function getDebts() {
  try {
    const data = await sql`
      SELECT * FROM debts ORDER BY created_at DESC
    `

    const transformedData = data.map((debt: any) => ({
      id: debt.id,
      shipmentId: debt.shipment_id,
      trackingNumber: debt.tracking_number,
      receiverName: debt.customer_name,
      receiverPhone: debt.customer_phone,
      amount: debt.amount,
      debtType: debt.debt_type,
      status: debt.status,
      paidAmount: debt.paid_amount,
      remainingAmount: debt.remaining_amount,
      notes: debt.notes,
      dueDate: debt.due_date,
      createdAt: debt.created_at,
      updatedAt: debt.updated_at,
      paidAt: debt.paid_at,
    }))

    return { success: true, data: transformedData }
  } catch (error) {
    return { success: false, error: "حدث خطأ غير متوقع", data: [] }
  }
}

export async function payDebt(id: string, paymentAmount: number) {
  try {
    // Get current debt
    const currentDebt = await sql`
      SELECT * FROM debts WHERE id = ${id}
    `

    if (currentDebt.length === 0) {
      return { success: false, error: "الذمة غير موجودة" }
    }

    const debt = currentDebt[0]
    const newPaidAmount = Number(debt.paid_amount) + paymentAmount
    const newRemainingAmount = Number(debt.amount) - newPaidAmount
    const newStatus = newRemainingAmount <= 0 ? "paid" : newPaidAmount > 0 ? "partial" : "pending"

    await sql`
      UPDATE debts
      SET 
        paid_amount = ${newPaidAmount},
        remaining_amount = ${newRemainingAmount},
        status = ${newStatus},
        paid_at = ${newStatus === "paid" ? new Date().toISOString() : debt.paid_at},
        updated_at = NOW()
      WHERE id = ${id}
    `

    revalidatePath("/debts")

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("debtsUpdated"))
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error paying debt:", error)
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function deleteDebt(id: string) {
  try {
    await sql`DELETE FROM debts WHERE id = ${id}`

    revalidatePath("/debts")

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("debtsUpdated"))
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting debt:", error)
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function updateDebt(id: string, updates: Partial<Omit<DebtData, "id" | "createdAt">>) {
  try {
    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`)
      values.push(updates.notes)
    }
    if (updates.debtType !== undefined) {
      updateFields.push(`debt_type = $${paramIndex++}`)
      values.push(updates.debtType)
    }
    if (updates.amount !== undefined) {
      const currentDebt = await sql`SELECT paid_amount FROM debts WHERE id = ${id}`
      if (currentDebt.length > 0) {
        const remainingAmount = updates.amount - Number(currentDebt[0].paid_amount)
        updateFields.push(`amount = $${paramIndex++}`)
        values.push(updates.amount)
        updateFields.push(`remaining_amount = $${paramIndex++}`)
        values.push(remainingAmount)
      }
    }

    updateFields.push(`updated_at = NOW()`)
    values.push(id)

    await sql.query(`UPDATE debts SET ${updateFields.join(", ")} WHERE id = $${paramIndex}`, values)

    revalidatePath("/debts")

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("debtsUpdated"))
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating debt:", error)
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function getShipmentByTrackingNumber(trackingNumber: string) {
  try {
    const data = await sql`
      SELECT id, tracking_number, sender_name, description, amount
      FROM shipments
      WHERE tracking_number = ${trackingNumber}
      LIMIT 1
    `

    if (data.length === 0) {
      return { success: false, error: "الشحنة غير موجودة" }
    }

    return {
      success: true,
      data: {
        id: data[0].id,
        trackingNumber: data[0].tracking_number,
        senderName: data[0].sender_name,
        description: data[0].description,
        amount: data[0].amount,
      },
    }
  } catch (error) {
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}
