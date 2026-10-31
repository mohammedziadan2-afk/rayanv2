"use server"

import { sql } from "@/lib/db"

export type AuditAction = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'SHIPMENT_CREATED'
  | 'SHIPMENT_UPDATED'
  | 'SHIPMENT_DELETED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'SETTINGS_CHANGED'
  | 'SUBSCRIBER_LOGIN'
  | 'SUBSCRIBER_LOGIN_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

interface AuditLogEntry {
  action: AuditAction
  userId?: number | string
  userType?: 'admin' | 'subscriber' | 'system'
  targetId?: string
  targetType?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  severity?: AuditSeverity
}

// In-memory buffer for batch logging (more efficient)
const auditBuffer: AuditLogEntry[] = []
let flushTimeout: NodeJS.Timeout | null = null

// Determine severity based on action
function getSeverity(action: AuditAction): AuditSeverity {
  const criticalActions: AuditAction[] = [
    'LOGIN_FAILED', 
    'SUBSCRIBER_LOGIN_FAILED',
    'RATE_LIMIT_EXCEEDED', 
    'SUSPICIOUS_ACTIVITY',
    'USER_DELETED',
    'PASSWORD_CHANGE'
  ]
  const warningActions: AuditAction[] = [
    'SETTINGS_CHANGED',
    'USER_UPDATED',
    'SHIPMENT_DELETED',
  ]
  
  if (criticalActions.includes(action)) return 'CRITICAL'
  if (warningActions.includes(action)) return 'WARNING'
  return 'INFO'
}

// Sanitize details to remove sensitive data
function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!details) return undefined
  
  const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'api_key', 'credit_card']
  const sanitized = { ...details }
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]'
    }
  }
  
  return sanitized
}

// Log an audit entry
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  const severity = entry.severity || getSeverity(entry.action)
  const sanitizedDetails = sanitizeDetails(entry.details)
  
  // For critical events, log immediately
  if (severity === 'CRITICAL') {
    await writeAuditLog({
      ...entry,
      severity,
      details: sanitizedDetails,
      timestamp: new Date().toISOString()
    })
    return
  }
  
  // Buffer non-critical events
  auditBuffer.push({
    ...entry,
    severity,
    details: sanitizedDetails
  })
  
  // Schedule flush if not already scheduled
  if (!flushTimeout) {
    flushTimeout = setTimeout(flushAuditBuffer, 5000) // Flush every 5 seconds
  }
}

// Write single audit log to database
async function writeAuditLog(entry: AuditLogEntry & { timestamp: string }): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_logs (
        action, user_id, user_type, target_id, target_type, 
        details, ip_address, user_agent, severity, created_at
      ) VALUES (
        ${entry.action},
        ${entry.userId?.toString() || null},
        ${entry.userType || 'system'},
        ${entry.targetId || null},
        ${entry.targetType || null},
        ${JSON.stringify(entry.details || {})},
        ${entry.ipAddress || null},
        ${entry.userAgent || null},
        ${entry.severity || 'INFO'},
        ${entry.timestamp}
      )
    `
  } catch (error) {
    // Don't let audit logging break the application
    console.error('[Audit] Failed to write log:', error)
  }
}

// Flush buffered audit logs
async function flushAuditBuffer(): Promise<void> {
  flushTimeout = null
  
  if (auditBuffer.length === 0) return
  
  const entries = [...auditBuffer]
  auditBuffer.length = 0
  
  const timestamp = new Date().toISOString()
  
  try {
    // Batch insert for efficiency
    for (const entry of entries) {
      await writeAuditLog({ ...entry, timestamp })
    }
  } catch (error) {
    console.error('[Audit] Failed to flush buffer:', error)
    // Re-add entries to buffer for retry
    auditBuffer.push(...entries)
  }
}

// Get recent audit logs (for admin dashboard)
export async function getRecentAuditLogs(limit = 100, severity?: AuditSeverity): Promise<unknown[]> {
  try {
    if (severity) {
      return await sql`
        SELECT * FROM audit_logs 
        WHERE severity = ${severity}
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `
    }
    return await sql`
      SELECT * FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `
  } catch {
    return []
  }
}

// Get audit logs for specific user
export async function getUserAuditLogs(userId: string | number, limit = 50): Promise<unknown[]> {
  try {
    return await sql`
      SELECT * FROM audit_logs 
      WHERE user_id = ${userId.toString()}
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `
  } catch {
    return []
  }
}
