"use client"

import { useEffect, useState } from "react"
import { getActiveTrackingNews, type News } from "@/app/actions/news"
import { AlertTriangle } from "lucide-react"

export function TrackingNewsBanner() {
  const [news, setNews] = useState<News[]>([])

  useEffect(() => {
    let active = true
    getActiveTrackingNews()
      .then((data) => {
        if (active) setNews(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  if (news.length === 0) return null

  const items = (
    <span className="inline-flex items-center" dir="rtl">
      {news.map((item, index) => (
        <span key={`${item.id}-${index}`} className="inline-flex items-center">
          <span className="whitespace-nowrap text-sm font-semibold leading-relaxed text-slate-800 md:text-base">
            {item.content || item.title}
          </span>
          <span className="mx-6 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
        </span>
      ))}
    </span>
  )

  return (
    <section aria-label="أخبار مهمة" dir="rtl" className="border-b border-red-200 bg-red-50">
      <div className="container mx-auto flex items-stretch gap-0 px-0">
        {/* Heading label */}
        <div className="flex flex-shrink-0 items-center gap-2 bg-gradient-to-l from-red-600 to-rose-600 px-4 py-2 text-white shadow-md">
          <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 animate-pulse" />
          <span className="whitespace-nowrap text-xs font-bold md:text-sm">مهم جداً</span>
        </div>

        {/* Marquee ticker */}
        <div className="relative flex-1 overflow-hidden" dir="ltr">
          <div
            className="inline-flex items-center whitespace-nowrap py-2"
            style={{
              willChange: "transform",
              animation: "marquee-seamless 18s linear infinite",
            }}
          >
            <span className="inline-flex items-center px-4">{items}</span>
            <span className="inline-flex items-center px-4" aria-hidden="true">
              {items}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
