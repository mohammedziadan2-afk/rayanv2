"use client"

import { useState, useEffect } from "react"
import { NewsContent } from "@/components/news-content"
import { getAllNews, type News } from "@/app/actions/news"
import { AdminFooter } from "@/components/admin-footer"

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    setLoading(true)
    const data = await getAllNews()
    setNews(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent">
            آخر الأخبار
          </h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة الأخبار العاجلة والإعلانات</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <NewsContent news={news} onUpdate={loadNews} />
        )}
      </div>

      <AdminFooter backUrl="/admin" backLabel="الإدارة" />
    </div>
  )
}
