"use server"

import { sql } from "@/lib/neon/server"
import { revalidatePath } from "next/cache"
import { sanitizeString } from "@/lib/input-sanitizer"
import { handleError } from "@/lib/error-handler"

const messageRateLimits = new Map<string, { count: number; resetTime: number }>()
const MAX_MESSAGES_PER_MINUTE = 5
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function checkMessageRateLimit(identifier: string): boolean {
  const now = Date.now()
  const record = messageRateLimits.get(identifier)

  if (!record || now > record.resetTime) {
    messageRateLimits.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= MAX_MESSAGES_PER_MINUTE) {
    return false
  }

  record.count++
  return true
}

export interface Message {
  id: string
  request_number: string
  sender_name: string
  sender_type: "customer" | "admin"
  message: string
  created_at: string
  read: boolean
}

export async function getMessages(requestId: string) {
  try {
    const sanitizedRequestId = sanitizeString(requestId)
    const numericRequestId = Number.parseInt(sanitizedRequestId)

    if (isNaN(numericRequestId)) {
      throw new Error("Invalid request ID")
    }

    const data = await sql`
      SELECT 
        id::text,
        sender_name,
        sender_type,
        message_content as message,
        status,
        created_at,
        shipping_request_id::text as request_id
      FROM messages 
      WHERE shipping_request_id = ${numericRequestId}
      ORDER BY created_at ASC
    `

    return data as any[]
  } catch (error) {
    console.error("[Security] Error fetching messages:", error)
    return []
  }
}

export async function createMessage(message: Omit<Message, "id" | "created_at" | "read"> & { request_id?: string }) {
  try {
    const rateLimitKey = `msg:${message.request_id || "unknown"}`
    if (!checkMessageRateLimit(rateLimitKey)) {
      throw new Error("تم تجاوز الحد المسموح من الرسائل. يرجى الانتظار قليلاً")
    }

    const sanitizedSenderName = sanitizeString(message.sender_name)
    const sanitizedMessage = sanitizeString(message.message)
    const sanitizedRequestId = message.request_id ? sanitizeString(message.request_id) : "0"
    const numericRequestId = Number.parseInt(sanitizedRequestId)

    if (isNaN(numericRequestId)) {
      throw new Error("Invalid request ID")
    }

    if (sanitizedMessage.length === 0) {
      throw new Error("الرسالة لا يمكن أن تكون فارغة")
    }

    if (sanitizedMessage.length > 1000) {
      throw new Error("الرسالة طويلة جداً. الحد الأقصى 1000 حرف")
    }

    const result = await sql`
      INSERT INTO messages (
        sender_name, sender_type, message_content, status, shipping_request_id, created_at
      ) VALUES (
        ${sanitizedSenderName}, 
        ${message.sender_type}, 
        ${sanitizedMessage}, 
        'unread', 
        ${numericRequestId}, 
        NOW()
      )
      RETURNING *
    `

    revalidatePath("/shipping-requests")
    revalidatePath("/customers")
    revalidatePath(`/track-request/${message.request_number}`)

    return result[0] as any
  } catch (error) {
    const safeError = handleError(error)
    throw new Error(safeError.message)
  }
}

export async function markMessagesAsRead(requestId: string, viewerType: "customer" | "admin") {
  try {
    const sanitizedRequestId = sanitizeString(requestId)
    const numericRequestId = Number.parseInt(sanitizedRequestId)

    if (isNaN(numericRequestId)) {
      throw new Error("Invalid request ID")
    }

    const senderTypeToMarkRead = viewerType === "admin" ? "customer" : "admin"

    await sql`
      UPDATE messages 
      SET status = 'read'
      WHERE shipping_request_id = ${numericRequestId}
      AND sender_type = ${senderTypeToMarkRead}
      AND status = 'unread'
    `

    revalidatePath("/shipping-requests")
    revalidatePath("/customers")
  } catch (error) {
    console.error("[Security] Error marking messages as read:", error)
    throw new Error("Failed to mark messages as read")
  }
}

export async function getUnreadCounts(viewerType: "customer" | "admin") {
  try {
    const senderTypeToCount = viewerType === "admin" ? "customer" : "admin"

    const data = await sql`
      SELECT shipping_request_id::text as request_id, COUNT(*)::int as count
      FROM messages 
      WHERE status = 'unread'
      AND sender_type = ${senderTypeToCount}
      GROUP BY shipping_request_id
    `

    const counts: { [key: string]: number } = {}
    data.forEach((row: any) => {
      counts[row.request_id] = row.count
    })

    return counts
  } catch (error) {
    console.error("[Security] Error fetching unread counts:", error)
    return {}
  }
}

export async function deleteMessage(messageId: string) {
  try {
    const sanitizedMessageId = sanitizeString(messageId)
    const numericMessageId = Number.parseInt(sanitizedMessageId)

    if (isNaN(numericMessageId)) {
      throw new Error("Invalid message ID")
    }

    await sql`
      DELETE FROM messages 
      WHERE id = ${numericMessageId}
    `

    revalidatePath("/shipping-requests")
    revalidatePath("/customers")
  } catch (error) {
    console.error("[Security] Error deleting message:", error)
    throw new Error("Failed to delete message")
  }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, record] of messageRateLimits.entries()) {
    if (now > record.resetTime) {
      messageRateLimits.delete(key)
    }
  }
}, 60 * 1000)
