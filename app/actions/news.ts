"use server"

import { sql } from "@/lib/neon/server"

export type NewsCategory = "general" | "tracking"

export interface News {
  id: number
  title: string
  content: string
  is_active: boolean
  category: NewsCategory
  created_at: string
  updated_at: string
}

export async function getActiveNews(): Promise<News[]> {
  try {
    const news = await sql`
      SELECT * FROM news 
      WHERE is_active = true 
        AND (category = 'general' OR category IS NULL)
      ORDER BY created_at DESC
    `
    return news as News[]
  } catch (error) {
    return []
  }
}

export async function getActiveTrackingNews(): Promise<News[]> {
  try {
    const news = await sql`
      SELECT * FROM news 
      WHERE is_active = true 
        AND category = 'tracking'
      ORDER BY created_at DESC
    `
    return news as News[]
  } catch (error) {
    return []
  }
}

export async function getAllNews(): Promise<News[]> {
  try {
    const news = await sql`
      SELECT * FROM news 
      ORDER BY created_at DESC
    `
    return news as News[]
  } catch (error) {
    return []
  }
}

export async function createNews(newsData: {
  title: string
  content: string
  is_active?: boolean
  category?: NewsCategory
}): Promise<News | null> {
  try {
    const [newNews] = await sql`
      INSERT INTO news (title, content, is_active, category)
      VALUES (${newsData.title}, ${newsData.content}, ${newsData.is_active !== false}, ${newsData.category || "general"})
      RETURNING *
    `
    return newNews as News
  } catch (error) {
    return null
  }
}

export async function updateNews(id: number, updates: Partial<News>): Promise<boolean> {
  try {
    await sql`
      UPDATE news 
      SET 
        title = COALESCE(${updates.title}, title),
        content = COALESCE(${updates.content}, content),
        is_active = COALESCE(${updates.is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
    `
    return true
  } catch (error) {
    console.error("Error updating news:", error)
    return false
  }
}

export async function deleteNews(id: number): Promise<boolean> {
  try {
    await sql`DELETE FROM news WHERE id = ${id}`
    return true
  } catch (error) {
    console.error("Error deleting news:", error)
    return false
  }
}
