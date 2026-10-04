"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowRight, Calendar, Package, DollarSign, Truck, Trash2, Eye, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { toggleSessionCollection, deleteDriverSession } from "@/app/actions/drivers"
import { useToast } from "@/hooks/use-toast"
import { AdminFooter } from "@/components/admin-footer"
import { useDriver, useDriverSessions } from "@/hooks/use-drivers"
import { useState, useMemo, useCallback } from "react"
import Link from "next/link"

const MONTH_NAMES = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]

interface DriverSessionsPageClientProps {
  driverId: string
}

export function DriverSessionsPageClient({ driverId }: DriverSessionsPageClientProps) {
  const { toast } = useToast()
  const { driver, isLoading: driverLoading } = useDriver(driverId)
  const { sessions, isLoading: sessionsLoading, refresh } = useDriverSessions(driverId)
  const [actionLoading, setActionLoading] = useState(false)

  const isLoading = driverLoading || sessionsLoading

  // حساب الإحصائيات الإجمالية مع useMemo لتجنب إعادة الحساب
  const totalStats = useMemo(() => {
    return sessions.reduce(
      (acc: any, session: any) => ({
        totalRevenue: acc.totalRevenue + (Number(session.total_revenue) || 0),
        totalDriverFee: acc.totalDriverFee + (Number(session.total_driver_fee) || 0),
        totalDelivered: acc.totalDelivered + (Number(session.delivered_count) || 0),
      }),
      { totalRevenue: 0, totalDriverFee: 0, totalDelivered: 0 },
    )
  }, [sessions])

  // تجميع الجلسات حسب الشهر والسنة
  const groupedSessions = useMemo(() => {
    const groups: { [key: string]: { month: number; year: number; sessions: any[] } } = {}
    
    sessions.forEach((session: any) => {
      const date = new Date(session.session_date)
      const month = date.getMonth()
      const year = date.getFullYear()
      const key = `${year}-${month}`
      
      if (!groups[key]) {
        groups[key] = { month, year, sessions: [] }
      }
      groups[key].sessions.push(session)
    })
    
    // ترتيب من الأحدث للأقدم
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, value]) => ({ key, ...value }))
  }, [sessions])

  // الشهر الحالي مفتوح افتراضياً
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const currentMonthKey = `${currentYear}-${currentMonth}`
  
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set([currentMonthKey]))

  const toggleMonth = useCallback((key: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }, [])

  const handleCollectionToggle = useCallback(async (sessionId: string, currentStatus: boolean) => {
    try {
      setActionLoading(true)
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
      setActionLoading(false)
    }
  }, [refresh, toast])

  const handleDeleteSession = useCallback(async (sessionId: string, sessionNumber: string) => {
    if (!confirm(`هل أنت متأكد من حذف الجلسة #${sessionNumber}؟`)) return

    try {
      setActionLoading(true)
      await deleteDriverSession(sessionId)
      refresh()
      toast({
        title: "نجح",
        description: "تم حذف الجلسة بنجاح",
      })
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الجلسة",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
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
      <div className="bg-gradient-to-l from-blue-600 to-blue-700 text-white p-6">
        <div className="container mx-auto">
          <Link 
            href="/drivers"
            prefetch={true}
            className="inline-flex items-center gap-2 text-white hover:bg-white/20 mb-4 px-3 py-2 rounded-md transition-colors active:scale-95"
          >
            <ArrowRight className="w-4 h-4" />
            رجوع
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-7 h-7" />
            جميع جلسات السائق: {driver.name}
          </h1>
          <p className="text-blue-100 mt-1">عرض وإدارة جميع جلسات التوصيل</p>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6 pb-24">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-muted-foreground">إجمالي الجلسات</p>
              <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-muted-foreground">الشحنات المسلمة</p>
              <p className="text-2xl font-bold text-purple-600">{totalStats.totalDelivered}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-green-600">{totalStats.totalRevenue.toFixed(2)} د.أ</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <Truck className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-sm text-muted-foreground">أجور السائق</p>
              <p className="text-2xl font-bold text-orange-600">{totalStats.totalDriverFee.toFixed(2)} د.أ</p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              قائمة الجلسات ({sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">لا توجد جلسات مسجلة لهذا السائق</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedSessions.map((group) => {
                  const isExpanded = expandedMonths.has(group.key)
                  const isCurrentMonth = group.key === currentMonthKey
                  
                  return (
                    <div key={group.key} className="border rounded-lg overflow-hidden">
                      {/* Month Header */}
                      <button
                        onClick={() => toggleMonth(group.key)}
                        className={`w-full flex items-center justify-between p-4 text-right transition-colors ${
                          isCurrentMonth 
                            ? "bg-blue-50 hover:bg-blue-100" 
                            : "bg-muted/30 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className={`w-5 h-5 ${isCurrentMonth ? "text-blue-600" : "text-muted-foreground"}`} />
                          <span className={`font-bold text-lg ${isCurrentMonth ? "text-blue-700" : ""}`}>
                            {MONTH_NAMES[group.month]} {group.year}
                          </span>
                          <Badge variant={isCurrentMonth ? "default" : "secondary"} className="text-xs">
                            {group.sessions.length} جلسة
                          </Badge>
                          {isCurrentMonth && (
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                              الشهر الحالي
                            </Badge>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                      
                      {/* Sessions Table */}
                      {isExpanded && (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-right">رقم الجلسة</TableHead>
                                <TableHead className="text-right">التاريخ</TableHead>
                                <TableHead className="text-right">رقم الرحلة</TableHead>
                                <TableHead className="text-right">عدد الشحنات</TableHead>
                                <TableHead className="text-right">الإيرادات</TableHead>
                                <TableHead className="text-right">أجرة السائق</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-right">إجراءات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.sessions.map((session: any) => {
                                const sessionDate = new Date(session.session_date)
                                const formattedDate = `${sessionDate.getDate().toString().padStart(2, '0')}/${(sessionDate.getMonth() + 1).toString().padStart(2, '0')}/${sessionDate.getFullYear()}`
                                
                                return (
                                  <TableRow key={session.id} className="hover:bg-muted/50">
                                    <TableCell>
                                      <Badge variant="outline" className="text-base font-bold">
                                        #{session.session_number}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium font-mono">
                                      {formattedDate}
                                    </TableCell>
                                    <TableCell>
                                      {session.trip_number ? (
                                        <Badge variant="secondary">رحلة #{session.trip_number}</Badge>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{session.delivered_count || 0}</Badge>
                                    </TableCell>
                                    <TableCell className="text-green-600 font-semibold">
                                      {Number(session.total_revenue || 0).toFixed(2)} د.أ
                                    </TableCell>
                                    <TableCell className="text-orange-600 font-semibold">
                                      {Number(session.total_driver_fee || 0).toFixed(2)} د.أ
                                    </TableCell>
                                    <TableCell>
                                      {session.is_approved ? (
                                        <div className="flex items-center gap-2">
                                          <Switch
                                            checked={session.is_collected || false}
                                            onCheckedChange={() =>
                                              handleCollectionToggle(session.id, session.is_collected || false)
                                            }
                                            disabled={actionLoading}
                                          />
                                          <span
                                            className={`text-xs ${session.is_collected ? "text-green-600" : "text-muted-foreground"}`}
                                          >
                                            {session.is_collected ? "تم القبض" : "لم يُقبض"}
                                          </span>
                                        </div>
                                      ) : (
                                        <Badge variant="secondary">قيد المراجعة</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                          <Link href={`/drivers/${driverId}/sessions/${session.id}`} prefetch={true}>
                                            <Eye className="w-4 h-4 ml-1" />
                                            تفاصيل
                                          </Link>
                                        </Button>
                                        {!session.is_approved && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteSession(session.id, session.session_number)}
                                            disabled={actionLoading}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AdminFooter backUrl="/drivers" backLabel="السائقين" previousUrl="/drivers" />
    </div>
  )
}
