"use server"

import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// List of known bot user agents
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python/i,
  /java/i,
  /php/i,
  /go-http/i,
  /headless/i,
  /phantom/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /baiduspider/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /discordbot/i,
  /applebot/i,
  /duckduckbot/i,
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /dataforseo/i,
  /bytespider/i,
  /gptbot/i,
  /chatgpt/i,
  /claudebot/i,
  /anthropic/i,
  /ccbot/i,
  /amazonbot/i,
  /uptimerobot/i,
  /pingdom/i,
  /statuscake/i,
  /monitoring/i,
  /health/i,
  /probe/i,
  /check/i,
  /test/i,
  /postman/i,
  /insomnia/i,
  /httpie/i,
  /axios/i,
  /node-fetch/i,
  /undici/i,
  /got\//i,
  /request\//i,
  /libwww/i,
  /lwp-/i,
  /apache-http/i,
  /okhttp/i,
  /dalvik/i,
  /cfnetwork/i,
  /darwin/i,
]

// Check if user agent is a bot
function isBot(userAgent: string): boolean {
  if (!userAgent || userAgent.length < 10) return true
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent))
}

// Check if the request looks suspicious
function isSuspiciousRequest(request: NextRequest, userAgent: string): boolean {
  // No user agent or very short one
  if (!userAgent || userAgent.length < 20) return true
  
  // Missing common browser headers
  const acceptLanguage = request.headers.get("accept-language")
  const accept = request.headers.get("accept")
  
  // Real browsers always send accept-language
  if (!acceptLanguage) return true
  
  // Check for suspicious patterns
  if (userAgent.includes("compatible;") && !userAgent.includes("Mozilla")) return true
  
  return false
}

// Parse user agent to get device, browser, and OS info
function parseUserAgent(ua: string) {
  const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? "Mobile" : "Desktop"
  
  let browser = "Unknown"
  if (ua.includes("Firefox")) browser = "Firefox"
  else if (ua.includes("Edg")) browser = "Edge"
  else if (ua.includes("Chrome")) browser = "Chrome"
  else if (ua.includes("Safari")) browser = "Safari"
  else if (ua.includes("Opera")) browser = "Opera"
  
  let os = "Unknown"
  if (ua.includes("Windows")) os = "Windows"
  else if (ua.includes("Mac")) os = "macOS"
  else if (ua.includes("Linux")) os = "Linux"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"
  
  return { device, browser, os }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { page, referrer, sessionId } = body
    
    // Get user agent first for bot check
    const userAgent = request.headers.get("user-agent") || ""
    
    // Filter out bots and suspicious requests
    if (isBot(userAgent)) {
      return NextResponse.json({ success: true, tracked: false, reason: "bot" })
    }
    
    if (isSuspiciousRequest(request, userAgent)) {
      return NextResponse.json({ success: true, tracked: false, reason: "suspicious" })
    }
    
    // Get IP from headers
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown"
    
    // Skip tracking for localhost/internal IPs
    if (ip === "127.0.0.1" || ip === "::1" || ip === "unknown" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
      return NextResponse.json({ success: true, tracked: false, reason: "internal" })
    }
    
    const { device, browser, os } = parseUserAgent(userAgent)
    
    // Combined query: Check exclusion, recent visit, and unique status in one query
    const [checkResult] = await sql`
      SELECT 
        EXISTS(SELECT 1 FROM excluded_ips WHERE ip_address = ${ip}) as is_excluded,
        EXISTS(SELECT 1 FROM site_visitors WHERE ip_address = ${ip} AND visit_timestamp > NOW() - INTERVAL '30 minutes') as recent_visit,
        NOT EXISTS(SELECT 1 FROM site_visitors WHERE ip_address = ${ip} AND visit_timestamp > NOW() - INTERVAL '24 hours') as is_unique
    `
    
    if (checkResult.is_excluded) {
      return NextResponse.json({ success: true, tracked: false, reason: "excluded" })
    }
    
    if (checkResult.recent_visit) {
      return NextResponse.json({ success: true, tracked: false, reason: "duplicate" })
    }
    
    const isUnique = checkResult.is_unique
    
    // Get geo info from IP (using free IP API) - with shorter timeout and non-blocking
    let country = "Unknown"
    let city = "Unknown"
    let region = "Unknown"
    
    // Try to get geo info with short timeout (don't block response)
    try {
      const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`, {
        signal: AbortSignal.timeout(1000)
      })
      if (geoResponse.ok) {
        const geoData = await geoResponse.json()
        if (geoData.status === "success") {
          country = geoData.country || "Unknown"
          city = geoData.city || "Unknown"
          region = geoData.regionName || "Unknown"
        }
      }
    } catch {
      // Geo lookup failed, continue with defaults
    }
    
    // Insert visitor record
    await sql`
      INSERT INTO site_visitors (
        ip_address, country, city, region, user_agent, 
        device_type, browser, os, referrer, page_visited, 
        session_id, is_unique
      ) VALUES (
        ${ip}, ${country}, ${city}, ${region}, ${userAgent},
        ${device}, ${browser}, ${os}, ${referrer || null}, ${page || "/"},
        ${sessionId || null}, ${isUnique}
      )
    `
    
    return NextResponse.json({ success: true, tracked: true })
  } catch (error) {
    console.error("Error tracking visitor:", error)
    return NextResponse.json({ success: false, error: "Failed to track visitor" }, { status: 500 })
  }
}
