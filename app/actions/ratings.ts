"use server"

import { sql } from "@/lib/neon/server"
import { revalidatePath } from "next/cache"

export interface Rating {
  id: string
  shipmentId: string
  driverId: string
  rating: number
  comment?: string
  ratedBy: string
  createdAt: string
}

export async function createRating(data: {
  shipmentId: string
  driverId: string
  rating: number
  comment?: string
  ratedBy: string
}) {
  try {
    const existingRating = await sql`
      SELECT id FROM shipment_ratings 
      WHERE shipment_id = ${data.shipmentId}
      LIMIT 1
    `

    if (existingRating && existingRating.length > 0) {
      return { success: false, error: "تم تقييم هذه الشحنة مسبقاً" }
    }

    const rating = await sql`
      INSERT INTO shipment_ratings (
        shipment_id, rating, feedback, created_at
      ) VALUES (
        ${data.shipmentId}, ${data.rating}, ${data.comment || null}, NOW()
      )
      RETURNING *
    `

    revalidatePath("/reports")
    revalidatePath("/drivers")

    return { success: true, data: rating[0] }
  } catch (error) {
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function getDriverRatings(driverId: string) {
  try {
    const data = await sql`
      SELECT 
        sr.*,
        s.tracking_number,
        s.receiver_name
      FROM shipment_ratings sr
      INNER JOIN shipments s ON sr.shipment_id = s.id
      WHERE s.driver_id = ${driverId}
      ORDER BY sr.created_at DESC
    `

    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: "حدث خطأ غير متوقع", data: [] }
  }
}

export async function getDriverAverageRating(driverId: string) {
  try {
    const result = await sql`
      SELECT 
        AVG(sr.rating)::numeric(10,1) as average,
        COUNT(*)::int as count
      FROM shipment_ratings sr
      INNER JOIN shipments s ON sr.shipment_id = s.id
      WHERE s.driver_id = ${driverId}
    `

    if (!result || result.length === 0 || result[0].count === 0) {
      return { success: true, average: 0, count: 0 }
    }

    return {
      success: true,
      average: Number.parseFloat(result[0].average) || 0,
      count: result[0].count,
    }
  } catch (error) {
    return { success: false, error: "حدث خطأ غير متوقع", average: 0, count: 0 }
  }
}

export async function getAllRatings() {
  try {
    const data = await sql`
      SELECT 
        sr.*,
        s.tracking_number,
        s.receiver_name,
        d.name as driver_name
      FROM shipment_ratings sr
      INNER JOIN shipments s ON sr.shipment_id = s.id
      INNER JOIN drivers d ON s.driver_id = d.id
      ORDER BY sr.created_at DESC
    `

    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: "حدث خطأ غير متوقع", data: [] }
  }
}

export async function updateRating(id: string, rating: number, comment?: string) {
  try {
    await sql`
      UPDATE shipment_ratings 
      SET rating = ${rating}, feedback = ${comment || null}
      WHERE id = ${id}
    `

    revalidatePath("/reports")
    revalidatePath("/drivers")

    return { success: true }
  } catch (error) {
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function deleteRating(id: string) {
  try {
    await sql`
      DELETE FROM shipment_ratings 
      WHERE id = ${id}
    `

    revalidatePath("/reports")
    revalidatePath("/drivers")

    return { success: true }
  } catch (error) {
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}
