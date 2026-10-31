"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  ArrowRight, 
  Calendar, 
  Package, 
  DollarSign, 
  Truck, 
  Eye, 
  Loader2, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Banknote
} from "lucide-react"
import { toggleSessionCollection, approveDriverSession } from "@/app/actions/drivers"
import { useToast } from "@/hooks/use-toast"
import { AdminFooter } from "@/components/admin-footer"
import { useDriver, useDriverSessions } from "@/hooks/use-drivers"

interface ActiveSessionsClientProps {
  driverId: string
}

export function ActiveSessionsClient({ driverId }: ActiveSessionsClientProps) {
  const { toast } = useToast()
  const { driver, isLoading: driverLoading } = useDriver(driverId)
  const { sessions, isLoading: sessionsLoading, refresh } = useDriverSessions(driverId)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const isLoading = driverLoading || sessionsLoading

  // فلترة الجلسات الحالية (غير المقبوضة بما فيها غير المعتمدة)
  const activeSessions = useMemo(() => {
    return sessions.filter((s: any) => !s.is_collected)
  }, [sessions])

  // إحصائيات الجلسات الحالية
  const stats = useMemo(() => {
    const pendingApproval = activeSessions.filter((s: any) => !s.is_approved)
    const approvedNotCollected = activeSessions.filter((s: any) => s.is_approved && !s.is_collected)
    
    const totalRevenue = activeSessions.reduce((sum: number, s: any) => sum + (Number(s.total_revenue) || 0), 0)
    const totalDriverFee = activeSessions.reduce((sum: number, s: any) => sum + (Number(s.total_driver_fee) || 0), 0)
    const totalDelivered = activeSessions.reduce((sum: number, s: any) => sum + (Number(s.delivered_count) || 0), 0)
    
    return {
      total: activeSessions.length,
      pendingApproval: pendingApproval.length,
      approvedNotCollected: approvedNotCollected.length,
      totalRevenue,
      totalDriverFee,
      totalDelivered
    }
  }, [activeSessions])

  const handleCollectionToggle = useCallback(async (sessionId: string, currentStatus: boolean) => {
    try {
      setActionLoading(sessionId)
      await toggleSessionCollection(sessionId, !currentStatus)
      refresh()
      toast({
        title: "نجح",
        description: currentStatus ? "تم إلغاء القبض" : "تم تأكيد القبض",
      })
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة القبض",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }, [refresh, toast])

  const handleApproveSession = useCallback(async (sessionId: string) => {
    try {
      setActionLoading(sessionId)
      await approveDriverSession(sessionId)
      refresh()
      toast({
        title: "نجح",
        description: "تم اعتماد الجلسة بنجاح",
      })
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء اعتماد الجلسة",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }, [refresh, toast])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!driver) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">السائق غير موجود</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-l from-amber-500 to-amber-600 text-white p-6">
        <div className="container mx-auto">
          <Link 
            href={`/drivers/${driverId}`}
            prefetch={true}
            className="inline-flex items-center gap-2 text-white hover:bg-white/20 mb-4 px-3 py-2 rounded-md transition-colors active:scale-95"
          >
            <ArrowRight className="w-4 h-4" />
            رجوع
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-7 h-7" />
            الجلسات الحالية: {driver.name}
          </h1>
          <p className="text-amber-100 mt-1">الجلسات غير المقبوضة وغير المعتمدة</p>
        </div>
      </div>

      <div className="container mx-auto p-4 space-y-4 pb-24">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-amber-600" />
              <p className="text-xs text-muted-foreground">إجمالي الجلسات الحالية</p>
              <p className="text-2xl font-bold text-amber-600">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <p className="text-xs text-muted-foreground">قيد المراجعة</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingApproval}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-xs text-muted-foreground">معتمدة لم تُقبض</p>
              <p className="text-2xl font-bold text-blue-600">{stats.approvedNotCollected}</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Package className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-xs text-white/80">الشحنات</p>
                <p className="text-xl font-bold">{stats.totalDelivered}</p>
              </div>
              <div>
                <DollarSign className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-xs text-white/80">الإيرادات</p>
                <p className="text-xl font-bold">{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div>
                <Truck className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-xs text-white/80">أجور السائق</p>
                <p className="text-xl font-bold">{stats.totalDriverFee.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5" />
              قائمة الجلسات ({activeSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
                <p className="text-lg font-medium text-green-600">لا توجد جلسات معلقة</p>
                <p className="text-sm">جميع الجلسات تم قبضها</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((session: any) => {
                  const sessionDate = new Date(session.session_date)
                  const formattedDate = `${sessionDate.getDate().toString().padStart(2, '0')}/${(sessionDate.getMonth() + 1).toString().padStart(2, '0')}/${sessionDate.getFullYear()}`
                  const isActionLoading = actionLoading === session.id

                  return (
                    <Card 
                      key={session.id} 
                      className={`border-r-4 ${
                        !session.is_approved 
                          ? 'border-r-orange-500 bg-orange-50/50' 
                          : 'border-r-blue-500 bg-blue-50/50'
                      }`}
                    >
                      <CardContent className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-base font-bold">
                              #{session.session_number}
                            </Badge>
                            <span className="text-sm text-muted-foreground font-mono">
                              {formattedDate}
                            </span>
                          </div>
                          {!session.is_approved ? (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              <AlertCircle className="w-3 h-3 ml-1" />
                              قيد المراجعة
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              <Clock className="w-3 h-3 ml-1" />
                              لم تُقبض
                            </Badge>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-3 text-center bg-white/50 rounded-lg p-2">
                          <div>
                            <p className="text-xs text-muted-foreground">الشحنات</p>
                            <p className="font-bold text-purple-600">{session.delivered_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">الإيرادات</p>
                            <p className="font-bold text-green-600">{Number(session.total_revenue || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">أجرة السائق</p>
                            <p className="font-bold text-orange-600">{Number(session.total_driver_fee || 0).toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {/* View Session Button */}
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <Link href={`/drivers/${driverId}/sessions/${session.id}`}>
                              <Eye className="w-4 h-4 ml-1" />
                              عرض الجلسة
                            </Link>
                          </Button>

                          {!session.is_approved ? (
                            // Approve Button for pending sessions
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveSession(session.id)}
                              disabled={isActionLoading}
                            >
                              {isActionLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin ml-1" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 ml-1" />
                              )}
                              اعتماد
                            </Button>
                          ) : (
                            // Collection Toggle for approved sessions
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleCollectionToggle(session.id, session.is_collected || false)}
                              disabled={isActionLoading}
                            >
                              {isActionLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin ml-1" />
                              ) : (
                                <Banknote className="w-4 h-4 ml-1" />
                              )}
                              تأكيد القبض
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AdminFooter 
        backUrl={`/drivers/${driverId}`} 
        backLabel="إدارة السائق" 
        previousUrl="/drivers" 
      />
    </div>
  )
}
