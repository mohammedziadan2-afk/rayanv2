"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Check if the current environment is a real browser
function isRealBrowser(): boolean {
  if (typeof window === "undefined") return false
  
  // Check for headless browser indicators
  if (navigator.webdriver) return false
  
  // Check if plugins exist (real browsers have plugins)
  if (navigator.plugins.length === 0 && !/Mobile|Android/i.test(navigator.userAgent)) return false
  
  // Check for automation tools
  const automationIndicators = [
    (window as any).phantom,
    (window as any).__nightmare,
    (window as any).callPhantom,
    (window as any)._phantom,
    (document as any).__selenium_unwrapped,
    (document as any).__webdriver_evaluate,
    (document as any).__driver_evaluate,
  ]
  
  if (automationIndicators.some(indicator => indicator !== undefined)) return false
  
  // Check for valid screen dimensions
  if (window.screen.width === 0 || window.screen.height === 0) return false
  
  // Check for valid language
  if (!navigator.language || navigator.language === "") return false
  
  return true
}

// Skip tracking for admin pages
function shouldTrack(pathname: string): boolean {
  const skipPaths = [
    "/admin",
    "/login",
    "/api",
    "/drivers",
    "/finance",
    "/warehouse",
    "/settings",
    "/reports",
    "/shipments-tracking",
    "/debts",
    "/notifications",
    "/trips-table",
    "/trip-parcels",
    "/expenses",
  ]
  
  return !skipPaths.some(path => pathname.startsWith(path))
}

export function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Only track real browser visits
        if (!isRealBrowser()) return
        
        // Skip admin/internal pages - only track public pages
        if (!shouldTrack(pathname)) return
        
        // Generate or get session ID
        let sessionId = sessionStorage.getItem("visitor_session_id")
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          sessionStorage.setItem("visitor_session_id", sessionId)
        }

        // Throttle: Only track once per page per session (avoid duplicate tracking)
        const lastTrackedPage = sessionStorage.getItem("last_tracked_page")
        const lastTrackedTime = sessionStorage.getItem("last_tracked_time")
        const now = Date.now()
        
        // Skip if same page was tracked in the last 30 seconds
        if (lastTrackedPage === pathname && lastTrackedTime && (now - parseInt(lastTrackedTime)) < 30000) {
          return
        }

        // Use requestIdleCallback for non-blocking tracking (or setTimeout fallback)
        const scheduleTracking = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1000))
        
        scheduleTracking(async () => {
          try {
            await fetch("/api/track-visitor", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept-Language": navigator.language,
              },
              body: JSON.stringify({
                page: pathname,
                referrer: document.referrer || null,
                sessionId,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              }),
            })
            
            // Update tracking state
            sessionStorage.setItem("last_tracked_page", pathname)
            sessionStorage.setItem("last_tracked_time", now.toString())
          } catch {
            // Silently fail
          }
        })
      } catch {
        // Silently fail - don't affect user experience
      }
    }

    trackVisit()
  }, [pathname])

  return null
}
