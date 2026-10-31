"use server"

import { sql } from "@/lib/neon/server"
import { validateCSRFTokenFromRequest, createCSRFError } from "@/lib/csrf-server"
import { sanitizeString, sanitizeNumber } from "@/lib/input-sanitizer"

export async function getWarehouseItems(warehouseName?: string) {
  try {
    if (warehouseName) {
      const data = await sql`
        SELECT * FROM warehouse_inventory 
        WHERE warehouse_name = ${warehouseName}
        ORDER BY created_at DESC
      `
      return { success: true, data: data || [] }
    } else {
      const data = await sql`
        SELECT * FROM warehouse_inventory 
        ORDER BY created_at DESC
      `
      return { success: true, data: data || [] }
    }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function getWarehouseItemsByName(inventoryName: string) {
  try {
    const data = await sql`
      SELECT * FROM warehouse_inventory 
      WHERE item_name = ${inventoryName}
      ORDER BY created_at DESC
    `

    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function getWarehouseEditHistory(itemIds: string[]) {
  try {
    return { success: true, data: [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function updateWarehouseEditHistory(historyRecords: any[]) {
  try {
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getWarehouseItemsByInventory(inventoryName: string) {
  try {
    const data = await sql`
      SELECT * FROM warehouse_inventory 
      WHERE location = ${inventoryName}
      ORDER BY created_at DESC
    `

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Error fetching warehouse items by inventory:", error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function addWarehouseItems(items: any[]) {
  try {


    const validItems = items.filter((item) => {
      const isValid = item.item_name && item.warehouse_name && typeof item.quantity === "number"

      if (!isValid) {
        console.error("[v0] Invalid item detected:", item)
      }
      return isValid
    })

    if (validItems.length === 0) {
      console.error("[v0] No valid items to insert")
      return { success: false, error: "لا توجد أصناف صالحة للحفظ" }
    }

    for (const item of validItems) {
      await sql`
        INSERT INTO warehouse_inventory (
          item_name, quantity, unit, location, notes, warehouse_name, 
          received_quantity, delivered_quantity
        ) VALUES (
          ${item.item_name}, ${item.quantity}, ${item.unit || null}, 
          ${item.location || null}, ${item.notes || null}, ${item.warehouse_name},
          ${item.received_quantity || 0}, ${item.delivered_quantity || 0}
        )
      `
    }


    return { success: true, data: validItems }
  } catch (error: any) {
    console.error("[v0] Error adding warehouse items:", error)
    return { success: false, error: error.message }
  }
}

export async function addWarehouseItem(item: any, inventoryName: string, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }



    // Sanitize inputs
    const sanitizedItemName = sanitizeString(item.item_name)
    const sanitizedQuantity = sanitizeNumber(item.quantity)
    const sanitizedInventoryName = sanitizeString(inventoryName)

    if (!sanitizedItemName || typeof sanitizedQuantity !== "number") {
      console.error("[v0] Invalid item data:", item)
      return { success: false, error: "بيانات الصنف غير صالحة. يجب إدخال اسم الصنف والكمية" }
    }

    const result = await sql`
      INSERT INTO warehouse_inventory (
        item_name, quantity, unit, location, notes, warehouse_name,
        received_quantity, delivered_quantity
      ) VALUES (
        ${sanitizedItemName}, ${sanitizedQuantity}, ${item.unit || null}, 
        ${sanitizedInventoryName}, ${item.notes || null}, ${item.warehouse_name || sanitizedInventoryName},
        ${item.received_quantity || 0}, ${item.delivered_quantity || 0}
      )
      RETURNING *
    `


    return { success: true, data: result[0] }
  } catch (error: any) {
    console.error("[v0] Error adding warehouse item:", error)
    if (error.message?.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: error.message }
  }
}

export async function updateWarehouseItem(id: string, updates: any, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }

    const oldData = await sql`
      SELECT * FROM warehouse_inventory WHERE id = ${id}
    `

    // Sanitize inputs
    const sanitizedItemName = updates.item_name ? sanitizeString(updates.item_name) : null
    const sanitizedQuantity = updates.quantity !== undefined ? sanitizeNumber(updates.quantity) : null

    const result = await sql`
      UPDATE warehouse_inventory 
      SET 
        item_name = COALESCE(${sanitizedItemName}, item_name),
        quantity = COALESCE(${sanitizedQuantity}, quantity),
        unit = COALESCE(${updates.unit}, unit),
        location = COALESCE(${updates.location}, location),
        notes = COALESCE(${updates.notes}, notes),
        warehouse_name = COALESCE(${updates.warehouse_name}, warehouse_name),
        received_quantity = COALESCE(${updates.received_quantity}, received_quantity),
        delivered_quantity = COALESCE(${updates.delivered_quantity}, delivered_quantity),
        last_updated = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return { success: true, data: result }
  } catch (error: any) {
    console.error("[v0] Error updating warehouse item:", error)
    if (error.message?.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: error.message }
  }
}

export async function deleteWarehouseItem(id: number, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }


    await sql`
      DELETE FROM warehouse_inventory 
      WHERE id = ${id}
    `

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deleting warehouse item:", error)
    if (error.message?.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: error.message }
  }
}

export async function deleteWarehouseInventory(inventoryName: string, csrfToken?: string) {
  try {
    // Validate CSRF token
    const isCsrfValid = await validateCSRFTokenFromRequest(csrfToken)
    if (!isCsrfValid) {
      throw createCSRFError()
    }

    const sanitizedInventoryName = sanitizeString(inventoryName)

    await sql`
      DELETE FROM warehouse_inventory 
      WHERE location = ${sanitizedInventoryName}
    `

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deleting warehouse inventory:", error)
    if (error.message?.includes("CSRF")) {
      return { success: false, error: "خطأ أمني: رمز الحماية غير صحيح" }
    }
    return { success: false, error: error.message }
  }
}

export async function getWarehouseMovements(warehouseName?: string, itemName?: string) {
  try {
    let data
    if (warehouseName && itemName) {
      data = await sql`
        SELECT * FROM warehouse_movements 
        WHERE warehouse_name = ${warehouseName} AND item_name = ${itemName}
        ORDER BY created_at DESC
      `
    } else if (warehouseName) {
      data = await sql`
        SELECT * FROM warehouse_movements 
        WHERE warehouse_name = ${warehouseName}
        ORDER BY created_at DESC
      `
    } else {
      data = await sql`
        SELECT * FROM warehouse_movements 
        ORDER BY created_at DESC
        LIMIT 100
      `
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Error fetching warehouse movements:", error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function updateInventoryQuantity(itemId: number, type: "received" | "delivered", delta: number) {
  try {
    console.log(`[v0] Updating ${type} for item ${itemId} by ${delta}`)

    const currentItem = await sql`
      SELECT * FROM warehouse_inventory 
      WHERE id = ${itemId}
    `

    if (!currentItem || currentItem.length === 0) {
      return { success: false, error: "الصنف غير موجود" }
    }

    const item = currentItem[0]
    let receivedQty = Number(item.received_quantity || 0)
    let deliveredQty = Number(item.delivered_quantity || 0)
    const previousTotalQty = Number(item.quantity || 0)

    if (type === "received" && delta > 0) {
      receivedQty += delta
    } else if (type === "delivered" && delta > 0) {
      deliveredQty += delta
    } else {
      return { success: false, error: "عملية غير مسموحة" }
    }

    const remainingQty = receivedQty - deliveredQty

    const result = await sql`
      UPDATE warehouse_inventory 
      SET 
        received_quantity = ${receivedQty},
        delivered_quantity = ${deliveredQty},
        quantity = ${remainingQty}
      WHERE id = ${itemId}
      RETURNING *
    `

    await sql`
      INSERT INTO warehouse_movements (
        warehouse_name, item_name, movement_type, quantity, 
        previous_quantity, new_quantity, notes
      ) VALUES (
        ${item.warehouse_name}, ${item.item_name}, ${type}, ${delta},
        ${previousTotalQty}, ${remainingQty},
        ${type === "received" ? "إضافة كمية مستلمة" : "إضافة كمية مسلمة"}
      )
    `


    return { success: true, data: result[0] }
  } catch (error: any) {
    console.error("[v0] Error updating inventory quantity:", error)
    return { success: false, error: error.message }
  }
}

export async function getWarehouseItemsByWarehouseName(warehouseName: string) {
  try {
    const data = await sql`
      SELECT * FROM warehouse_inventory 
      WHERE warehouse_name = ${warehouseName}
      ORDER BY created_at DESC
    `

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Error fetching warehouse items by warehouse name:", error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function getGroupedWarehouses() {
  try {
    const data = await sql`
      SELECT 
        warehouse_name,
        COUNT(*) as item_count,
        SUM(received_quantity) as total_received,
        SUM(delivered_quantity) as total_delivered,
        SUM(quantity) as total_remaining
      FROM warehouse_inventory 
      WHERE warehouse_name IS NOT NULL
      GROUP BY warehouse_name
      ORDER BY MAX(created_at) DESC
    `

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Error fetching grouped warehouses:", error)
    return { success: false, error: error.message, data: [] }
  }
}
