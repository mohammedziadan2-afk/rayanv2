"use server"

import { sql } from "@/lib/db"

export async function getVisitorStats() {
  try {
    // Total visits
    const totalVisits = await sql`SELECT COUNT(*) as count FROM site_visitors`
    
    // Unique visitors (based on is_unique flag)
    const uniqueVisitors = await sql`SELECT COUNT(*) as count FROM site_visitors WHERE is_unique = true`
    
    // Today's visits
    const todayVisits = await sql`
      SELECT COUNT(*) as count FROM site_visitors 
      WHERE DATE(visit_timestamp) = CURRENT_DATE
    `
    
    // This week's visits
    const weekVisits = await sql`
      SELECT COUNT(*) as count FROM site_visitors 
      WHERE visit_timestamp >= NOW() - INTERVAL '7 days'
    `
    
    // This month's visits
    const monthVisits = await sql`
      SELECT COUNT(*) as count FROM site_visitors 
      WHERE visit_timestamp >= NOW() - INTERVAL '30 days'
    `
    
    // Visits by country
    const byCountry = await sql`
      SELECT country, COUNT(*) as count 
      FROM site_visitors 
      GROUP BY country 
      ORDER BY count DESC 
      LIMIT 10
    `
    
    // Visits by device
    const byDevice = await sql`
      SELECT device_type, COUNT(*) as count 
      FROM site_visitors 
      GROUP BY device_type 
      ORDER BY count DESC
    `
    
    // Visits by browser
    const byBrowser = await sql`
      SELECT browser, COUNT(*) as count 
      FROM site_visitors 
      GROUP BY browser 
      ORDER BY count DESC 
      LIMIT 5
    `
    
    // Visits by OS
    const byOS = await sql`
      SELECT os, COUNT(*) as count 
      FROM site_visitors 
      GROUP BY os 
      ORDER BY count DESC 
      LIMIT 5
    `
    
    // Daily visits for last 7 days
    const dailyVisits = await sql`
      SELECT DATE(visit_timestamp) as date, COUNT(*) as count 
      FROM site_visitors 
      WHERE visit_timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(visit_timestamp) 
      ORDER BY date ASC
    `
    
    // Most visited pages
    const byPage = await sql`
      SELECT page_visited, COUNT(*) as count 
      FROM site_visitors 
      GROUP BY page_visited 
      ORDER BY count DESC 
      LIMIT 10
    `
    
    return {
      totalVisits: Number(totalVisits[0]?.count || 0),
      uniqueVisitors: Number(uniqueVisitors[0]?.count || 0),
      todayVisits: Number(todayVisits[0]?.count || 0),
      weekVisits: Number(weekVisits[0]?.count || 0),
      monthVisits: Number(monthVisits[0]?.count || 0),
      byCountry,
      byDevice,
      byBrowser,
      byOS,
      dailyVisits,
      byPage
    }
  } catch (error) {
    console.error("Error getting visitor stats:", error)
    return null
  }
}

export async function getVisitorsList(page = 1, limit = 50) {
  try {
    const offset = (page - 1) * limit
    
    const visitors = await sql`
      SELECT id, ip_address, country, city, device_type, browser, os, 
             page_visited, visit_timestamp, is_unique
      FROM site_visitors 
      ORDER BY visit_timestamp DESC 
      LIMIT ${limit} OFFSET ${offset}
    `
    
    const total = await sql`SELECT COUNT(*) as count FROM site_visitors`
    
    return {
      visitors,
      total: Number(total[0]?.count || 0),
      page,
      totalPages: Math.ceil(Number(total[0]?.count || 0) / limit)
    }
  } catch (error) {
    console.error("Error getting visitors list:", error)
    return { visitors: [], total: 0, page: 1, totalPages: 0 }
  }
}

export async function getExcludedIPs() {
  try {
    const ips = await sql`SELECT * FROM excluded_ips ORDER BY created_at DESC`
    return ips
  } catch (error) {
    console.error("Error getting excluded IPs:", error)
    return []
  }
}

export async function addExcludedIP(ipAddress: string, description?: string) {
  try {
    await sql`
      INSERT INTO excluded_ips (ip_address, description) 
      VALUES (${ipAddress}, ${description || null})
      ON CONFLICT (ip_address) DO NOTHING
    `
    return { success: true }
  } catch (error) {
    console.error("Error adding excluded IP:", error)
    return { success: false, error: "Failed to add IP" }
  }
}

export async function removeExcludedIP(id: number) {
  try {
    await sql`DELETE FROM excluded_ips WHERE id = ${id}`
    return { success: true }
  } catch (error) {
    console.error("Error removing excluded IP:", error)
    return { success: false, error: "Failed to remove IP" }
  }
}

export async function getCurrentVisitorIP() {
  // This will be called from the client to get the current IP
  return { ip: "Check browser console" }
}

export async function resetVisitorStats() {
  try {
    await sql`DELETE FROM site_visitors`
    return { success: true, message: "تم تصفير جميع الإحصائيات بنجاح" }
  } catch (error) {
    console.error("Error resetting visitor stats:", error)
    return { success: false, error: "فشل في تصفير الإحصائيات" }
  }
}
