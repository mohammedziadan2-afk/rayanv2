"use client"

import { useEffect, useState } from "react"
import { Bell, X, Clock, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getNotifications, type Notification } from "@/app/actions/notifications"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import { ar } from "date-fns/locale"
import Link from "next/link"

export function NotificationBubble() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const hasShownInSession = sessionStorage.getItem("notificationBubbleShown")

    if (hasShownInSession) {
      return
    }

    const loadNotifications = async () => {
      const data = await getNotifications()
      if (data.length > 0) {
        setNotifications(data.slice(0, 5))
        setIsVisible(true)

        sessionStorage.setItem("notificationBubbleShown", "true")

        setTimeout(() => {
          setIsVisible(false)
        }, 3000)
      }
    }

    loadNotifications()
  }, [])

  const getNotificationStyle = (dueDate: string) => {
    const date = new Date(dueDate)
    if (isPast(date)) {
      return {
        bg: "bg-gradient-to-r from-red-500/10 to-red-600/10",
        border: "border-red-500/30",
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
        badge: "bg-red-500 text-white",
        badgeText: "متأخر",
      }
    } else if (isToday(date)) {
      return {
        bg: "bg-gradient-to-r from-orange-500/10 to-amber-600/10",
        border: "border-orange-500/30",
        icon: <Clock className="w-4 h-4 text-orange-500" />,
        badge: "bg-orange-500 text-white",
        badgeText: "اليوم",
      }
    } else if (isTomorrow(date)) {
      return {
        bg: "bg-gradient-to-r from-blue-500/10 to-blue-600/10",
        border: "border-blue-500/30",
        icon: <Clock className="w-4 h-4 text-blue-500" />,
        badge: "bg-blue-500 text-white",
        badgeText: "غداً",
      }
    }
    return {
      bg: "bg-gradient-to-r from-green-500/10 to-emerald-600/10",
      border: "border-green-500/30",
      icon: <Clock className="w-4 h-4 text-green-500" />,
      badge: "bg-green-500 text-white",
      badgeText: "قريباً",
    }
  }

  if (!isVisible || notifications.length === 0) return null

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-500">
      <Card className="w-96 max-w-[calc(100vw-2rem)] p-0 overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-xl">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-6 h-6 text-white animate-pulse" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">التنبيهات</h3>
                <p className="text-xs text-white/80">لديك {notifications.length} تنبيهات جديدة</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {notifications.map((notification) => {
            const style = getNotificationStyle(notification.due_date)
            return (
              <div
                key={notification.id}
                className={`p-3 rounded-xl border ${style.border} ${style.bg} backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{style.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                        {notification.title}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${style.badge}`}
                      >
                        {style.badgeText}
                      </span>
                    </div>
                    {notification.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{notification.description}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(notification.due_date), "dd MMM yyyy", { locale: ar })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="p-4 pt-0">
          <Link href="/notifications" className="block">
            <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
              عرض جميع التنبيهات ({notifications.length})
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
