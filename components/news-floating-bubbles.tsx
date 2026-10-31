"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { getActiveNews, type News } from "@/app/actions/news"
import { Sparkles, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const linkifyText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      )
    }
    return <span key={index}>{part}</span>
  })
}

export function NewsFloatingBubbles({
  triggerClassName,
  triggerContent,
}: { triggerClassName?: string; triggerContent?: React.ReactNode } = {}) {
  const [news, setNews] = useState<News[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBubbles, setShowBubbles] = useState(false)
  const [selectedNews, setSelectedNews] = useState<News | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isNewsOpen, setIsNewsOpen] = useState(false)
  const bubblesContainerRef = useRef<HTMLDivElement>(null)

  // Load news only when button is clicked (lazy loading)
  const loadNewsOnDemand = async () => {
    if (news.length === 0 && isLoading) {
      await loadNews()
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showBubbles &&
        !isNewsOpen &&
        bubblesContainerRef.current &&
        !bubblesContainerRef.current.contains(event.target as Node)
      ) {
        setShowBubbles(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showBubbles, isNewsOpen])

  const loadNews = async () => {
    try {
      const data = await getActiveNews()
      setNews(data)
    } catch (error) {
      console.error("Error loading news:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openNewsDialog = (newsItem: News) => {
    setSelectedNews(newsItem)
    setIsDialogOpen(true)
    setIsNewsOpen(true)
  }

  const closeNewsDialog = () => {
    setIsDialogOpen(false)
    setIsNewsOpen(false)
  }

  const bubblePositions = [
    { top: "15%", left: "5%", delay: "0s", duration: "15s" },
    { top: "15%", right: "5%", delay: "2s", duration: "18s" },
    { top: "45%", left: "5%", delay: "4s", duration: "20s" },
    { top: "45%", right: "5%", delay: "1s", duration: "16s" },
    { top: "75%", left: "35%", delay: "3s", duration: "19s" },
  ]

  return (
    <>
      <div ref={bubblesContainerRef} className="relative inline-block w-full">
        <button
          onClick={() => {
            setShowBubbles(!showBubbles)
            loadNewsOnDemand()
          }}
          className={
            triggerClassName ??
            "w-full h-16 px-4 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-500 shadow-lg hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 cursor-pointer hover:scale-105 flex items-center justify-center"
          }
        >
          {triggerContent ? (
            triggerContent
          ) : triggerClassName ? (
            <>
              <Sparkles className="w-4 h-4" />
              أخبار الجسر
            </>
          ) : (
            <div className="flex items-center gap-2 justify-center">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
              <p className="text-sm font-bold text-white">أخبار الجسر</p>
            </div>
          )}
        </button>

        {showBubbles && !isNewsOpen && news.length === 0 && !isLoading && (
          <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 pointer-events-auto z-50">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-cyan-200/50 max-w-sm">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-6 h-6 text-cyan-500" />
                <h3 className="font-bold text-lg text-gray-900">لا توجد أخبار حالياً</h3>
              </div>
              <p className="text-gray-600 text-sm">سيتم نشر آخر الأخبار والتحديثات هنا</p>
            </div>
          </div>
        )}

        {showBubbles &&
          !isNewsOpen &&
          news.slice(0, 5).map((item, index) => {
            const position = bubblePositions[index % bubblePositions.length]
            const colors = [
              "from-sky-400 to-cyan-500",
              "from-cyan-400 to-teal-500",
              "from-emerald-400 to-green-500",
              "from-blue-400 to-sky-500",
              "from-teal-400 to-cyan-500",
            ]
            const color = colors[index % colors.length]

            return (
              <div
                key={item.id}
                className="fixed pointer-events-auto animate-bubble-from-title z-50"
                style={{
                  top: position.top,
                  left: position.left,
                  right: position.right,
                  animationDelay: `${index * 0.15}s`,
                }}
              >
                <div
                  className="group relative hover:scale-110 transition-transform duration-300 cursor-pointer"
                  style={{
                    animation: `float-bubble-small ${position.duration} ease-in-out infinite`,
                    animationDelay: position.delay,
                  }}
                  onClick={() => openNewsDialog(item)}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${color} rounded-full blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-300 animate-pulse`}
                  />

                  <div
                    className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br ${color} shadow-2xl flex items-center justify-center p-3 border-4 border-white/30 group-hover:border-white/50 transition-all duration-300`}
                  >
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    </div>

                    <div className="text-center">
                      <p className="text-white font-bold text-xs md:text-sm leading-tight line-clamp-4 group-hover:line-clamp-none transition-all duration-300">
                        {item.title}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeNewsDialog()}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              {selectedNews && linkifyText(selectedNews.title)}
            </DialogTitle>
          </DialogHeader>

          {selectedNews && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200">
                <p className="text-base leading-relaxed whitespace-pre-wrap">{linkifyText(selectedNews.content)}</p>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  تاريخ النشر:{" "}
                  {new Date(selectedNews.created_at).toLocaleDateString("ar-JO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {selectedNews.priority && (
                  <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold">عاجل</span>
                )}
              </div>

              <Button onClick={closeNewsDialog} className="w-full bg-transparent" variant="outline">
                <X className="w-4 h-4 ml-2" />
                إغلاق
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
