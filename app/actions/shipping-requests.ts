"use server"

import { sql } from "@/lib/db"

export interface ShippingRequest {
  id: number
  request_number: string | null
  customer_name: string
  customer_phone: string | null
  pickup_address: string
  delivery_address: string
  package_description: string | null
  status: string
  created_at: string
  is_read: boolean
}

export async function getAllShippingRequests(): Promise<ShippingRequest[]> {
  try {
    const requests = await sql`
      SELECT 
        id,
        request_number,
        customer_name,
        customer_phone,
        pickup_address,
        delivery_address,
        package_description,
        status,
        created_at,
        COALESCE(is_read, false) as is_read
      FROM shipping_requests
      ORDER BY created_at DESC
    `

    return requests as ShippingRequest[]
  } catch (error: any) {
    return []
  }
}

export async function getShippingRequestByNumber(requestNumber: string): Promise<ShippingRequest | null> {
  try {
    const requests = await sql`
      SELECT 
        id,
        request_number,
        customer_name,
        customer_phone,
        pickup_address,
        delivery_address,
        package_description,
        status,
        created_at,
        COALESCE(is_read, false) as is_read
      FROM shipping_requests
      WHERE request_number = ${requestNumber}
      LIMIT 1
    `

    if (requests.length === 0) {
      return null
    }

    return requests[0] as ShippingRequest
  } catch (error: any) {
    return null
  }
}

export async function getShippingRequests() {
  try {
    const requests = await sql`
      SELECT 
        id,
        request_number,
        customer_name,
        customer_phone,
        pickup_address,
        delivery_address,
        package_description,
        status,
        created_at,
        COALESCE(is_read, false) as is_read
      FROM shipping_requests
      ORDER BY created_at DESC
    `

    return { success: true, data: requests }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getUnreadRequestsCount(): Promise<number> {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM shipping_requests
      WHERE is_read = false
    `
    return Number(result[0]?.count || 0)
  } catch (error) {
    return 0
  }
}

export async function markRequestsAsRead(): Promise<{ success: boolean }> {
  try {
    await sql`
      UPDATE shipping_requests
      SET is_read = true
      WHERE is_read = false
    `
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function updateShippingRequestStatus(id: number, status: string) {
  try {
    await sql`
      UPDATE shipping_requests
      SET status = ${status}
      WHERE id = ${id}
    `

    return { success: true, message: "تم تحديث الحالة بنجاح" }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteShippingRequest(id: number) {
  try {
    await sql`
      DELETE FROM shipping_requests
      WHERE id = ${id}
    `

    return { success: true, message: "تم حذف الطلب بنجاح" }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
