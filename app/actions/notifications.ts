"use server"

import { sql } from "@/lib/neon/server"

export interface Notification {
  id: number
  title: string
  description?: string
  due_date: string
  status: "pending" | "completed"
  created_at: string
  updated_at: string
  completed_at?: string
}

export async function getNotifications(): Promise<Notification[]> {
  try {
    const notifications = await sql`
      SELECT 
        id,
        title,
        message as description,
        created_at as due_date,
        CASE WHEN is_read THEN 'completed' ELSE 'pending' END as status,
        created_at,
        created_at as updated_at,
        CASE WHEN is_read THEN created_at ELSE NULL END as completed_at
      FROM notifications 
      WHERE is_read = false
      ORDER BY created_at DESC
    `
    return notifications as Notification[]
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

export async function createNotification(notification: {
  title: string
  description?: string
  due_date: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      INSERT INTO notifications (title, message, type, is_read)
      VALUES (${notification.title}, ${notification.description || ""}, 'info', false)
    `
    return { success: true }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { success: false, error: "فشل في إضافة التنبيه" }
  }
}

export async function completeNotification(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      UPDATE notifications 
      SET is_read = true
      WHERE id = ${id}
    `
    return { success: true }
  } catch (error) {
    console.error("Error completing notification:", error)
    return { success: false, error: "فشل في تحديث التنبيه" }
  }
}

export async function deleteNotification(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      DELETE FROM notifications WHERE id = ${id}
    `
    return { success: true }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return { success: false, error: "فشل في حذف التنبيه" }
  }
}
