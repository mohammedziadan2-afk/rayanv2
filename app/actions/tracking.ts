"use server"

import { sql } from "@/lib/neon/server"
import { revalidatePath } from "next/cache"

export interface TrackingStage {
  stage: number
  stageName: string
  enteredAt: string | null
  isCompleted: boolean
}

export interface ShipmentTrackingInfo {
  shipmentId: string
  trackingNumber: string
  currentStage: number
  stages: TrackingStage[]
  senderName: string
  senderCountry?: string
  senderCity?: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  receiverCountry?: string
  description: string
  amount: number
  status: string
}

const STAGE_NAMES = {
  1: "استلام الشحنة",
  2: "تحضير الشحنة للتصدير",
  3: "الشحنة قيد التصدير لدولة المستلم",
  4: "وصول الشحنة إلى مركز التوزيع",
  5: "تم تسليم الشحنة بنجاح",
}

export async function getShipmentTrackingInfo(trackingNumber: string) {
  try {
    await checkAndUpdateStage3()

    const shipments = await sql`
      SELECT * FROM shipments 
      WHERE tracking_number = ${trackingNumber}
      AND deleted_at IS NULL
      LIMIT 1
    `

    if (!shipments || shipments.length === 0) {
      return { success: false, error: "لم يتم العثور على الشحنة", data: null }
    }

    const shipment = shipments[0]

    const stages: TrackingStage[] = [
      {
        stage: 1,
        stageName: STAGE_NAMES[1],
        enteredAt: shipment.created_at,
        isCompleted: (shipment.current_tracking_stage || 1) >= 1,
      },
      {
        stage: 2,
        stageName: STAGE_NAMES[2],
        enteredAt: shipment.stage_2_entered_at,
        isCompleted: (shipment.current_tracking_stage || 1) >= 2,
      },
      {
        stage: 3,
        stageName: STAGE_NAMES[3],
        enteredAt: shipment.stage_3_entered_at,
        isCompleted: (shipment.current_tracking_stage || 1) >= 3,
      },
      {
        stage: 4,
        stageName: STAGE_NAMES[4],
        enteredAt: shipment.stage_4_entered_at,
        isCompleted: (shipment.current_tracking_stage || 1) >= 4,
      },
      {
        stage: 5,
        stageName: STAGE_NAMES[5],
        enteredAt: shipment.stage_5_entered_at,
        isCompleted: (shipment.current_tracking_stage || 1) >= 5,
      },
    ]

    const trackingInfo: ShipmentTrackingInfo = {
      shipmentId: shipment.id,
      trackingNumber: shipment.tracking_number,
      currentStage: shipment.current_tracking_stage || 1,
      stages,
      senderName: shipment.sender_name,
      senderCountry: shipment.sender_country,
      senderCity: shipment.sender_city,
      receiverName: shipment.receiver_name,
      receiverPhone: shipment.receiver_phone,
      receiverAddress: shipment.receiver_address,
      receiverCountry: shipment.receiver_country,
      description: shipment.shipment_type || "",
      amount: shipment.price || 0,
      status: shipment.delivery_status || "pending",
    }

    return { success: true, data: trackingInfo }
  } catch (error) {
    console.error("[v0] Error getting shipment tracking info:", error)
    return { success: false, error: "حدث خطأ غير متوقع", data: null }
  }
}

export async function updateShipmentStage(shipmentId: string, newStage: number) {
  try {
    const now = new Date().toISOString()

    // Update current stage and stage timestamp
    if (newStage === 2) {
      await sql`
        UPDATE shipments 
        SET current_tracking_stage = ${newStage}, stage_2_entered_at = ${now}
        WHERE id = ${shipmentId}
      `
    } else if (newStage === 3) {
      await sql`
        UPDATE shipments 
        SET current_tracking_stage = ${newStage}, stage_3_entered_at = ${now}
        WHERE id = ${shipmentId}
      `
    } else if (newStage === 4) {
      await sql`
        UPDATE shipments 
        SET current_tracking_stage = ${newStage}, stage_4_entered_at = ${now}
        WHERE id = ${shipmentId}
      `
    } else if (newStage === 5) {
      await sql`
        UPDATE shipments 
        SET current_tracking_stage = ${newStage}, stage_5_entered_at = ${now}
        WHERE id = ${shipmentId}
      `
    } else {
      await sql`
        UPDATE shipments 
        SET current_tracking_stage = ${newStage}
        WHERE id = ${shipmentId}
      `
    }

    await sql`
      INSERT INTO shipment_tracking_history (
        shipment_id, status, notes, created_at
      ) VALUES (
        ${shipmentId}, 
        ${STAGE_NAMES[newStage as keyof typeof STAGE_NAMES]}, 
        ${"Stage " + newStage}, 
        ${now}
      )
    `

    revalidatePath("/track")
    revalidatePath("/track-shipment")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating shipment stage:", error)
    return { success: false, error: "فشل في تحديث مرحلة الشحنة" }
  }
}

export async function checkAndUpdateStage3() {
  try {
    const twelveHoursAgo = new Date()
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12)

    const shipments = await sql`
      SELECT id FROM shipments 
      WHERE current_tracking_stage = 2
      AND stage_2_entered_at IS NOT NULL
      AND stage_2_entered_at < ${twelveHoursAgo.toISOString()}
      AND deleted_at IS NULL
    `

    if (shipments && shipments.length > 0) {
      const now = new Date().toISOString()

      for (const shipment of shipments) {
        // Update to stage 3
        await sql`
          UPDATE shipments 
          SET current_tracking_stage = 3, stage_3_entered_at = ${now}
          WHERE id = ${shipment.id}
        `

        await sql`
          INSERT INTO shipment_tracking_history (
            shipment_id, status, notes, created_at
          ) VALUES (
            ${shipment.id}, 
            ${STAGE_NAMES[3]}, 
            'انتقال تلقائي بعد 12 ساعة من المرحلة 2', 
            ${now}
          )
        `
      }
    }

    return { success: true, count: shipments?.length || 0 }
  } catch (error) {
    console.error("[v0] Error checking and updating stage 3:", error)
    return { success: false, error: "فشل في تحديث المرحلة 3", count: 0 }
  }
}

export async function runAutoStageUpdates() {
  try {
    const result = await checkAndUpdateStage3()
    revalidatePath("/track")
    revalidatePath("/track-shipment")
    revalidatePath("/shipments")
    return result
  } catch (error) {
    console.error("[v0] Error running auto stage updates:", error)
    return { success: false, error: "فشل في تحديث المراحل تلقائياً", count: 0 }
  }
}
