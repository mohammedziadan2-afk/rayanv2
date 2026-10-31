"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Users, 
  Package, 
  Wallet, 
  CheckCircle, 
  AlertCircle,
  Eye,
  ArrowRight,
  Loader2,
  RefreshCw,
  User,
  Calendar,
  DollarSign
} from "lucide-react"
import { AdminFooter } from "@/components/admin-footer"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface ActiveSession {
  id: string
  driver_id: string
  driver_name: string
  session_date: string
  session_number: number
  is_approved: boolean
  is_collected: boolean
  total_shipments: number
  total_revenue: number
  total_driver_fee: number
  remaining_collection: number
}

export default function AllActiveSessionsPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/drivers/all-active-sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error("Error loading sessions:", error)
      toast({
        title: "خطأ",
        description: "فشل في تحميل الجلسات",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  // حساب الإحصائيات
  const stats = {
    totalSessions: sessions.length,
    pendingApproval: sessions.filter(s => !s.is_approved).length,
    approvedNotCollected: sessions.filter(s => s.is_approved && !s.is_collected).length,
    totalRevenue: sessions.reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0),
    totalDriverFees: sessions.reduce((sum, s) => sum + (Number(s.total_driver_fee) || 0), 0),
    totalNetAmount: sessions.reduce((sum, s) => sum + (Number(s.remaining_collection) || 0), 0),
    totalShipments: sessions.reduce((sum, s) => sum + (Number(s.total_shipments) || 0), 0)
  }

  // تجميع الجلسات حسب السائق
  const sessionsByDriver = sessions.reduce((acc, session) => {
    if (!acc[session.driver_id]) {
      acc[session.driver_id] = {
        driver_name: session.driver_name,
        sessions: []
      }
    }
    acc[session.driver_id].sessions.push(session)
    return acc
  }, {} as Record<string, { driver_name: string, sessions: ActiveSession[] }>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-amber-500/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">الجلسات الحالية</h1>
                <p className="text-sm text-muted-foreground mt-1">جميع الجلسات غير المقبوضة لجميع السائقين</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadSessions}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي الجلسات</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.totalSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">قيد المراجعة</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.pendingApproval}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">معتمدة لم تُقبض</p>
                  <p className="text-2xl font-bold text-green-700">{stats.approvedNotCollected}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي الشحنات</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.totalShipments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <h3 className="text-lg font-bold mb-3 text-center">ملخص المبالغ المستحقة</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-white/80 text-xs">إجمالي الإيرادات</p>
                <p className="text-xl font-bold">{stats.totalRevenue.toFixed(2)} د.أ</p>
              </div>
              <div>
                <p className="text-white/80 text-xs">أجور السائقين</p>
                <p className="text-xl font-bold text-orange-200">- {stats.totalDriverFees.toFixed(2)} د.أ</p>
              </div>
              <div className="border-r-2 border-white/30 pr-4">
                <p className="text-white/80 text-xs">صافي المبلغ</p>
                <p className="text-2xl font-bold">{stats.totalNetAmount.toFixed(2)} د.أ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sessions.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">لا توجد جلسات حالية</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">جميع الجلسات مقبوضة</p>
            </CardContent>
          </Card>
        )}

        {/* Sessions by Driver */}
        {!isLoading && Object.entries(sessionsByDriver).map(([driverId, { driver_name, sessions: driverSessions }]) => (
          <Card key={driverId} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{driver_name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{driverSessions.length} جلسة حالية</p>
                  </div>
                </div>
                <Link href={`/drivers/${driverId}/active-sessions`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Eye className="w-4 h-4" />
                    عرض الكل
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {driverSessions.map((session) => (
                  <div key={session.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              جلسة #{session.session_number} - {session.session_date ? new Date(session.session_date).toLocaleDateString('ar-SA') : '-'}
                            </span>
                            <Badge variant={session.is_approved ? "default" : "secondary"} className="text-xs">
                              {session.is_approved ? "معتمدة" : "قيد المراجعة"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {session.total_shipments || 0} شحنة
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {(Number(session.remaining_collection) || 0).toFixed(2)} د.أ
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/drivers/${driverId}/sessions/${session.id}?returnUrl=/drivers/all-active-sessions`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="w-4 h-4" />
                          عرض
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </main>

      <AdminFooter backUrl="/drivers" backLabel="السائقون" previousUrl="/admin" />
    </div>
  )
}
