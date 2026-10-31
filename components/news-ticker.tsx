"use client"

import { useState, useEffect } from "react"
import { getActiveNews, type News } from "@/app/actions/news"
import { Megaphone } from "lucide-react"

export function NewsTicker() {
  const defaultNews: News[] = [
    {
      id: "default-1",
      title: "مرحباً بكم في شركة الريان للشحن",
      content: "نوفر خدمات شحن موثوقة وسريعة من الأردن إلى فلسطين",
      status: "active",
      priority: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const [news, setNews] = useState<News[]>(defaultNews)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    try {
      const data = await getActiveNews()
      if (data && data.length > 0) {
        setNews(data)
      }
    } catch (error) {
      console.error("Failed to load news:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const separator = (
    <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border-2 border-white shadow-lg mx-3 md:mx-4">
      <span className="text-red-600 font-bold text-xs md:text-sm">الريان</span>
    </span>
  )

  const newsSequence = (
    <span className="inline-flex items-center">
      {news.map((item, index) => (
        <span key={`${item.id}-${index}`} className="inline-flex items-center">
          <span className="text-xs md:text-sm font-semibold">
            {item.title} • {item.content}
          </span>
          {separator}
        </span>
      ))}
    </span>
  )

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white py-1.5 md:py-2 shadow-lg overflow-hidden">
      <div className="container mx-auto flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2 flex-shrink-0 animate-pulse">
          <Megaphone className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="font-bold text-xs">أخبار عاجلة</span>
        </div>
        <div className="flex-1 overflow-hidden relative min-h-[20px] md:min-h-[24px]">
          <div
            className="animate-marquee-ltr whitespace-nowrap inline-flex items-center"
            style={{ willChange: "transform" }}
          >
            {newsSequence}
            {newsSequence}
            {newsSequence}
          </div>
        </div>
      </div>
    </div>
  )
}
