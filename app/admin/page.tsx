"use client"

import { NotificationBubble } from "@/components/notification-bubble"
import { AddShipmentButton } from "@/components/add-shipment-button"
import { ShekelRateManager } from "@/components/shekel-rate-manager"
import Image from "next/image"
import Link from "next/link"
import {
  Search,
  Package,
  Settings,
  Warehouse,
  Wallet,
  Trash2,
  FileText,
  Users,
  Receipt,
  TableIcon,
  DollarSign,
  Bell,
  Newspaper,
  TrendingUp,
  Truck,
  BarChart3,
  ClipboardList,
  Globe,
  Coins,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { getNotifications } from "@/app/actions/notifications"
import { getUnreadRequestsCount } from "@/app/actions/shipping-requests"
import { getPendingShipmentsCount } from "@/app/actions/shipments"
import { AdminFooter } from "@/components/admin-footer"
import { getPendingDriverTasksCount } from "@/app/actions/drivers"
import { LatestSessionsButton } from "@/components/latest-sessions-button"

export default function AdminPage() {
  const [notificationCount, setNotificationCount] = useState(0)
  const [unreadRequestsCount, setUnreadRequestsCount] = useState(0)
  const [pendingShipmentsCount, setPendingShipmentsCount] = useState(0)
  const [pendingDriverTasks, setPendingDriverTasks] = useState(0)

  useEffect(() => {
    const loadCounts = async () => {
      const notifications = await getNotifications()
      setNotificationCount(notifications.length)

      const unreadCount = await getUnreadRequestsCount()
      setUnreadRequestsCount(unreadCount)

      const pendingResult = await getPendingShipmentsCount()
      if (pendingResult.success) {
        setPendingShipmentsCount(pendingResult.count)
      }

      const driverTasksCount = await getPendingDriverTasksCount()
      setPendingDriverTasks(driverTasksCount)
    }
    loadCounts()

    const interval = setInterval(loadCounts, 15000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <NotificationBubble />

      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Link href="/">
                <div className="relative w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-xl sm:rounded-2xl overflow-hidden shadow-glow ring-2 ring-primary/20 flex-shrink-0 cursor-pointer hover:ring-primary/40 transition-all">
                  <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-1 sm:p-2" />
                </div>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent leading-tight">
                  مؤسسة الريان واريان للشحن
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1 hidden sm:block">
                  الريان للخدمات اللوجستية وحلول الشحن والتوصيل
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Link href="/track-shipment">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent p-1.5 sm:p-2 md:px-4"
                >
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="hidden lg:inline text-xs sm:text-sm">تتبع الشحنات</span>
                </Button>
              </Link>
              <Link href="/settings">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent p-1.5 sm:p-2 md:px-4"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="hidden lg:inline text-xs sm:text-sm">الإعدادات</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="space-y-4 sm:space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-2.5 md:p-4 rounded-xl sm:rounded-2xl gradient-primary shadow-glow">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">الإدارة</h2>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  لوحة التحكم الرئيسية لإدارة جميع العمليات
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
            <Link href="/reports" className="w-full">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow-accent transition-all duration-300 w-full text-xs sm:text-sm h-auto py-3 sm:py-4 bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                <span className="truncate text-foreground">التقارير</span>
              </Button>
            </Link>

            <Link href="/shipping-requests" className="w-full">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow-accent transition-all duration-300 w-full text-xs sm:text-sm h-auto py-3 sm:py-4 relative bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                <span className="truncate text-foreground">طلبات الشحن</span>
                {unreadRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                    {unreadRequestsCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/finance" className="w-full">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 w-full text-xs sm:text-sm h-auto py-3 sm:py-4 bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                <span className="truncate text-foreground">المالية</span>
              </Button>
            </Link>
            <Link href="/warehouse" className="w-full">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 w-full text-xs sm:text-sm h-auto py-3 sm:py-4 bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <Warehouse className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                <span className="truncate text-foreground">المستودع</span>
              </Button>
            </Link>
            <Link href="/debts" className="w-full">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 w-full text-xs sm:text-sm h-auto py-3 sm:py-4 bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                <span className="truncate text-foreground">الذمم</span>
              </Button>
            </Link>
            <Link href="/trips-table" className="w-full">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 w-full text-xs sm:text-sm h-auto py-3 sm:py-4 bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <TableIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                <span className="truncate text-foreground">جدول الرحلات</span>
              </Button>
            </Link>
            
            <Link href="/notifications" className="w-full">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 w-full text-xs sm:text-sm h-auto py-3 sm:py-4 relative bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                <span className="truncate text-foreground">التنبيهات</span>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                    {notificationCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/invoices" className="w-full">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 w-full text-xs sm:text-sm h-auto py-3 sm:py-4 bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                <span className="truncate text-foreground">الفواتير</span>
              </Button>
            </Link>
            <Link href="/news" className="w-full">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 w-full text-xs sm:text-sm h-auto py-3 sm:py-4 bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <Newspaper className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                <span className="truncate text-foreground">آخر الأخبار</span>
              </Button>
            </Link>
            <Link href="/drivers" className="w-full">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 w-full text-xs sm:text-sm h-auto py-3 sm:py-4 bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                <span className="truncate text-foreground">السائقين</span>
              </Button>
            </Link>
            <Link href="/admin/current-shipments" className="w-full">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 w-full text-xs sm:text-sm h-auto py-3 sm:py-4 bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                <span className="truncate text-foreground">الشحنات الحالية</span>
              </Button>
            </Link>
            <Link href="/admin/collection-summaries" className="w-full">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 w-full text-xs sm:text-sm h-auto py-3 sm:py-4 bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                <span className="truncate text-foreground">ملخص التحصيلات</span>
              </Button>
            </Link>
            <ShekelRateManager />
            <LatestSessionsButton />
          </div>

          {/* Gold Analysis Button */}
          <Link href="/admin/gold-analysis" className="block">
            <div className="relative w-full p-4 rounded-xl bg-gradient-to-r from-[#14698C] to-[#0B4A66] hover:from-[#1a7aa1] hover:to-[#0f5878] border border-white/15 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Coins className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">سوق الذهب</h3>
                    <p className="text-xs sm:text-sm text-white/80">تحليل شامل لسوق الذهب العالمي</p>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" />
              </div>
            </div>
          </Link>

          {/* Website Stats Button */}
          <Link href="/admin/website-stats" className="block">
            <div className="relative w-full p-4 rounded-xl bg-gradient-to-r from-[#14698C] to-[#0B4A66] hover:from-[#1a7aa1] hover:to-[#0f5878] border border-white/15 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Globe className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">إحصائيات الموقع</h3>
                    <p className="text-xs sm:text-sm text-white/80">عرض تقارير الزوار والتحليلات</p>
                  </div>
                </div>
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" />
              </div>
            </div>
          </Link>

          <div className="mb-6 sm:mb-8">
            <Link href="/shipments-tracking" className="block">
              <div className="relative inline-block w-full sm:w-auto">
                {pendingDriverTasks > 0 && (
                  <div className="absolute -top-3 -left-2 z-10 flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                    <Truck className="w-3.5 h-3.5" />
                    <span>{pendingDriverTasks} شحنة مع السائقين</span>
                  </div>
                )}
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-3 bg-card border border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-foreground shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-orange-400/50 text-base sm:text-lg py-6 sm:py-7 px-8 sm:px-12 relative"
                >
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <span className="font-bold">متابعة الشحنات</span>
                  {pendingShipmentsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-6 h-6 flex items-center justify-center shadow-lg animate-pulse px-1.5">
                      {pendingShipmentsCount}
                    </span>
                  )}
                </Button>
              </div>
            </Link>
          </div>
          
          {/* Subscribers Card - Like Gold Market */}
          <Link href="/admin/subscribers" className="block">
            <div className="relative w-full p-4 rounded-xl bg-gradient-to-r from-[#14698C] to-[#0B4A66] hover:from-[#1a7aa1] hover:to-[#0f5878] border border-white/15 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">أصحاب الطلبات</h3>
                    <p className="text-xs sm:text-sm text-white/80">إدارة المشتركين وشحناتهم</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" />
              </div>
            </div>
          </Link>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 sm:pt-8">
            <AddShipmentButton variant="default" />
            <Link href="/trash" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent border-red-500/30 hover:border-red-500/50 text-red-600 hover:text-red-700 w-full"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">سلة المحذوفات</span>
              </Button>
            </Link>
            <Link href="/customers" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent border-primary/30 hover:border-primary/50 w-full"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">الزبائن</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
