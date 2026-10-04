import { createServiceClient } from "@/lib/supabase/service"

export type LogLevel = "info" | "warn" | "error" | "debug"

export interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, any>
  timestamp: string
  userId?: string
  action?: string
}

class Logger {
  private logToDatabase(entry: LogEntry) {
    if (typeof window === "undefined") {
      // Server-side only
      this.logToDatabaseAsync(entry).catch((err) => {
        console.error("[Logger] Failed to log to database:", err)
      })
    }
  }

  private async logToDatabaseAsync(entry: LogEntry) {
    try {
      const supabase = createServiceClient()
      await supabase.from("security_logs").insert({
        action: entry.action || entry.level,
        user_id: entry.userId || null,
        ip_address: "system",
        user_agent: "logger",
        details: {
          level: entry.level,
          message: entry.message,
          context: entry.context,
        },
        timestamp: entry.timestamp,
      })
    } catch (error) {
      console.error("[Logger] Failed to log to database:", error)
    }
  }

  info(message: string, context?: Record<string, any>, userId?: string) {
    const entry: LogEntry = {
      level: "info",
      message,
      context,
      timestamp: new Date().toISOString(),
      userId,
      action: "info",
    }
    console.log(`[INFO] ${message}`, context || "")
    this.logToDatabase(entry)
  }

  warn(message: string, context?: Record<string, any>, userId?: string) {
    const entry: LogEntry = {
      level: "warn",
      message,
      context,
      timestamp: new Date().toISOString(),
      userId,
      action: "warning",
    }
    console.warn(`[WARN] ${message}`, context || "")
    this.logToDatabase(entry)
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>, userId?: string) {
    const entry: LogEntry = {
      level: "error",
      message,
      context: {
        ...context,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      },
      timestamp: new Date().toISOString(),
      userId,
      action: "error",
    }
    console.error(`[ERROR] ${message}`, entry.context)
    this.logToDatabase(entry)
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEBUG] ${message}`, context || "")
    }
  }

  // سجل عمليات المستخدم المهمة
  logUserAction(action: string, userId: string, details?: Record<string, any>) {
    this.info(`User action: ${action}`, details, userId)
  }

  // سجل الأخطاء الحرجة
  logCriticalError(message: string, error: Error, context?: Record<string, any>) {
    this.error(`CRITICAL: ${message}`, error, { ...context, critical: true })
  }
}

export const logger = new Logger()
