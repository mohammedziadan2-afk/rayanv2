// Simple in-memory cache - Note: This only works within a single request on serverless
// For cross-request caching, use Next.js unstable_cache or external cache like Redis
type CacheEntry<T> = {
  data: T
  timestamp: number
  ttl: number
}

const cacheStore = new Map<string, CacheEntry<unknown>>()

class SimpleCache {
  private cache: Map<string, CacheEntry<unknown>> = cacheStore

  set<T>(key: string, data: T, ttlSeconds = 60): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  // Invalidate all entries that match a pattern
  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }
}

// Export singleton instance
export const cache = new SimpleCache()

export const CACHE_KEYS = {
  DRIVERS_LIST: "drivers_list",
  DRIVER_DETAIL: (id: string) => `driver_${id}`,
  DRIVER_TASKS: (driverId: string) => `driver_tasks_${driverId}`,
  DRIVER_SESSIONS: (driverId: string) => `driver_sessions_${driverId}`,
  SESSION_TASKS: (sessionId: string) => `session_tasks_${sessionId}`,
  SHIPMENTS_LIST: "shipments_list",
  TRIPS_LIST: "trips_list",
  COMPANY_INFO: "company_info",
  SHEKEL_RATE: "setting_shekel_rate",
}

export function invalidateDriverCache(driverId?: string) {
  if (driverId) {
    cache.invalidatePattern(`driver_tasks_${driverId}`)
    cache.invalidatePattern(`driver_sessions_${driverId}`)
  }
  cache.delete(CACHE_KEYS.DRIVERS_LIST)
}
