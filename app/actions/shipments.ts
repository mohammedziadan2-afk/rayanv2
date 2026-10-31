"use server"

import { sql } from "@/lib/neon/server"
import { revalidatePath } from "next/cache"
import type { PaginationParams, PaginationResult } from "@/lib/pagination"
import { validatePaginationParams, calculatePagination, getPageRange } from "@/lib/pagination"
import { validateCSRFTokenFromRequest, createCSRFError } from "@/lib/csrf-server"
import { sanitizeString, sanitizeNumber } from "@/lib/input-sanitizer"

export interface ShipmentData {
  id: string
  trackingNumber: string
  senderName: string
  senderIdNumber?: string
  senderPhone: string
  senderAddress: string
  senderCountry: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  receiverCountry: string
  description: string
  totalAmount: number
  deposit: number
  amount: number
  weight: number
  receivedDate: string
  status: string
  paymentStatus: string
  createdAt: string
  deletedAt?: string | null
  notes?: string
  currentTrackingStage?: number
  collectionMethod?: string
  shipmentType?: string
}

export async function createShipment(shipment: Omit<ShipmentData, "createdAt" | "id">, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      console.error("[v0] CSRF validation failed for shipment creation")
      throw createCSRFError()
    }

    const totalAmount = shipment.totalAmount || shipment.amount || 0
    const deposit = shipment.deposit || 0
    const remainingAmount = totalAmount - deposit

    const result = await sql`
      INSERT INTO shipments (
        tracking_number, sender_name, sender_id_number, sender_phone, sender_address, sender_country,
        receiver_name, receiver_phone, receiver_address, receiver_country, description,
        total_amount, deposit, price, weight, received_date, status, payment_status, collection_method,
        notes, current_tracking_stage
      ) VALUES (
        ${shipment.trackingNumber}, ${shipment.senderName}, ${shipment.senderIdNumber || null}, 
        ${shipment.senderPhone}, ${shipment.senderAddress}, ${shipment.senderCountry},
        ${shipment.receiverName}, ${shipment.receiverPhone}, ${shipment.receiverAddress}, 
        ${shipment.receiverCountry}, ${shipment.description},
        ${totalAmount}, ${deposit}, ${remainingAmount}, ${shipment.weight}, ${shipment.receivedDate}, ${shipment.status},
        ${shipment.paymentStatus}, ${shipment.collectionMethod || "driver"},
        ${shipment.notes || null}, 1
      )
      RETURNING *
    `

    const data = result[0]

    // إضافة سجل في جدول التتبع
    await sql`
      INSERT INTO shipment_tracking_history (shipment_id, status, location, notes, created_at)
      VALUES (${data.id}, 'استلام الطلب', 'المركز الرئيسي', 'تم استلام الطلب', NOW())
    `

    revalidatePath("/invoices")
    revalidatePath("/")

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error creating shipment:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function getShipmentsPaginated(params: PaginationParams = {}): Promise<PaginationResult<any>> {
  try {
    const { page, pageSize } = validatePaginationParams(params)
    const { from, to } = getPageRange(page, pageSize)

    const countResult = await sql`
      SELECT COUNT(*) as count FROM shipments WHERE deleted_at IS NULL
    `
    const totalCount = Number(countResult[0]?.count || 0)

    const data = await sql`
      SELECT id, tracking_number, sender_name, receiver_name, receiver_phone, 
             delivery_status, payment_status, price as amount, created_at
      FROM shipments
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${from}
    `

    const transformedData = (data || []).map((shipment: any) => ({
      id: shipment.id,
      trackingNumber: shipment.tracking_number,
      senderName: shipment.sender_name,
      receiverName: shipment.receiver_name,
      receiverPhone: shipment.receiver_phone,
      status: shipment.delivery_status,
      deliveryStatus: shipment.delivery_status,
      delivery_status: shipment.delivery_status,
      paymentStatus: shipment.payment_status,
      amount: shipment.amount,
      createdAt: shipment.created_at,
    }))

    return {
      data: transformedData,
      pagination: calculatePagination(page, pageSize, totalCount),
    }
  } catch (error) {
    console.error("Error fetching shipments:", error)
    return {
      data: [],
      pagination: calculatePagination(1, 50, 0),
    }
  }
}

export async function getShipments() {
  try {
    // Get shipments with driver session info using LEFT JOIN
    // Active sessions are those that are NOT approved yet (is_approved = false)
    const data = await sql`
      SELECT s.id, s.tracking_number, s.sender_name, s.sender_phone, s.sender_address, s.sender_country,
             s.receiver_name, s.receiver_phone, s.receiver_address, s.receiver_country,
             s.description, s.shipment_type, s.delivery_status, s.payment_status, 
             s.total_amount, s.deposit, s.price as amount, 
             s.weight, s.received_date, s.notes,
             s.collection_method, s.created_at,
             CASE WHEN dt.id IS NOT NULL AND ds.is_approved = false THEN true ELSE false END as is_in_driver_session,
             d.name as driver_name
      FROM shipments s
      LEFT JOIN driver_tasks dt ON dt.shipment_id = s.id
      LEFT JOIN driver_sessions ds ON ds.id = dt.session_id AND ds.is_approved = false
      LEFT JOIN drivers d ON d.id = ds.driver_id
      WHERE s.deleted_at IS NULL
      ORDER BY s.created_at DESC
    `

    const transformedData = (data || []).map((shipment: any) => ({
      id: shipment.id,
      trackingNumber: shipment.tracking_number,
      senderName: shipment.sender_name,
      senderPhone: shipment.sender_phone,
      senderAddress: shipment.sender_address,
      senderCountry: shipment.sender_country,
      receiverName: shipment.receiver_name,
      receiverPhone: shipment.receiver_phone,
      receiverAddress: shipment.receiver_address,
      receiverCountry: shipment.receiver_country,
      description: shipment.description,
      shipmentType: shipment.shipment_type,
      status: shipment.delivery_status,
      deliveryStatus: shipment.delivery_status,
      delivery_status: shipment.delivery_status,
      paymentStatus: shipment.payment_status,
      totalAmount: Number(shipment.total_amount) || 0,
      deposit: Number(shipment.deposit) || 0,
      amount: shipment.amount,
      weight: shipment.weight,
      receivedDate: shipment.received_date,
      notes: shipment.notes,
      collectionMethod: shipment.collection_method,
      createdAt: shipment.created_at,
      isInDriverSession: shipment.is_in_driver_session || false,
      driverName: shipment.driver_name || null,
    }))

    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Error fetching shipments:", error)
    return { success: false, error: "حدث خطأ غير متوقع", data: [] }
  }
}

export async function getPendingShipments() {
  try {
    // Get all shipment IDs that are already assigned to non-deleted trips
    const tripsWithShipments = await sql`
      SELECT UNNEST(shipment_ids) as shipment_id
      FROM trips
      WHERE deleted_at IS NULL AND shipment_ids IS NOT NULL
    `
    const assignedShipmentIds = tripsWithShipments.map((row: any) => Number(row.shipment_id))
    
    // Get pending shipments that are NOT assigned to any trip
    const data = await sql`
      SELECT id, tracking_number, sender_name, receiver_name, receiver_phone, receiver_address,
             description, shipment_type, delivery_status, payment_status, price as amount, created_at
      FROM shipments
      WHERE deleted_at IS NULL 
        AND delivery_status = 'pending'
        AND (${assignedShipmentIds.length === 0} OR id != ALL(${assignedShipmentIds}))
      ORDER BY created_at DESC
      LIMIT 100
    `

    const transformedData = (data || []).map((shipment: any) => ({
      id: shipment.id,
      trackingNumber: shipment.tracking_number,
      senderName: shipment.sender_name,
      receiverName: shipment.receiver_name,
      receiverPhone: shipment.receiver_phone,
      receiverAddress: shipment.receiver_address,
      description: shipment.description,
      shipmentType: shipment.shipment_type,
      status: shipment.delivery_status,
      deliveryStatus: shipment.delivery_status,
      delivery_status: shipment.delivery_status,
      paymentStatus: shipment.payment_status,
      amount: shipment.amount,
      createdAt: shipment.created_at,
    }))

    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Error fetching pending shipments:", error)
    return { success: false, error: "حدث خطأ غير متوقع", data: [] }
  }
}

export async function getPendingShipmentsCount() {
  try {
    const data = await sql`
      SELECT COUNT(*) as count
      FROM shipments
      WHERE deleted_at IS NULL AND delivery_status = 'pending'
    `
    return { success: true, count: Number(data[0]?.count || 0) }
  } catch (error) {
    console.error("Error fetching pending shipments count:", error)
    return { success: false, count: 0 }
  }
}

export async function getShipmentById(id: string) {
  try {
    const result = await sql`
      SELECT * FROM shipments WHERE id = ${id} AND deleted_at IS NULL
    `

    if (result.length === 0) {
      return { success: false, error: "الشحنة غير موجودة", data: null }
    }

    const data = result[0]
    const transformedData = {
      id: data.id,
      trackingNumber: data.tracking_number,
      senderName: data.sender_name,
      senderIdNumber: data.sender_id_number,
      senderPhone: data.sender_phone,
      senderAddress: data.sender_address,
      senderCountry: data.sender_country,
      receiverName: data.receiver_name,
      receiverPhone: data.receiver_phone,
      receiverAddress: data.receiver_address,
      receiverCountry: data.receiver_country,
      description: data.description,
      shipmentType: data.shipment_type,
      status: data.delivery_status,
      deliveryStatus: data.delivery_status,
      delivery_status: data.delivery_status,
      paymentStatus: data.payment_status,
      totalAmount: Number(data.total_amount) || 0,
      total_amount: Number(data.total_amount) || 0,
      deposit: Number(data.deposit) || 0,
      amount: data.price,
      price: data.price,
      weight: data.weight,
      receivedDate: data.received_date,
      createdAt: data.created_at,
      deletedAt: data.deleted_at,
      notes: data.notes,
      currentTrackingStage: data.current_tracking_stage,
      collectionMethod: data.collection_method,
      receiver_signature: data.receiver_signature || null,
    }

    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Error fetching shipment:", error)
    return { success: false, error: "حدث خطأ غير متوقع", data: null }
  }
}

export async function getShipmentByTrackingNumber(trackingNumber: string) {
  try {
    const result = await sql`
      SELECT * FROM shipments 
      WHERE tracking_number = ${trackingNumber} AND deleted_at IS NULL
    `

    if (result.length === 0) {
      return { success: false, error: "الشحنة غير موجودة", data: null }
    }

    const data = result[0]
    const transformedData = {
      id: data.id,
      trackingNumber: data.tracking_number,
      senderName: data.sender_name,
      senderIdNumber: data.sender_id_number,
      senderPhone: data.sender_phone,
      senderAddress: data.sender_address,
      senderCountry: data.sender_country,
      receiverName: data.receiver_name,
      receiverPhone: data.receiver_phone,
      receiverAddress: data.receiver_address,
      receiverCountry: data.receiver_country,
      description: data.description,
      shipmentType: data.shipment_type,
      status: data.delivery_status,
      deliveryStatus: data.delivery_status,
      delivery_status: data.delivery_status,
      paymentStatus: data.payment_status,
      totalAmount: Number(data.total_amount) || 0,
      total_amount: Number(data.total_amount) || 0,
      deposit: Number(data.deposit) || 0,
      amount: data.price,
      price: data.price,
      weight: data.weight,
      receivedDate: data.received_date,
      createdAt: data.created_at,
      deletedAt: data.deleted_at,
      notes: data.notes,
      currentTrackingStage: data.current_tracking_stage,
      collectionMethod: data.collection_method,
      receiver_signature: data.receiver_signature || null,
    }

    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Error fetching shipment:", error)
    return { success: false, error: "حدث خطأ غير متوقع", data: null }
  }
}

export async function restoreShipment(id: string, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }

    const sanitizedId = sanitizeString(id)

    await sql`
      UPDATE shipments SET deleted_at = NULL WHERE id = ${sanitizedId}
    `

    revalidatePath("/invoices")
    revalidatePath("/")
    revalidatePath("/trash")

    return { success: true }
  } catch (error) {
    console.error("Error restoring shipment:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function permanentlyDeleteShipment(id: string, csrfToken?: string) {
  try {
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }

    // Now safe to sanitize since we validated the request
    const sanitizedId = sanitizeString(id)

    await sql`DELETE FROM shipment_tracking_history WHERE shipment_id = ${sanitizedId}`
    await sql`DELETE FROM shipments WHERE id = ${sanitizedId}`

    revalidatePath("/invoices")
    revalidatePath("/")
    revalidatePath("/trash")

    return { success: true }
  } catch (error) {
    console.error("Error permanently deleting shipment:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function cleanupOldDeletedShipments() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await sql`
      DELETE FROM shipments 
      WHERE deleted_at IS NOT NULL 
      AND deleted_at < ${thirtyDaysAgo.toISOString()}
      RETURNING id
    `

    revalidatePath("/trash")

    return { success: true, count: result.length }
  } catch (error) {
    console.error("Error cleaning up old shipments:", error)
    return { success: false, error: "حدث خطأ غير متوقع", count: 0 }
  }
}

export async function deleteShipment(id: string, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }

    const sanitizedId = sanitizeString(id)

    const result = await sql`
      SELECT id, tracking_number, deleted_at FROM shipments WHERE id = ${sanitizedId}
    `

    if (result.length === 0) {
      return { success: false, error: "الشحنة غير موجودة" }
    }

    if (result[0].deleted_at) {
      return { success: false, error: "الشحنة محذوفة بالفعل" }
    }

    await sql`
      UPDATE shipments SET deleted_at = NOW() WHERE id = ${sanitizedId}
    `

    revalidatePath("/invoices")
    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath("/trash")

    return { success: true, message: "تم نقل الشحنة إلى سلة المحذوفات بنجاح" }
  } catch (error) {
    console.error("Error deleting shipment:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function getDeletedShipments() {
  try {
    const data = await sql`
      SELECT * FROM shipments 
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `

    const transformedData = data.map((shipment: any) => ({
      id: shipment.id,
      trackingNumber: shipment.tracking_number,
      senderName: shipment.sender_name,
      senderIdNumber: shipment.sender_id_number,
      senderPhone: shipment.sender_phone,
      senderAddress: shipment.sender_address,
      senderCountry: shipment.sender_country,
      receiverName: shipment.receiver_name,
      receiverPhone: shipment.receiver_phone,
      receiverAddress: shipment.receiver_address,
      receiverCity: shipment.receiver_city,
      receiverCountry: shipment.receiver_country,
      description: shipment.description,
      shipmentType: shipment.shipment_type,
      status: shipment.delivery_status,
      deliveryStatus: shipment.delivery_status,
      delivery_status: shipment.delivery_status,
      paymentStatus: shipment.payment_status,
      amount: shipment.price,
      weight: shipment.weight,
      receivedDate: shipment.received_date,
      createdAt: shipment.created_at,
      deletedAt: shipment.deleted_at,
      notes: shipment.notes,
      currentTrackingStage: shipment.current_tracking_stage,
      collectionMethod: shipment.collection_method,
    }))

    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Error fetching deleted shipments:", error)
    return { success: false, error: "حدث خطأ غير متوقع", data: [] }
  }
}

export const getAllShipments = getShipments

export async function updateShipment(
  id: string,
  updates: Partial<Omit<ShipmentData, "id" | "createdAt">>,
  csrfToken?: string,
) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }

    const sanitizedId = sanitizeString(id)
    
    // Direct update with only the fields that were provided
    await sql`
      UPDATE shipments SET
        tracking_number = COALESCE(${updates.trackingNumber ?? null}, tracking_number),
        sender_name = COALESCE(${updates.senderName ?? null}, sender_name),
        sender_id_number = COALESCE(${updates.senderIdNumber ?? null}, sender_id_number),
        sender_phone = COALESCE(${updates.senderPhone ?? null}, sender_phone),
        sender_address = COALESCE(${updates.senderAddress ?? null}, sender_address),
        sender_country = COALESCE(${updates.senderCountry ?? null}, sender_country),
        receiver_name = COALESCE(${updates.receiverName ?? null}, receiver_name),
        receiver_phone = COALESCE(${updates.receiverPhone ?? null}, receiver_phone),
        receiver_address = COALESCE(${updates.receiverAddress ?? null}, receiver_address),
        receiver_country = COALESCE(${updates.receiverCountry ?? null}, receiver_country),
        description = COALESCE(${updates.description ?? null}, description),
        total_amount = COALESCE(${updates.totalAmount ?? null}, total_amount),
        deposit = COALESCE(${updates.deposit ?? null}, deposit),
        price = COALESCE(${updates.amount ?? null}, price),
        weight = COALESCE(${updates.weight ?? null}, weight),
        received_date = COALESCE(${updates.receivedDate ?? null}, received_date),
        delivery_status = COALESCE(${updates.status ?? null}, delivery_status),
        payment_status = COALESCE(${updates.paymentStatus ?? null}, payment_status),
        notes = COALESCE(${updates.notes ?? null}, notes),
        collection_method = COALESCE(${updates.collectionMethod ?? null}, collection_method)
      WHERE id = ${sanitizedId} AND deleted_at IS NULL
    `

    // Revalidate paths after successful update (including driver pages)
    revalidatePath("/shipments-tracking")
    revalidatePath("/drivers")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating shipment:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function updateShipmentStatus(id: string, status: string, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }

    // Validate CSRF token
    const sanitizedId = sanitizeString(id)
    const sanitizedStatus = sanitizeString(status)

    if (sanitizedStatus === "delivered") {
      await sql`
        UPDATE shipments 
        SET delivery_status = ${sanitizedStatus}, 
            current_tracking_stage = 5
        WHERE id = ${sanitizedId}
      `

      await sql`
        INSERT INTO shipment_tracking_history (shipment_id, status, location, notes, created_at)
        VALUES (${sanitizedId}, 'تم تسليم الشحنة بنجاح', 'تم التسليم', 'تم تسليم الشحنة للمستلم', NOW())
      `
    } else {
      await sql`
        UPDATE shipments SET delivery_status = ${sanitizedStatus} WHERE id = ${sanitizedId}
      `
    }

    revalidatePath("/invoices")
    revalidatePath("/")
    revalidatePath("/track")
    revalidatePath("/track-shipment")

    return { success: true }
  } catch (error) {
    console.error("Error updating shipment status:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}
