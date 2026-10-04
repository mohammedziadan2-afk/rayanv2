"use server"

import { sql } from "@/lib/neon/server"
import { cache, CACHE_KEYS, invalidateDriverCache } from "@/lib/cache"
import { revalidatePath } from "next/cache"
import { sendDeliveryNotification } from "@/lib/whatsapp"

export interface Driver {
  id: string
  name: string
  phone?: string
  license_number?: string
  vehicle_number?: string
  vehicle_type?: string
  status: "active" | "inactive"
  notes?: string
  created_at: string
  updated_at: string
  undelivered_tasks_count?: number
  uncollected_sessions_count?: number
}

export async function getDrivers(): Promise<Driver[]> {
  try {
    // Check cache first
    const cached = cache.get<Driver[]>(CACHE_KEYS.DRIVERS_LIST)
    if (cached) return cached

    const drivers = await sql`
      SELECT 
        d.*,
        COALESCE(ut.undelivered_count, 0)::int as undelivered_tasks_count,
        COALESCE(us.uncollected_count, 0)::int as uncollected_sessions_count
      FROM drivers d
      LEFT JOIN (
        SELECT driver_id, COUNT(*) as undelivered_count
        FROM driver_tasks
        WHERE status != 'delivered'
        GROUP BY driver_id
      ) ut ON ut.driver_id = d.id
      LEFT JOIN (
        SELECT driver_id, COUNT(*) as uncollected_count
        FROM driver_sessions
        WHERE is_approved = true AND is_collected = false
        GROUP BY driver_id
      ) us ON us.driver_id = d.id
      WHERE d.deleted_at IS NULL
      ORDER BY d.name ASC
    `

    if (!drivers || drivers.length === 0) return []

    const result = drivers.map((driver) => ({
      ...driver,
      undelivered_tasks_count: Number(driver.undelivered_tasks_count || 0),
      uncollected_sessions_count: Number(driver.uncollected_sessions_count || 0),
    }))

    // Cache for 30 seconds
    cache.set(CACHE_KEYS.DRIVERS_LIST, result, 30)

    return result
  } catch (error) {
    console.error("Error fetching drivers:", error)
    return []
  }
}

export async function getDriverById(id: string): Promise<Driver | null> {
  try {
    const result = await sql`
      SELECT * FROM drivers
      WHERE id = ${id}
      LIMIT 1
    `

    return result[0] || null
  } catch (error) {
    console.error("Error fetching driver:", error)
    return null
  }
}

export async function getDriverTrips(driverName: string, limit = 5) {
  try {
    const data = await sql`
      SELECT * FROM trips
      WHERE driver_name = ${driverName}
      AND deleted_at IS NULL
      ORDER BY departure_date DESC
      LIMIT ${limit}
    `

    return data || []
  } catch (error) {
    console.error("Error fetching driver trips:", error)
    return []
  }
}

export async function addDriver(driver: Omit<Driver, "id" | "created_at" | "updated_at">) {
  try {
    const result = await sql`
      INSERT INTO drivers (name, phone, license_number, vehicle_number, vehicle_type, status, notes)
      VALUES (
        ${driver.name},
        ${driver.phone || null},
        ${driver.license_number || null},
        ${driver.vehicle_number || null},
        ${driver.vehicle_type || null},
        ${driver.status || "active"},
        ${driver.notes || null}
      )
      RETURNING *
    `

    invalidateDriverCache()
    revalidatePath("/drivers")

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error adding driver:", error)
    const message = error instanceof Error ? error.message : "فشل في إضافة السائق"
    return { success: false, error: message }
  }
}

export async function updateDriver(id: string, driver: Partial<Driver>) {
  try {
    // نستخدم COALESCE بحيث يتم تحديث الحقول المُرسلة فقط والإبقاء على الباقي كما هو.
    // القيم غير المُرسلة (undefined) تتحول إلى null فيبقي COALESCE القيمة الحالية.
    const name = driver.name ?? null
    const phone = driver.phone ?? null
    const licenseNumber = driver.license_number ?? null
    const vehicleNumber = driver.vehicle_number ?? null
    const vehicleType = driver.vehicle_type ?? null
    const status = driver.status ?? null
    const notes = driver.notes ?? null

    const result = await sql`
      UPDATE drivers SET
        name = COALESCE(${name}, name),
        phone = COALESCE(${phone}, phone),
        license_number = COALESCE(${licenseNumber}, license_number),
        vehicle_number = COALESCE(${vehicleNumber}, vehicle_number),
        vehicle_type = COALESCE(${vehicleType}, vehicle_type),
        status = COALESCE(${status}, status),
        notes = COALESCE(${notes}, notes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    invalidateDriverCache()
    revalidatePath("/drivers")

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error updating driver:", error)
    const message = error instanceof Error ? error.message : "فشل في تحديث السائق"
    return { success: false, error: message }
  }
}

export async function deleteDriver(id: string) {
  try {
    // Get latest unapproved session
    const latestSession = await sql`
      SELECT id FROM driver_sessions
      WHERE driver_id = ${id}
      AND is_approved = false
      ORDER BY session_date DESC
      LIMIT 1
    `

    if (latestSession.length > 0) {
      const sessionTasks = await sql`
        SELECT dt.id, dt.shipment_id, dt.original_payment_status,
               s.id as shipment_db_id, s.status
        FROM driver_tasks dt
        LEFT JOIN shipments s ON dt.shipment_id = s.id
        WHERE dt.session_id = ${latestSession[0].id}
      `

      if (sessionTasks && sessionTasks.length > 0) {
        for (const task of sessionTasks) {
          if (task.shipment_db_id) {
            const originalPaymentStatus = task.original_payment_status || "unpaid"

            await sql`
              UPDATE shipments
              SET payment_status = ${originalPaymentStatus}, status = 'pending'
              WHERE id = ${task.shipment_db_id}
            `
          }
        }
      }
    }

    // Delete related records
    await sql`DELETE FROM driver_tasks WHERE driver_id = ${id}`
    await sql`DELETE FROM driver_sessions WHERE driver_id = ${id}`
    await sql`DELETE FROM drivers WHERE id = ${id}`

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("driversUpdated"))
      window.dispatchEvent(new CustomEvent("shipmentsUpdated"))
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting driver:", error)
    return { success: false, error: "فشل في حذف السائق" }
  }
}

export async function assignShipmentsToDriver(
  driverId: string,
  tripId: string,
  shipments: Array<{ shipmentId: string; deliveryType: "included" | "not_included"; driverCollects: boolean }>,
) {
  try {
    const shipmentIds = shipments.map((s) => Number.parseInt(s.shipmentId))

    const shipmentsData = await sql`
      SELECT id, payment_status
      FROM shipments
      WHERE id = ANY(${shipmentIds})
    `

    const paymentStatusMap = new Map(shipmentsData?.map((s: any) => [s.id.toString(), s.payment_status]) || [])

    for (const shipment of shipments) {
      await sql`
        INSERT INTO driver_tasks (driver_id, shipment_id, trip_id, delivery_type, status, original_payment_status, driver_collects)
        VALUES (
          ${Number.parseInt(driverId)}, 
          ${Number.parseInt(shipment.shipmentId)}, 
          ${tripId ? Number.parseInt(tripId) : null}, 
          ${shipment.deliveryType}, 
          'pending',
          ${paymentStatusMap.get(shipment.shipmentId) || "unpaid"},
          ${shipment.driverCollects}
        )
      `
    }

    const now = new Date().toISOString()
    await sql`
      UPDATE shipments
      SET current_tracking_stage = 4, stage_4_entered_at = ${now}
      WHERE id = ANY(${shipmentIds})
    `

    for (const shipmentId of shipmentIds) {
      await sql`
        INSERT INTO shipment_tracking_history (shipment_id, stage, stage_name, entered_at, status)
        VALUES (${shipmentId}, 4, 'وصول الطلب للمركز والتوزيع', ${now}, 'in_transit')
      `
    }

    invalidateDriverCache(driverId)
    revalidatePath(`/drivers/${driverId}`)
    revalidatePath("/track-shipment")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error assigning shipments to driver:", error)
    return { success: false, message: "فشل في إضافة الشحنات للسائق" }
  }
}

export async function getDriverTasks(driverId: string, status?: string) {
  try {
    const cacheKey = status ? `${CACHE_KEYS.DRIVER_TASKS(driverId)}_${status}` : CACHE_KEYS.DRIVER_TASKS(driverId)

    const cached = cache.get<any[]>(cacheKey)
    if (cached) return cached

    let query
    if (status) {
      query = await sql`
        SELECT dt.*,
               json_build_object(
                 'tracking_number', s.tracking_number,
                 'receiver_name', s.receiver_name,
                 'receiver_phone', s.receiver_phone,
                 'receiver_address', s.receiver_address,
                 'amount', s.price,
                 'description', COALESCE(NULLIF(s.description, ''), s.shipment_type, 'شحنة بدون وصف'),
                 'status', s.delivery_status,
                 'payment_status', s.payment_status,
                 'collection_method', s.collection_method
               ) as shipments
        FROM driver_tasks dt
        LEFT JOIN shipments s ON dt.shipment_id = s.id
        WHERE dt.driver_id = ${driverId}
        AND dt.status = ${status}
        ORDER BY dt.created_at DESC
      `
    } else {
      query = await sql`
        SELECT dt.*,
               json_build_object(
                 'tracking_number', s.tracking_number,
                 'receiver_name', s.receiver_name,
                 'receiver_phone', s.receiver_phone,
                 'receiver_address', s.receiver_address,
                 'amount', s.price,
                 'description', COALESCE(NULLIF(s.description, ''), s.shipment_type, 'شحنة بدون وصف'),
                 'status', s.delivery_status,
                 'payment_status', s.payment_status,
                 'collection_method', s.collection_method
               ) as shipments
        FROM driver_tasks dt
        LEFT JOIN shipments s ON dt.shipment_id = s.id
        WHERE dt.driver_id = ${driverId}
        AND dt.status NOT IN ('delivered', 'rejected', 'refused')
        ORDER BY dt.created_at DESC
      `
    }

    const result = query || []
    cache.set(cacheKey, result, 30)
    return result
  } catch (error) {
    console.error("Error fetching driver tasks:", error)
    return []
  }
}

export async function getLatestSessionsForAllDrivers() {
  try {
    const sessions = await sql`
      SELECT DISTINCT ON (ds.driver_id)
             ds.id,
             ds.driver_id,
             ds.session_number,
             ds.session_date,
             ds.is_approved,
             ds.is_collected,
             ds.total_revenue,
             ds.total_driver_fee,
             ds.remaining_collection,
             ds.delivered_count,
             d.name as driver_name,
             d.phone as driver_phone
      FROM driver_sessions ds
      JOIN drivers d ON ds.driver_id = d.id
      WHERE d.deleted_at IS NULL
      ORDER BY ds.driver_id, ds.session_date DESC, ds.id DESC
    `
    return sessions || []
  } catch (error) {
    console.error("Error fetching latest sessions for all drivers:", error)
    return []
  }
}

export async function getDriverSessions(driverId: string) {
  try {
    const cacheKey = CACHE_KEYS.DRIVER_SESSIONS(driverId)
    const cached = cache.get<any[]>(cacheKey)
    if (cached) return cached

    const sessions = await sql`
      SELECT ds.id,
             ds.driver_id,
             ds.start_time,
             ds.end_time,
             ds.is_approved,
             ds.is_collected,
             ds.session_date,
             ds.notes,
             ds.trip_id,
             ds.total_fees,
             ds.collected_amount,
             ds.approved_by,
             ds.approved_at,
             ds.collected_by,
             ds.collected_at,
             ds.session_number,
             ds.total_revenue,
             ds.total_driver_fee,
             ds.remaining_collection,
             ds.delivered_count,
             ds.updated_at,
             t.trip_number,
             t.departure_date
      FROM driver_sessions ds
      LEFT JOIN trips t ON ds.trip_id = t.id
      WHERE ds.driver_id = ${driverId}
      ORDER BY ds.session_date DESC
    `

    const result = sessions || []
    cache.set(cacheKey, result, 30)
    return result
  } catch (error) {
    console.error("Error fetching driver sessions:", error)
    return []
  }
}

export async function getSessionTasks(sessionId: string) {
  try {
    const data = await sql`
      SELECT dt.*,
             json_build_object(
               'tracking_number', s.tracking_number,
               'receiver_name', s.receiver_name,
               'receiver_phone', s.receiver_phone,
               'receiver_address', s.receiver_address,
               'amount', s.price,
               'description', COALESCE(NULLIF(s.description, ''), s.shipment_type, 'شحنة بدون وصف'),
               'status', s.delivery_status,
               'payment_status', s.payment_status,
               'collection_method', s.collection_method
             ) as shipments
      FROM driver_tasks dt
      LEFT JOIN shipments s ON dt.shipment_id = s.id
      WHERE dt.session_id = ${sessionId}
      ORDER BY dt.created_at DESC
    `

    return data || []
  } catch (error) {
    console.error("Error fetching session tasks:", error)
    return []
  }
}

export async function createDriverSession(driverId: string, tripId?: string, sessionDate?: string) {
  try {
    const countResult = await sql`
      SELECT COUNT(*) as count FROM driver_sessions WHERE driver_id = ${driverId}
    `

    const nextSessionNumber = Number(countResult[0]?.count || 0) + 1

    const result = await sql`
      INSERT INTO driver_sessions (driver_id, trip_id, session_date, session_number)
      VALUES (${driverId}, ${tripId || null}, ${sessionDate || new Date().toISOString()}, ${nextSessionNumber})
      RETURNING *
    `

    invalidateDriverCache(driverId)

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("driverSessionsUpdated"))
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error creating driver session:", error)
    return { success: false, error: "فشل في إنشاء جلسة السائق" }
  }
}

export async function updateDriverTask(
  taskId: string,
  updates: {
    status?: string
    driver_fee?: number
    completed_date?: string
    notes?: string
    session_id?: string
    postpone_reason?: string
    receiver_signature?: string | null
  },
) {
  try {
    const taskIdNum = Number.parseInt(taskId)
    if (isNaN(taskIdNum)) {
      return { success: false, message: "معرف المهمة غير صالح" }
    }

    let taskData
    const finalUpdates = { ...updates }

    if (updates.status === "delivered") {
      taskData = await sql`
        UPDATE driver_tasks 
        SET status = ${finalUpdates.status},
            completed_date = ${new Date().toISOString()},
            driver_fee = ${finalUpdates.driver_fee || 0},
            notes = ${finalUpdates.notes || ""}
        WHERE id = ${taskIdNum}
        RETURNING *
      `
    } else if (updates.status === "postponed") {
      taskData = await sql`
        UPDATE driver_tasks 
        SET status = ${finalUpdates.status},
            postpone_reason = ${finalUpdates.postpone_reason || ""},
            notes = ${finalUpdates.notes || ""}
        WHERE id = ${taskIdNum}
        RETURNING *
      `
    } else if (updates.status === "rejected" || updates.status === "refused") {
      const oldTask = await sql`SELECT session_id, driver_id FROM driver_tasks WHERE id = ${taskIdNum}`
      const oldSessionId = oldTask?.[0]?.session_id

      taskData = await sql`
        UPDATE driver_tasks 
        SET status = 'pending',
            session_id = NULL,
            driver_fee = ${finalUpdates.driver_fee || 0},
            notes = ${finalUpdates.notes || ""}
        WHERE id = ${taskIdNum}
        RETURNING *
      `

      if (oldSessionId) {
        try {
          await updateSessionSummary(String(oldSessionId))
        } catch (e) {
          console.error("[v0] Error updating old session summary:", e)
        }
      }
    } else if (updates.status) {
      taskData = await sql`
        UPDATE driver_tasks 
        SET status = ${finalUpdates.status},
            driver_fee = ${finalUpdates.driver_fee || 0},
            notes = ${finalUpdates.notes || ""}
        WHERE id = ${taskIdNum}
        RETURNING *
      `
    } else {
      return { success: false, message: "لا يوجد تحديثات لتطبيقها" }
    }

    const task = taskData?.[0]

    if (!task) {
      return { success: false, message: "بيانات المهمة غير صحيحة" }
    }

    if (!task.shipment_id) {
      return { success: false, message: "المهمة غير مرتبطة بشحنة" }
    }

    const shipments = await sql`
      SELECT id, delivery_status, tracking_number, payment_status
      FROM shipments WHERE id = ${task.shipment_id}
      LIMIT 1
    `

    if (updates.status === "delivered" && shipments && shipments.length > 0) {
      const shipment = shipments[0]

      // Update shipment with delivery status and receiver signature if provided
      if (updates.receiver_signature) {
        await sql`
          UPDATE shipments
          SET delivery_status = 'delivered',
              current_tracking_stage = 5,
              stage_5_entered_at = ${new Date().toISOString()},
              payment_status = CASE WHEN payment_status = 'unpaid' THEN 'paid' ELSE payment_status END,
              receiver_signature = ${updates.receiver_signature}
          WHERE id = ${shipment.id}
        `
      } else {
        await sql`
          UPDATE shipments
          SET delivery_status = 'delivered',
              current_tracking_stage = 5,
              stage_5_entered_at = ${new Date().toISOString()},
              payment_status = CASE WHEN payment_status = 'unpaid' THEN 'paid' ELSE payment_status END
          WHERE id = ${shipment.id}
        `
      }

      await sql`
        INSERT INTO shipment_tracking_history (shipment_id, status, stage, stage_name, entered_at)
        VALUES (${shipment.id}, 'delivered', 5, 'تم تسليم الشحنة بنجاح', ${new Date().toISOString()})
      `
      
      // Send WhatsApp notification to admin
      try {
        const shipmentDetails = await sql`
          SELECT s.tracking_number, s.receiver_name, s.receiver_address, s.total_amount,
                 d.name as driver_name
          FROM shipments s
          LEFT JOIN driver_tasks dt ON dt.shipment_id = s.id
          LEFT JOIN drivers d ON dt.driver_id = d.id
          WHERE s.id = ${shipment.id}
          LIMIT 1
        `
        
        if (shipmentDetails && shipmentDetails.length > 0) {
          const details = shipmentDetails[0]
          await sendDeliveryNotification({
            trackingNumber: details.tracking_number,
            driverName: details.driver_name || 'غير محدد',
            receiverName: details.receiver_name || 'غير محدد',
            receiverAddress: details.receiver_address || 'غير محدد',
            totalAmount: parseFloat(details.total_amount) || 0,
            deliveryDate: new Date()
          })
        }
      } catch (whatsappError) {
        console.error('[WhatsApp] Error sending delivery notification:', whatsappError)
        // Don't fail the delivery if WhatsApp fails
      }
    }

    if (updates.session_id && (updates.status === "delivered" || updates.status === "postponed")) {
      try {
        await updateSessionSummary(updates.session_id)
      } catch (e) {
        console.error("[v0] Error updating session summary:", e)
      }
    }

    if (task.driver_id) {
      invalidateDriverCache(task.driver_id.toString())
    }
    revalidatePath("/drivers")
    revalidatePath("/driver-view")

    return { success: true, data: task }
  } catch (error) {
    console.error("[v0] Error updating driver task:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "فشل في تحديث المهمة",
    }
  }
}

async function updateSessionSummary(sessionId: string) {
  try {
    const allTasks = await sql`
      SELECT dt.driver_fee, dt.delivery_type, dt.original_payment_status, dt.status,
             dt.task_type, dt.cash_amount,
             s.price as amount, s.payment_status, s.tracking_number
      FROM driver_tasks dt
      LEFT JOIN shipments s ON dt.shipment_id = s.id
      WHERE dt.session_id = ${sessionId}
    `

    // Separate cash receipts from shipment tasks
    const shipmentTasks = allTasks?.filter((task: any) => (task.task_type || 'shipment') === 'shipment') || []
    const cashReceipts = allTasks?.filter((task: any) => task.task_type === 'cash_receipt') || []

    const deliveredTasks = shipmentTasks.filter((task: any) => task.status === "delivered")
    const pendingTasks = shipmentTasks.filter((task: any) => task.status === "pending")
    const allTasksCompleted = pendingTasks.length === 0 && shipmentTasks.length > 0

    // Calculate cash receipts total
    const cashReceiptsTotal = cashReceipts.reduce((sum: number, task: any) => sum + (Number(task.cash_amount) || 0), 0)

    const totalRevenue =
      (deliveredTasks.reduce((sum: number, task: any) => {
        const wasOriginallyPaid = task.original_payment_status === "paid"
        const isNotIncluded = task.delivery_type === "not_included"

        let revenue = 0
        if (wasOriginallyPaid) {
          if (isNotIncluded) {
            revenue = Number(task.driver_fee) || 0
          }
        } else {
          revenue = Number(task.amount) || 0
          if (isNotIncluded) {
            revenue += Number(task.driver_fee) || 0
          }
        }

        return sum + revenue
      }, 0) || 0) + cashReceiptsTotal

    const totalDriverFee =
      deliveredTasks.reduce((sum: number, task: any) => sum + (Number(task.driver_fee) || 0), 0) || 0
    const remainingCollection = totalRevenue - totalDriverFee
    // Only count actual shipment deliveries, not cash receipts
    const deliveredCount = deliveredTasks.length

    const deliveredShipmentIds = deliveredTasks.map((task: any) => task.shipment_id).filter(Boolean)

    if (deliveredShipmentIds.length > 0) {
      const unpaidDeliveredIds = deliveredTasks
        .filter((task: any) => task.original_payment_status === "unpaid")
        .map((task: any) => task.shipment_id)
        .filter(Boolean)

      const paidDeliveredIds = deliveredTasks
        .filter((task: any) => task.original_payment_status === "paid")
        .map((task: any) => task.shipment_id)
        .filter(Boolean)

      if (unpaidDeliveredIds.length > 0) {
        await sql`
          UPDATE shipments
          SET payment_status = 'paid',
              delivery_status = 'delivered',
              current_tracking_stage = 5,
              stage_5_entered_at = ${new Date().toISOString()}
          WHERE id = ANY(${unpaidDeliveredIds})
        `

        for (const shipmentId of unpaidDeliveredIds) {
          await sql`
            INSERT INTO shipment_tracking_history (shipment_id, status, stage, stage_name, entered_at)
            VALUES (${shipmentId}, 'delivered', 5, 'تم تسليم الشحنة بنجاح', ${new Date().toISOString()})
          `
        }
      }

      if (paidDeliveredIds.length > 0) {
        await sql`
          UPDATE shipments
          SET delivery_status = 'delivered',
              current_tracking_stage = 5,
              stage_5_entered_at = ${new Date().toISOString()}
          WHERE id = ANY(${paidDeliveredIds})
        `

        for (const shipmentId of paidDeliveredIds) {
          await sql`
            INSERT INTO shipment_tracking_history (shipment_id, status, stage, stage_name, entered_at)
            VALUES (${shipmentId}, 'delivered', 5, 'تم تسليم الشحنة بنجاح', ${new Date().toISOString()})
          `
        }
      }
    }

    const data = await sql`
      UPDATE driver_sessions
      SET total_revenue = ${totalRevenue},
          total_driver_fee = ${totalDriverFee},
          remaining_collection = ${remainingCollection},
          delivered_count = ${deliveredCount},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${sessionId}
      RETURNING *
    `

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error updating session summary:", error)
  }
}

export async function assignTasksToSession(sessionId: string, taskIds: string[]) {
  try {
    const numericTaskIds = taskIds.map((id) => Number.parseInt(id))

    await sql`
      UPDATE driver_tasks
      SET session_id = ${Number.parseInt(sessionId)}
      WHERE id = ANY(${numericTaskIds})
    `

    const session = await sql`SELECT driver_id FROM driver_sessions WHERE id = ${sessionId} LIMIT 1`
    if (session && session[0]) {
      invalidateDriverCache(session[0].driver_id.toString())
    }

    return { success: true }
  } catch (error) {
    console.error("Error assigning tasks to session:", error)
    return { success: false, error: "فشل في تعيين المهام للجلسة" }
  }
}

export async function deleteDriverTask(taskId: string) {
  try {
    const task = await sql`
      SELECT driver_id FROM driver_tasks WHERE id = ${Number.parseInt(taskId)} LIMIT 1
    `
    const driverId = task?.[0]?.driver_id?.toString()

    await sql`DELETE FROM driver_tasks WHERE id = ${Number.parseInt(taskId)}`

    if (driverId) {
      invalidateDriverCache(driverId)
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting driver task:", error)
    return { success: false, error: "فشل في حذف المهمة" }
  }
}

export async function getSessionById(sessionId: string) {
  try {
    const result = await sql`
      SELECT * FROM driver_sessions WHERE id = ${sessionId} LIMIT 1
    `

    return result[0] || null
  } catch (error) {
    console.error("Error fetching session:", error)
    return null
  }
}

export async function approveDriverSession(sessionId: string, approvedBy?: string) {
  try {
    const tasks = await sql`
      SELECT dt.status, dt.driver_fee, dt.delivery_type,
             dt.task_type, dt.cash_amount,
             s.id as shipment_id, s.price as amount, s.collection_method, s.tracking_number
      FROM driver_tasks dt
      LEFT JOIN shipments s ON dt.shipment_id = s.id
      WHERE dt.session_id = ${sessionId}
    `

    // Separate shipment tasks from cash receipts
    const shipmentTasks = tasks?.filter((task: any) => (task.task_type || 'shipment') === 'shipment') || []
    const cashReceipts = tasks?.filter((task: any) => task.task_type === 'cash_receipt') || []
    const deliveredTasks = shipmentTasks.filter((task: any) => task.status === "delivered")

    // Calculate cash receipts total
    const cashReceiptsTotal = cashReceipts.reduce((sum: number, task: any) => sum + (Number(task.cash_amount) || 0), 0)

    const totalRevenue =
      (deliveredTasks.reduce((sum: number, task: any) => {
        const collectionMethod = task.collection_method || "driver"
        const isNotIncluded = task.delivery_type === "not_included"

        let revenue = 0

        if (collectionMethod === "driver") {
          revenue = Number(task.amount) || 0
        }

        if (isNotIncluded) {
          revenue += Number(task.driver_fee) || 0
        }

        return sum + revenue
      }, 0) || 0) + cashReceiptsTotal

    const totalDriverFee =
      deliveredTasks.reduce((sum: number, task: any) => sum + (Number(task.driver_fee) || 0), 0) || 0

    const remainingCollection = totalRevenue - totalDriverFee
    // Only count actual shipment deliveries
    const deliveredCount = deliveredTasks.length

    const deliveredShipmentIds = deliveredTasks.map((task: any) => task.shipment_id).filter(Boolean)

    if (deliveredShipmentIds.length > 0) {
      await sql`
        UPDATE shipments
        SET delivery_status = 'delivered',
            current_tracking_stage = 5,
            stage_5_entered_at = ${new Date().toISOString()}
        WHERE id = ANY(${deliveredShipmentIds})
      `

      for (const shipmentId of deliveredShipmentIds) {
        await sql`
          INSERT INTO shipment_tracking_history (shipment_id, status, stage, stage_name, entered_at)
          VALUES (${shipmentId}, 'delivered', 5, 'تم تسليم الشحنة بنجاح', ${new Date().toISOString()})
        `
      }
    }

    const data = await sql`
      UPDATE driver_sessions
      SET total_revenue = ${totalRevenue},
          total_driver_fee = ${totalDriverFee},
          delivered_count = ${deliveredCount},
          remaining_collection = ${remainingCollection},
          is_approved = true,
          approved_at = ${new Date().toISOString()},
          approved_by = ${approvedBy || null},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${sessionId}
      RETURNING *
    `

    const session = await sql`SELECT driver_id FROM driver_sessions WHERE id = ${sessionId} LIMIT 1`
    if (session && session[0]) {
      invalidateDriverCache(session[0].driver_id.toString())
    }
    revalidatePath("/drivers")

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("driverSessionsUpdated"))
      window.dispatchEvent(new CustomEvent("shipmentsUpdated"))
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error approving driver session:", error)
    return { success: false, error: "فشل في اعتماد الجلسة" }
  }
}

export async function returnShipmentToTasks(taskId: string) {
  try {
    const taskInfo = await sql`SELECT driver_id, session_id FROM driver_tasks WHERE id = ${taskId} LIMIT 1`

    const data = await sql`
      UPDATE driver_tasks
      SET session_id = NULL, status = 'pending', completed_date = NULL, driver_fee = NULL
      WHERE id = ${taskId}
      RETURNING *
    `

    if (taskInfo[0]?.session_id) {
      await updateSessionSummary(taskInfo[0].session_id)
    }

    if (taskInfo[0]?.driver_id) {
      invalidateDriverCache(taskInfo[0].driver_id.toString())
    }
    revalidatePath("/drivers")

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("driverTasksUpdated"))
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error returning shipment to tasks:", error)
    return { success: false, error: "فشل في إرجاع الشحنة" }
  }
}

export async function confirmShipmentDelivery(taskId: string) {
  try {
    const taskInfo = await sql`SELECT driver_id FROM driver_tasks WHERE id = ${taskId} LIMIT 1`

    const data = await sql`
      UPDATE driver_tasks
      SET status = 'delivered', completed_date = ${new Date().toISOString()}
      WHERE id = ${taskId}
      RETURNING *
    `

    const task = data[0]

    if (task?.shipment_id) {
      await sql`
        UPDATE shipments
        SET delivery_status = 'delivered',
            current_tracking_stage = 5,
            stage_5_entered_at = ${new Date().toISOString()}
        WHERE id = ${task.shipment_id}
      `

      await sql`
        INSERT INTO shipment_tracking_history (shipment_id, status, stage, stage_name, entered_at)
        VALUES (${task.shipment_id}, 'delivered', 5, 'تم تسليم الشحنة بنجاح', ${new Date().toISOString()})
      `
    }

    if (task?.session_id) {
      await updateSessionSummary(task.session_id)
    }

    if (taskInfo[0]?.driver_id) {
      invalidateDriverCache(taskInfo[0].driver_id.toString())
    }
    revalidatePath("/drivers")

    return { success: true, data: task }
  } catch (error) {
    console.error("Error confirming shipment delivery:", error)
    return { success: false, error: "فشل في تأكيد التسليم" }
  }
}

export async function recalculateApprovedSession(sessionId: string) {
  try {
    const tasks = await sql`
      SELECT dt.driver_fee, dt.delivery_type, dt.driver_collects,
             dt.task_type, dt.cash_amount,
             s.id, s.price as amount, s.payment_status, s.tracking_number
      FROM driver_tasks dt
      LEFT JOIN shipments s ON dt.shipment_id = s.id
      WHERE dt.session_id = ${sessionId}
      AND dt.status = 'delivered'
    `

    // Separate shipment tasks from cash receipts
    const shipmentTasks = tasks?.filter((task: any) => (task.task_type || 'shipment') === 'shipment') || []
    const cashReceipts = tasks?.filter((task: any) => task.task_type === 'cash_receipt') || []

    const cashReceiptsTotal = cashReceipts.reduce((sum: number, task: any) => sum + (Number(task.cash_amount) || 0), 0)

    const totalRevenue =
      (shipmentTasks.reduce((sum: number, task: any) => {
        const driverCollects =
          task.driver_collects === true ||
          task.driver_collects === "true" ||
          task.driver_collects === 1 ||
          task.delivery_type === "included"

        const isNotIncluded = task.delivery_type === "not_included"

        let revenue = 0

        if (driverCollects) {
          revenue = Number(task.amount) || 0
        }

        if (isNotIncluded && !driverCollects) {
          revenue += Number(task.driver_fee) || 0
        }

        return sum + revenue
      }, 0) || 0) + cashReceiptsTotal

    const totalDriverFee = shipmentTasks.reduce((sum: number, task: any) => sum + (Number(task.driver_fee) || 0), 0) || 0
    // Only count actual shipment deliveries
    const deliveredCount = shipmentTasks.length
    const remainingCollection = totalRevenue - totalDriverFee

    const data = await sql`
      UPDATE driver_sessions
      SET total_revenue = ${totalRevenue},
          total_driver_fee = ${totalDriverFee},
          delivered_count = ${deliveredCount},
          remaining_collection = ${remainingCollection},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${sessionId}
      RETURNING *
    `

    const session = await sql`SELECT driver_id FROM driver_sessions WHERE id = ${sessionId} LIMIT 1`
    if (session && session[0]) {
      invalidateDriverCache(session[0].driver_id.toString())
    }
    revalidatePath("/drivers")

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error recalculating session:", error)
    return { success: false, error: "فشل في إعادة حساب الجلسة" }
  }
}

export async function updateApprovedSessionFees(
  sessionId: string,
  updates: Array<{ taskId: string; driverFee: number }>,
) {
  try {
    for (const update of updates) {
      await sql`
        UPDATE driver_tasks
        SET driver_fee = ${update.driverFee}
        WHERE id = ${update.taskId}
      `
    }

    const recalcResult = await recalculateApprovedSession(sessionId)
    if (!recalcResult.success) {
      throw new Error(recalcResult.error)
    }

    revalidatePath("/drivers")

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("driverSessionsUpdated"))
      window.dispatchEvent(new CustomEvent("driverTasksUpdated"))
    }

    return { success: true, data: recalcResult.data }
  } catch (error) {
    console.error("Error updating approved session fees:", error)
    return { success: false, error: "فشل في تحديث أجور السائق" }
  }
}

export async function toggleSessionCollection(sessionId: string, isCollected: boolean) {
  try {
    const data = await sql`
      UPDATE driver_sessions
      SET is_collected = ${isCollected}, updated_at = ${new Date().toISOString()}
      WHERE id = ${sessionId}
      RETURNING *
    `

    const session = await sql`SELECT driver_id FROM driver_sessions WHERE id = ${sessionId} LIMIT 1`
    if (session && session[0]) {
      invalidateDriverCache(session[0].driver_id.toString())
    }
    revalidatePath("/drivers")

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("driverSessionsUpdated"))
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error toggling session collection:", error)
    return { success: false, error: "فشل في تحديث حالة القبض" }
  }
}

export async function deleteDriverSession(sessionId: string) {
  try {
    const sessionToDelete = await sql`
      SELECT driver_id, session_number
      FROM driver_sessions
      WHERE id = ${sessionId}
      LIMIT 1
    `

    if (!sessionToDelete || sessionToDelete.length === 0) throw new Error("Session not found")

    const driverId = sessionToDelete[0].driver_id?.toString()

    const sessionTasks = await sql`
      SELECT dt.id, dt.shipment_id, dt.original_payment_status,
             s.id as shipment_db_id, s.delivery_status
      FROM driver_tasks dt
      LEFT JOIN shipments s ON dt.shipment_id = s.id
      WHERE dt.session_id = ${sessionId}
    `

    if (sessionTasks && sessionTasks.length > 0) {
      for (const task of sessionTasks) {
        if (task.shipment_db_id) {
          const originalPaymentStatus = task.original_payment_status || "unpaid"
          await sql`
            UPDATE shipments
            SET payment_status = ${originalPaymentStatus}, delivery_status = 'pending'
            WHERE id = ${task.shipment_db_id}
          `
        }
      }
    }

    await sql`DELETE FROM driver_tasks WHERE session_id = ${sessionId}`
    await sql`DELETE FROM driver_sessions WHERE id = ${sessionId}`

    const remainingSessions = await sql`
      SELECT id, session_number
      FROM driver_sessions
      WHERE driver_id = ${sessionToDelete[0].driver_id}
      ORDER BY session_number ASC
    `

    if (remainingSessions && remainingSessions.length > 0) {
      for (let i = 0; i < remainingSessions.length; i++) {
        const newSessionNumber = i + 1
        if (remainingSessions[i].session_number !== newSessionNumber) {
          await sql`
            UPDATE driver_sessions
            SET session_number = ${newSessionNumber}
            WHERE id = ${remainingSessions[i].id}
          `
        }
      }
    }

    if (driverId) {
      invalidateDriverCache(driverId)
    }
    revalidatePath("/drivers")

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("driverSessionsUpdated"))
      window.dispatchEvent(new CustomEvent("driverTasksUpdated"))
      window.dispatchEvent(new CustomEvent("shipmentsUpdated"))
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting driver session:", error)
    return { success: false, error: "فشل في حذف الجلسة" }
  }
}

export async function addTripShipmentsToDriver(driverId: string, tripId: string, sessionId: string) {
  try {
    const sqlClient = sql // Use sql instead of neon(process.env.NEON_DATABASE_URL!)
    const now = new Date().toISOString()

    const shipmentIds = await sqlClient`
      SELECT shipment_id FROM driver_tasks WHERE session_id = ${sessionId}
    `

    for (const shipmentId of shipmentIds) {
      await sqlClient`
        INSERT INTO shipment_tracking_history (shipment_id, status, stage, stage_name, entered_at)
        VALUES (${shipmentId}, 'in_transit', 4, 'وصول الطلب للمركز والتوزيع', ${now})
      `
    }

    const session = await sql`SELECT driver_id FROM driver_sessions WHERE id = ${sessionId} LIMIT 1`
    if (session && session[0]) {
      invalidateDriverCache(session[0].driver_id.toString())
    }
    revalidatePath("/drivers")

    return { success: true }
  } catch (error) {
    console.error("Error adding trip shipments to driver:", error)
    return { success: false, error: "فشل في إضافة الشحنات للسائق" }
  }
}

export async function addShipmentsToSession(
  driverId: string,
  sessionId: string,
  tripId: string,
  shipmentIds: string[]
) {
  try {
    const now = new Date().toISOString()
    let addedCount = 0

    for (const shipmentId of shipmentIds) {
      // Check if shipment already has a task in this session
      const existingTask = await sql`
        SELECT id FROM driver_tasks 
        WHERE shipment_id = ${shipmentId} AND session_id = ${sessionId}
        LIMIT 1
      `

      if (existingTask.length > 0) {
        continue // Skip if already exists
      }

      // Get shipment details
      const shipment = await sql`
        SELECT id, price, tracking_number FROM shipments WHERE id = ${shipmentId} LIMIT 1
      `

      if (!shipment || shipment.length === 0) {
        continue
      }

      // Check if task exists for this shipment (pending task without session)
      const pendingTask = await sql`
        SELECT id FROM driver_tasks 
        WHERE shipment_id = ${shipmentId} AND session_id IS NULL
        LIMIT 1
      `

      if (pendingTask.length > 0) {
        // Update existing task to assign to this session
        await sql`
          UPDATE driver_tasks 
          SET session_id = ${sessionId}, 
              driver_id = ${driverId},
              trip_id = ${tripId}
          WHERE id = ${pendingTask[0].id}
        `
      } else {
        // Create new task
        await sql`
          INSERT INTO driver_tasks (
            driver_id, session_id, shipment_id, trip_id, 
            status, delivery_type, driver_collects, created_at
          ) VALUES (
            ${driverId}, ${sessionId}, ${shipmentId}, ${tripId},
            'pending', 'included', true, ${now}
          )
        `
      }

      // Update shipment tracking stage to 4
      await sql`
        UPDATE shipments 
        SET current_tracking_stage = 4, stage_4_entered_at = ${now}
        WHERE id = ${shipmentId} AND (current_tracking_stage IS NULL OR current_tracking_stage < 4)
      `

      // Add tracking history
      await sql`
        INSERT INTO shipment_tracking_history (shipment_id, status, stage, stage_name, entered_at)
        VALUES (${shipmentId}, 'in_transit', 4, 'وصول الطلب للمركز والتوزيع', ${now})
        ON CONFLICT DO NOTHING
      `

      addedCount++
    }

    // Update session summary
    await updateSessionSummary(sessionId)

    // Invalidate cache
    invalidateDriverCache(driverId)
    revalidatePath("/drivers")
    revalidatePath(`/drivers/${driverId}/sessions/${sessionId}`)

    return { success: true, addedCount }
  } catch (error) {
    console.error("Error adding shipments to session:", error)
    return { success: false, error: "فشل في إضافة الشحنات للجلسة" }
  }
}

export async function addCashReceiptToSession(
  driverId: string,
  sessionId: string,
  amount: number,
  note?: string
) {
  try {
    const now = new Date().toISOString()

    await sql`
      INSERT INTO driver_tasks (
        driver_id, session_id, shipment_id, trip_id,
        status, delivery_type, driver_collects, 
        task_type, cash_amount, cash_note, created_at
      ) VALUES (
        ${driverId}, ${sessionId}, NULL, NULL,
        'delivered', 'included', true,
        'cash_receipt', ${amount}, ${note || null}, ${now}
      )
    `

    // Update session summary to include the cash receipt in revenues
    await updateSessionSummary(sessionId)

    invalidateDriverCache(driverId)
    revalidatePath("/drivers")
    revalidatePath(`/drivers/${driverId}/sessions/${sessionId}`)

    return { success: true }
  } catch (error) {
    console.error("Error adding cash receipt:", error)
    return { success: false, error: "فشل في إضافة استلام المبلغ" }
  }
}

export async function getAllDriversActiveTasks() {
  try {
    const query = await sql`
      SELECT 
        dt.*,
        d.name as driver_name,
        d.phone as driver_phone,
        json_build_object(
          'tracking_number', s.tracking_number,
          'receiver_name', s.receiver_name,
          'receiver_phone', s.receiver_phone,
          'receiver_address', s.receiver_address,
          'amount', s.price,
          'description', COALESCE(NULLIF(s.description, ''), s.shipment_type, 'شحنة بدون وصف'),
          'status', s.delivery_status,
          'payment_status', s.payment_status,
          'collection_method', s.collection_method
        ) as shipments
      FROM driver_tasks dt
      LEFT JOIN shipments s ON dt.shipment_id = s.id
      LEFT JOIN drivers d ON dt.driver_id = d.id
      WHERE dt.status NOT IN ('delivered', 'rejected', 'refused')
      AND d.deleted_at IS NULL
      ORDER BY d.name ASC, dt.created_at DESC
    `
    return query || []
  } catch (error) {
    console.error("Error fetching all drivers tasks:", error)
    return []
  }
}

export async function getPendingDriverTasksCount(): Promise<number> {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM driver_tasks dt
      LEFT JOIN drivers d ON dt.driver_id = d.id
      WHERE dt.status NOT IN ('delivered', 'rejected', 'refused')
      AND (dt.task_type IS NULL OR dt.task_type = 'shipment')
      AND d.deleted_at IS NULL
    `
    return Number(result[0]?.count || 0)
  } catch (error) {
    console.error("Error fetching pending driver tasks count:", error)
    return 0
  }
}
