// Navigation cache for faster page transitions
const navigationCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function setNavigationCache(key: string, data: unknown) {
  navigationCache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

export function getNavigationCache<T>(key: string): T | null {
  const cached = navigationCache.get(key)
  if (!cached) return null
  
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    navigationCache.delete(key)
    return null
  }
  
  return cached.data as T
}

export function clearNavigationCache(key?: string) {
  if (key) {
    navigationCache.delete(key)
  } else {
    navigationCache.clear()
  }
}

export function invalidateNavigationCache(pattern: string) {
  for (const key of navigationCache.keys()) {
    if (key.includes(pattern)) {
      navigationCache.delete(key)
    }
  }
}

// Preload common routes data
export const commonRoutes = [
  "/admin",
  "/shipments-tracking",
  "/drivers",
  "/finance",
  "/warehouse",
  "/trips-table",
]
