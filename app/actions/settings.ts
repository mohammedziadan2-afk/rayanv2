"use server"

import { sql } from "@/lib/neon/server"
import { revalidatePath } from "next/cache"
import { cache } from "@/lib/cache"

export async function getSetting(key: string): Promise<string | null> {
  try {
    // Check cache first
    const cacheKey = `setting_${key}`
    const cached = cache.get<string>(cacheKey)
    if (cached !== null) return cached

    const result = await sql`
      SELECT value FROM app_settings WHERE key = ${key} LIMIT 1
    `

    const value = result[0]?.value || null
    if (value) {
      cache.set(cacheKey, value, 300) // Cache for 5 minutes
    }
    return value
  } catch (error) {
    console.error("Error getting setting:", error)
    return null
  }
}

export async function setSetting(
  key: string,
  value: string,
  description?: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await sql`
      INSERT INTO app_settings (key, value, description, updated_at)
      VALUES (${key}, ${value}, ${description || null}, NOW())
      ON CONFLICT (key) 
      DO UPDATE SET value = ${value}, updated_at = NOW()
    `

    // Invalidate cache
    cache.delete(`setting_${key}`)
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error setting value:", error)
    return { success: false, message: "فشل في حفظ الإعداد" }
  }
}

export async function getShekelRate(): Promise<number> {
  const rate = await getSetting("shekel_rate")
  return rate ? Number.parseFloat(rate) : 0.77 // Default rate
}

export async function setShekelRate(rate: number): Promise<{ success: boolean; message?: string }> {
  return setSetting("shekel_rate", rate.toString(), "سعر الشيكل مقابل الدينار الأردني")
}
