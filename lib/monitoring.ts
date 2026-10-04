import { createServiceClient } from "@/lib/supabase/service"

export interface PerformanceMetric {
  operation: string
  duration: number
  success: boolean
  timestamp: string
  metadata?: Record<string, any>
}

class Monitor {
  private metrics: PerformanceMetric[] = []

  // قياس أداء العمليات
  async measureOperation<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const startTime = Date.now()
    let success = true

    try {
      const result = await fn()
      return result
    } catch (error) {
      success = false
      throw error
    } finally {
      const duration = Date.now() - startTime
      const metric: PerformanceMetric = {
        operation,
        duration,
        success,
        timestamp: new Date().toISOString(),
        metadata,
      }

      this.metrics.push(metric)

      // تسجيل العمليات البطيئة
      if (duration > 3000) {
        console.warn(`[Monitor] Slow operation detected: ${operation} took ${duration}ms`)
      }

      // إرسال المقاييس إلى قاعدة البيانات كل 10 عمليات
      if (this.metrics.length >= 10) {
        this.flushMetrics()
      }
    }
  }

  private async flushMetrics() {
    if (this.metrics.length === 0) return

    try {
      const metricsToSend = [...this.metrics]
      this.metrics = []

      const supabase = await createServiceClient()
      await supabase.from("security_logs").insert(
        metricsToSend.map((metric) => ({
          action: "performance_metric",
          user_id: null,
          ip_address: "system",
          user_agent: "monitor",
          details: metric,
          timestamp: metric.timestamp,
        })),
      )
    } catch (error) {
      console.error("[Monitor] Failed to flush metrics:", error)
    }
  }

  // الحصول على متوسط أداء عملية معينة
  getAveragePerformance(operation: string): number {
    const operationMetrics = this.metrics.filter((m) => m.operation === operation && m.success)
    if (operationMetrics.length === 0) return 0

    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0)
    return totalDuration / operationMetrics.length
  }

  // التحقق من صحة النظام
  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy"
    checks: Record<string, boolean>
    timestamp: string
  }> {
    const checks: Record<string, boolean> = {}

    // فحص قاعدة البيانات
    try {
      const supabase = await createServiceClient()
      const { error } = await supabase.from("app_users").select("id").limit(1)
      checks.database = !error
    } catch {
      checks.database = false
    }

    // فحص النسخ الاحتياطي
    try {
      const supabase = await createServiceClient()
      const { data, error } = await supabase
        .from("backups")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)

      if (error || !data || data.length === 0) {
        checks.backups = false
      } else {
        const lastBackup = new Date(data[0].created_at)
        const daysSinceBackup = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60 * 24)
        checks.backups = daysSinceBackup < 7 // النسخة الاحتياطية يجب أن تكون خلال 7 أيام
      }
    } catch {
      checks.backups = false
    }

    const failedChecks = Object.values(checks).filter((v) => !v).length
    let status: "healthy" | "degraded" | "unhealthy" = "healthy"

    if (failedChecks === 1) {
      status = "degraded"
    } else if (failedChecks > 1) {
      status = "unhealthy"
    }

    return {
      status,
      checks,
      timestamp: new Date().toISOString(),
    }
  }
}

export const monitor = new Monitor()
