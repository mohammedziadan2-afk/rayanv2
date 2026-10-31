"use server"

import { sql } from "@/lib/neon/server"
import { revalidatePath } from "next/cache"
import { validateCSRFTokenFromRequest } from "@/lib/csrf-server"
import { sanitizeString, sanitizeNumber } from "@/lib/input-sanitizer"
import type { PaginationParams, PaginationResult } from "@/lib/pagination"
import { validatePaginationParams, calculatePagination, getPageRange } from "@/lib/pagination"

export interface Trip {
  id: string
  trip_number: string
  departure_date: string
  shipment_ids: string[]
  driver_name: string
  vehicle_number: string
  status: string
  notes: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  shipments: Array<{
    id: string
    tracking_number: string
    sender_name: string
    receiver_name: string
    receiver_phone: string
    description: string
    receiver_address: string
    price: number
    amount: number
  }>
  delivery_costs: number
  porter_fees: number
  permit_fees: number
  tickets: number
  employee_daily_wages: number
  accommodation: number
  other_costs: number
  tobacco_revenue: number
  other_revenue: number
}

export async function getTripCount() {
  try {
    const result = await sql`
      SELECT COUNT(*) as count FROM trips WHERE deleted_at IS NULL
    `

    return Number(result[0]?.count || 0)
  } catch (error) {
    return 0
  }
}

export async function getTrips() {
  try {
    const tripsData = await sql`
      SELECT * FROM trips
      WHERE deleted_at IS NULL
      ORDER BY departure_date DESC
    `

    if (!tripsData || tripsData.length === 0) return []

    const tripsWithShipments = await Promise.all(
      tripsData.map(async (trip: any) => {
        const shipmentIds = trip.shipment_ids || []

        let parsedNotes = {
          people_count: 0,
          bags_count: 0,
          delivery_costs: 0,
          porter_fees: 0,
          permit_fees: 0,
          tickets: 0,
          employee_daily_wages: 0,
          accommodation: 0,
          other_costs: 0,
          tobacco_revenue: 0,
          other_revenue: 0,
        }

        try {
          if (trip.notes) {
            parsedNotes = JSON.parse(trip.notes)
          }
        } catch (e) {
          console.error("[v0] Error parsing trip notes:", e)
        }

        if (shipmentIds.length === 0) {
          return {
            ...trip,
            shipments: [],
            ...parsedNotes,
          }
        }

        const shipmentsData = await sql`
          SELECT id, tracking_number, sender_name, receiver_name, receiver_phone,
                 description, receiver_address, total_amount as price, price as amount
          FROM shipments
          WHERE id = ANY(${shipmentIds})
        `

        return {
          ...trip,
          shipments: shipmentsData,
          ...parsedNotes,
        }
      }),
    )

    return tripsWithShipments as Trip[]
  } catch (error) {
    return []
  }
}

export async function getAllTrips() {
  try {
    const tripsData = await sql`
      SELECT * FROM trips ORDER BY departure_date DESC
    `

    if (!tripsData || tripsData.length === 0) return []

    const tripsWithShipments = await Promise.all(
      tripsData.map(async (trip: any) => {
        const shipmentIds = trip.shipment_ids || []

        let parsedNotes = {
          people_count: 0,
          bags_count: 0,
          delivery_costs: 0,
          porter_fees: 0,
          permit_fees: 0,
          tickets: 0,
          employee_daily_wages: 0,
          accommodation: 0,
          other_costs: 0,
          tobacco_revenue: 0,
          other_revenue: 0,
        }

        try {
          if (trip.notes) {
            parsedNotes = JSON.parse(trip.notes)
          }
        } catch (e) {
          console.error("[v0] Error parsing trip notes:", e)
        }

        if (shipmentIds.length === 0) {
          return {
            ...trip,
            shipments: [],
            ...parsedNotes,
          }
        }

        const shipmentsData = await sql`
          SELECT id, tracking_number, sender_name, receiver_name, receiver_phone,
                 description, receiver_address, total_amount as price, price as amount
          FROM shipments
          WHERE id = ANY(${shipmentIds})
        `

        return {
          ...trip,
          shipments: shipmentsData,
          ...parsedNotes,
        }
      }),
    )

    return tripsWithShipments as Trip[]
  } catch (error) {
    return []
  }
}

export async function createTrip(tripData: any, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw new Error("CSRF token is invalid")
    }

    let cleanDepartureDate = null
    if (tripData.departure_date) {
      try {
        const dateString = String(tripData.departure_date)
        const cleanedString = dateString.replace(/\s*gmt[+-]\d{4}/i, "").trim()
        const dateObj = new Date(cleanedString)
        if (!isNaN(dateObj.getTime())) {
          cleanDepartureDate = dateObj.toISOString().split("T")[0]
        } else {
          cleanDepartureDate = cleanedString
        }
      } catch (e) {
        cleanDepartureDate = null
      }
    }

    // Sanitize inputs
    const notesData: any = {}

    if (tripData.delivery_costs !== undefined) notesData.delivery_costs = sanitizeNumber(tripData.delivery_costs)
    if (tripData.porter_fees !== undefined) notesData.porter_fees = sanitizeNumber(tripData.porter_fees)
    if (tripData.permit_fees !== undefined) notesData.permit_fees = sanitizeNumber(tripData.permit_fees)
    if (tripData.tickets !== undefined) notesData.tickets = sanitizeNumber(tripData.tickets)
    if (tripData.employee_daily_wages !== undefined)
      notesData.employee_daily_wages = sanitizeNumber(tripData.employee_daily_wages)
    if (tripData.accommodation !== undefined) notesData.accommodation = sanitizeNumber(tripData.accommodation)
    if (tripData.other_costs !== undefined) notesData.other_costs = sanitizeNumber(tripData.other_costs)
    if (tripData.tobacco_revenue !== undefined) notesData.tobacco_revenue = sanitizeNumber(tripData.tobacco_revenue)
    if (tripData.other_revenue !== undefined) notesData.other_revenue = sanitizeNumber(tripData.other_revenue)

    // If we have cost updates, merge with existing notes
    let finalNotes = tripData.notes
    if (Object.keys(notesData).length > 0) {
      // Get existing notes
      const existingTrip = await sql`SELECT notes FROM trips WHERE trip_number = ${tripData.trip_number}`
      let existingNotes = {}
      try {
        if (existingTrip[0]?.notes) {
          existingNotes = JSON.parse(existingTrip[0].notes)
        }
      } catch (e) {
        console.error("[v0] Error parsing existing notes:", e)
      }

      // Merge existing with new
      finalNotes = JSON.stringify({ ...existingNotes, ...notesData })
    }

    const shipmentIdsArray = tripData.shipment_ids ? `{${tripData.shipment_ids.join(",")}}` : null

    const result = await sql`
      INSERT INTO trips (
        trip_number, 
        departure_date, 
        shipment_ids, 
        driver_name, 
        vehicle_number, 
        status, 
        notes
      )
      VALUES (
        ${sanitizeString(tripData.trip_number)},
        ${cleanDepartureDate},
        ${shipmentIdsArray ? sql`${shipmentIdsArray}::integer[]` : null},
        ${sanitizeString(tripData.driver_name)},
        ${sanitizeString(tripData.vehicle_number)},
        ${sanitizeString(tripData.status || "pending")},
        ${finalNotes}
      )
      RETURNING *
    `

    if (tripData.shipment_ids && tripData.shipment_ids.length > 0) {
      const now = new Date().toISOString()
      await sql`
        UPDATE shipments
        SET current_tracking_stage = 2,
            stage_2_entered_at = ${now}
        WHERE id = ANY(${tripData.shipment_ids})
          AND (current_tracking_stage IS NULL OR current_tracking_stage < 2)
      `
  
      revalidatePath("/track-shipment")
      revalidatePath("/track")
    }

    revalidatePath("/trips-table")
    revalidatePath("/finance")

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[v0] Error creating trip:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "فشل في إنشاء الرحلة",
    }
  }
}

export async function updateTrip(id: string, updates: Partial<any>, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw new Error("CSRF token is invalid")
    }

    let cleanDepartureDate = null
    if (updates.departure_date) {
      try {
        // Convert to string first if it's not already
        const dateString = String(updates.departure_date)
        // Remove any timezone information
        const cleanedString = dateString.replace(/\s*gmt[+-]\d{4}/i, "").trim()
        // Try to parse and convert to YYYY-MM-DD format
        const dateObj = new Date(cleanedString)
        if (!isNaN(dateObj.getTime())) {
          cleanDepartureDate = dateObj.toISOString().split("T")[0]
        } else {
          cleanDepartureDate = cleanedString
        }
      } catch (e) {
        cleanDepartureDate = null
      }
    }

    // Sanitize inputs
    const notesData: any = {}

    if (updates.delivery_costs !== undefined) notesData.delivery_costs = sanitizeNumber(updates.delivery_costs)
    if (updates.porter_fees !== undefined) notesData.porter_fees = sanitizeNumber(updates.porter_fees)
    if (updates.permit_fees !== undefined) notesData.permit_fees = sanitizeNumber(updates.permit_fees)
    if (updates.tickets !== undefined) notesData.tickets = sanitizeNumber(updates.tickets)
    if (updates.employee_daily_wages !== undefined)
      notesData.employee_daily_wages = sanitizeNumber(updates.employee_daily_wages)
    if (updates.accommodation !== undefined) notesData.accommodation = sanitizeNumber(updates.accommodation)
    if (updates.other_costs !== undefined) notesData.other_costs = sanitizeNumber(updates.other_costs)
    if (updates.tobacco_revenue !== undefined) notesData.tobacco_revenue = sanitizeNumber(updates.tobacco_revenue)
    if (updates.other_revenue !== undefined) notesData.other_revenue = sanitizeNumber(updates.other_revenue)

    // If we have cost updates, merge with existing notes
    let finalNotes = updates.notes
    if (Object.keys(notesData).length > 0) {
      // Get existing notes
      const existingTrip = await sql`SELECT notes FROM trips WHERE id = ${id}`
      let existingNotes = {}
      try {
        if (existingTrip[0]?.notes) {
          existingNotes = JSON.parse(existingTrip[0].notes)
        }
      } catch (e) {
        console.error("[v0] Error parsing existing notes:", e)
      }

      // Merge existing with new
      finalNotes = JSON.stringify({ ...existingNotes, ...notesData })
    }

    let shipmentIdsArray = null
    if (updates.shipment_ids) {
      // Get existing shipment_ids
      const existingTrip = await sql`SELECT shipment_ids FROM trips WHERE id = ${id}`
      const oldShipmentIds = existingTrip[0]?.shipment_ids || []
      const newShipmentIds = updates.shipment_ids

      // Find shipments that were removed (in old but not in new)
      const removedShipmentIds = oldShipmentIds.filter((sid: string) => !newShipmentIds.includes(sid))

      // Find shipments that were added (in new but not in old)
      const addedShipmentIds = newShipmentIds.filter((sid: string) => !oldShipmentIds.includes(sid))

      // Update tracking stage for removed shipments (back to stage 1)
      if (removedShipmentIds.length > 0) {
        await sql`
          UPDATE shipments
          SET current_tracking_stage = 1,
              stage_2_entered_at = NULL,
              stage_3_entered_at = NULL,
              stage_4_entered_at = NULL,
              stage_5_entered_at = NULL
          WHERE id = ANY(${removedShipmentIds})
        `
      }

      // Update tracking stage for added shipments (to stage 2)
      if (addedShipmentIds.length > 0) {
        const now = new Date().toISOString()
        await sql`
          UPDATE shipments
          SET current_tracking_stage = 2,
              stage_2_entered_at = ${now}
          WHERE id = ANY(${addedShipmentIds})
        `
        revalidatePath("/track-shipment")
        revalidatePath("/track")
      }

      shipmentIdsArray = `{${newShipmentIds.join(",")}}`
    }

    const result = await sql`
      UPDATE trips 
      SET 
        trip_number = COALESCE(${sanitizeString(updates.trip_number)}, trip_number),
        departure_date = COALESCE(${cleanDepartureDate}, departure_date),
        shipment_ids = COALESCE(${shipmentIdsArray ? sql`${shipmentIdsArray}::integer[]` : null}, shipment_ids),
        driver_name = COALESCE(${sanitizeString(updates.driver_name)}, driver_name),
        vehicle_number = COALESCE(${sanitizeString(updates.vehicle_number)}, vehicle_number),
        status = COALESCE(${sanitizeString(updates.status)}, status),
        notes = COALESCE(${finalNotes}, notes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    revalidatePath("/trips-table")
    revalidatePath("/finance")
    revalidatePath("/track-shipment")

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tripsUpdated"))
    }

    if (!result || result.length === 0) {
      return { success: false, error: "لم يتم العثور على الرحلة" }
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[v0] Error updating trip:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "فشل في تحديث الرحلة",
    }
  }
}

export async function deleteTrip(id: string, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw new Error("CSRF token is invalid")
    }

    const sanitizedId = sanitizeString(id)

    await sql`
      UPDATE trips SET deleted_at = ${new Date().toISOString()} WHERE id = ${sanitizedId}
    `

    revalidatePath("/trips")
    revalidatePath("/")
    revalidatePath("/trash")

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tripsUpdated"))
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error deleting trip:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function restoreTrip(id: string, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw new Error("CSRF token is invalid")
    }

    const sanitizedId = sanitizeString(id)

    await sql`
      UPDATE trips SET deleted_at = NULL WHERE id = ${sanitizedId}
    `

    revalidatePath("/trips")
    revalidatePath("/")
    revalidatePath("/trash")

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error restoring trip:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function permanentlyDeleteTrip(id: string, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw new Error("CSRF token is invalid")
    }

    const sanitizedId = sanitizeString(id)

    await sql`DELETE FROM trips WHERE id = ${sanitizedId}`

    revalidatePath("/trips")
    revalidatePath("/")
    revalidatePath("/trash")

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error permanently deleting trip:", error)
    if (error instanceof Error && error.message.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function getDeletedTrips() {
  try {
    const tripsData = await sql`
      SELECT * FROM trips
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `

    if (!tripsData || tripsData.length === 0) return []

    const tripsWithShipments = await Promise.all(
      tripsData.map(async (trip: any) => {
        const shipmentIds = trip.shipment_ids || []

        let parsedNotes = {
          people_count: 0,
          bags_count: 0,
          delivery_costs: 0,
          porter_fees: 0,
          permit_fees: 0,
          tickets: 0,
          employee_daily_wages: 0,
          accommodation: 0,
          other_costs: 0,
          tobacco_revenue: 0,
          other_revenue: 0,
        }

        try {
          if (trip.notes) {
            parsedNotes = JSON.parse(trip.notes)
          }
        } catch (e) {
          // Silent error handling
        }

        if (shipmentIds.length === 0) {
          return {
            ...trip,
            shipments: [],
            ...parsedNotes,
          }
        }

        const shipmentsData = await sql`
          SELECT id, tracking_number, sender_name, receiver_name, receiver_phone,
                 description, receiver_address, total_amount as price, price as amount
          FROM shipments
          WHERE id = ANY(${shipmentIds})
        `

        return {
          ...trip,
          shipments: shipmentsData,
          ...parsedNotes,
        }
      }),
    )

    return tripsWithShipments as Trip[]
  } catch (error) {
    return []
  }
}

export async function cleanupOldDeletedTrips() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const oldTrips = await sql`
      SELECT id FROM trips
      WHERE deleted_at IS NOT NULL
      AND deleted_at < ${thirtyDaysAgo.toISOString()}
    `

    if (!oldTrips || oldTrips.length === 0) {
      return { success: true, count: 0 }
    }

    await sql`
      DELETE FROM trips WHERE id = ANY(${oldTrips.map((t: any) => t.id)})
    `

    revalidatePath("/trash")

    return { success: true, count: oldTrips.length }
  } catch (error) {
    console.error("[v0] Unexpected error cleaning up old trips:", error)
    return { success: false, error: "حدث خطأ غير متوقع", count: 0 }
  }
}

export async function getNextTripNumber() {
  try {
    const data = await sql`
      SELECT trip_number FROM trips
      ORDER BY trip_number DESC
      LIMIT 1
    `

    if (!data || data.length === 0) {
      return "TRIP-0001"
    }

    const highestTripNumber = data[0].trip_number
    const match = highestTripNumber.match(/TRIP-(\d+)/)

    if (!match) {
      console.error("[v0] Invalid trip number format:", highestTripNumber)
      return "TRIP-0001"
    }

    const nextNumber = Number.parseInt(match[1]) + 1
    return `TRIP-${String(nextNumber).padStart(4, "0")}`
  } catch (error) {
    console.error("[v0] Unexpected error getting next trip number:", error)
    return "TRIP-0001"
  }
}

export async function getTripsForBudget(startDate?: string, endDate?: string) {
  try {
    let tripsData

    if (startDate && endDate) {
      tripsData = await sql`
        SELECT * FROM trips
        WHERE deleted_at IS NULL
        AND departure_date >= ${startDate}
        AND departure_date <= ${endDate}
        ORDER BY departure_date DESC
      `
    } else if (startDate) {
      tripsData = await sql`
        SELECT * FROM trips
        WHERE deleted_at IS NULL
        AND departure_date >= ${startDate}
        ORDER BY departure_date DESC
      `
    } else if (endDate) {
      tripsData = await sql`
        SELECT * FROM trips
        WHERE deleted_at IS NULL
        AND departure_date <= ${endDate}
        ORDER BY departure_date DESC
      `
    } else {
      tripsData = await sql`
        SELECT * FROM trips
        WHERE deleted_at IS NULL
        ORDER BY departure_date DESC
      `
    }

    if (!tripsData || tripsData.length === 0) {
      console.log("[v0] No trips found for the specified period")
      return []
    }

    const tripsWithShipments = await Promise.all(
      tripsData.map(async (trip: any) => {
        const shipmentIds = trip.shipment_ids || []

        let parsedNotes = {
          delivery_costs: 0,
          porter_fees: 0,
          permit_fees: 0,
          tickets: 0,
          employee_daily_wages: 0,
          accommodation: 0,
          other_costs: 0,
          tobacco_revenue: 0,
          other_revenue: 0,
        }

        try {
          if (trip.notes) {
            parsedNotes = JSON.parse(trip.notes)
          }
        } catch (e) {
          console.error("[v0] Error parsing trip notes:", e)
        }

        if (shipmentIds.length === 0) {
          return {
            ...trip,
            shipments: [],
            ...parsedNotes,
          }
        }

        const shipmentsData = await sql`
          SELECT id, tracking_number, sender_name, receiver_name, receiver_phone,
                 description, receiver_address, total_amount as price, price as amount
          FROM shipments
          WHERE id = ANY(${shipmentIds})
        `

        return {
          ...trip,
          shipments: shipmentsData || [],
          ...parsedNotes,
        }
      }),
    )

    return tripsWithShipments as Trip[]
  } catch (error) {
    return []
  }
}

export async function getTripsPaginated(params: PaginationParams = {}): Promise<PaginationResult<Trip>> {
  try {
    const { page, pageSize } = validatePaginationParams(params)
    const { from, to } = getPageRange(page, pageSize)

    const countResult = await sql`
      SELECT COUNT(*) as count FROM trips WHERE deleted_at IS NULL
    `

    const totalCount = Number(countResult[0]?.count || 0)

    const tripsData = await sql`
      SELECT * FROM trips
      WHERE deleted_at IS NULL
      ORDER BY departure_date DESC
      LIMIT ${pageSize} OFFSET ${from}
    `

    if (!tripsData || tripsData.length === 0) {
      return {
        data: [],
        pagination: calculatePagination(page, pageSize, 0),
      }
    }

    const tripsWithShipments = await Promise.all(
      tripsData.map(async (trip: any) => {
        const shipmentIds = trip.shipment_ids || []

        let parsedNotes = {
          people_count: 0,
          bags_count: 0,
          delivery_costs: 0,
          porter_fees: 0,
          permit_fees: 0,
          tickets: 0,
          employee_daily_wages: 0,
          accommodation: 0,
          other_costs: 0,
          tobacco_revenue: 0,
          other_revenue: 0,
        }

        try {
          if (trip.notes) {
            parsedNotes = JSON.parse(trip.notes)
          }
        } catch (e) {
          console.error("[v0] Error parsing trip notes:", e)
        }

        if (shipmentIds.length === 0) {
          return {
            ...trip,
            shipments: [],
            ...parsedNotes,
          }
        }

        const shipmentsData = await sql`
          SELECT id, tracking_number, sender_name, receiver_name, receiver_phone,
                 description, receiver_address, total_amount as price, price as amount
          FROM shipments
          WHERE id = ANY(${shipmentIds})
        `

        return {
          ...trip,
          shipments: shipmentsData,
          ...parsedNotes,
        }
      }),
    )

    return {
      data: tripsWithShipments as Trip[],
      pagination: calculatePagination(page, pageSize, totalCount),
    }
  } catch (error) {
    return {
      data: [],
      pagination: calculatePagination(1, 50, 0),
    }
  }
}

export async function getShipmentsByTripId(tripId: string) {
  try {
    const trip = await sql`
      SELECT shipment_ids FROM trips WHERE id = ${tripId} AND deleted_at IS NULL
    `

    if (!trip || trip.length === 0 || !trip[0].shipment_ids) {
      return []
    }

    const shipmentIds = trip[0].shipment_ids

    // تحويل الـ IDs لمصفوفة أرقام
    const idsArray = Array.isArray(shipmentIds) 
      ? shipmentIds.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id))
      : [parseInt(shipmentIds, 10)].filter((id: number) => !isNaN(id))

    if (idsArray.length === 0) {
      return []
    }

    // جلب الشحنات المتاحة من هذه الرحلة
    const shipments = await sql`
      SELECT 
        id, 
        tracking_number, 
        receiver_name, 
        receiver_phone, 
        receiver_address, 
        price as amount, 
        description,
        delivery_status
      FROM shipments
      WHERE id = ANY(${idsArray}::int[])
        AND deleted_at IS NULL
      ORDER BY tracking_number
    `

    // فلترة الشحنات غير المعينة لسائقين
    const assignedResult = await sql`
      SELECT shipment_id FROM driver_tasks WHERE shipment_id = ANY(${idsArray}::int[])
    `
    const assignedIds = new Set(assignedResult.map((r: any) => r.shipment_id))

    // إرجاع الشحنات غير المعينة فقط
    const availableShipments = shipments.filter((s: any) => !assignedIds.has(s.id))

    return availableShipments || []
  } catch (error) {
    console.error("Error fetching shipments by trip ID:", error)
    return []
  }
}
