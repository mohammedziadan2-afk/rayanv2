"use client"

import Link from "next/link"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowRight, Calendar, Package, DollarSign, Truck, Trash2, Eye } from "lucide-react"
import { toggleSessionCollection, deleteDriverSession } from "@/app/actions/drivers"
import { toast } from "sonner"
import { AdminFooter } from "@/components/admin-footer"

interface DriverSessionsClientProps {
  driver: any
  initialSessions: any[]
}

export function DriverSessionsClient({ driver, initialSessions }: DriverSessionsClientProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initialSessions)
  const [loading, setLoading] = useState(false)

  // حساب الإحصائيات الإجمالية
  const totalStats = sessions.reduce(
    (acc, session) => ({
      totalRevenue: acc.totalRevenue + (Number(session.total_revenue) || 0),
      totalDriverFee: acc.totalDriverFee + (Number(session.total_driver_fee) || 0),
      totalDelivered: acc.totalDelivered + (Number(session.delivered_count) || 0),
    }),
    { totalRevenue: 0, totalDriverFee: 0, totalDelivered: 0 },
  )

  const handleCollectionToggle = async (sessionId: string, currentStatus: boolean) => {
    try {
      setLoading(true)
      await toggleSessionCollection(sessionId, !currentStatus)
      setSessions(sessions.map((s) => (s.id === sessionId ? { ...s, is_collected: !currentStatus } : s)))
      toast.success(currentStatus ? "تم إلغاء القبض" : "تم تأكيد القبض")
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث حالة القبض")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string, sessionNumber: string) => {
    if (!confirm(`هل أنت متأكد من حذف الجلسة #${sessionNumber}؟`)) return

    try {
      setLoading(true)
      await deleteDriverSession(sessionId)
      setSessions(sessions.filter((s) => s.id !== sessionId))
      toast.success("تم حذف الجلسة بنجاح")
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الجلسة")
    } finally {
      setLoading(false)
    }
  }

  const handleViewSession = (session: any) => {
    router.push(`/drivers/${driver.id}/sessions/${session.id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-700 text-white p-6">
        <div className="container mx-auto">
          <Link 
            href="/drivers"
            prefetch={true}
            className="inline-flex items-center gap-2 text-white hover:bg-white/20 mb-4 px-3 py-2 rounded-md transition-colors active:scale-95 touch-manipulation"
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
                    {sessions.map((session) => (
                      <TableRow key={session.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Badge variant="outline" className="text-base font-bold">
                            #{session.session_number}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {new Date(session.session_date).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
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
                                disabled={loading}
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
                            <Button variant="outline" size="sm" onClick={() => handleViewSession(session)}>
                              <Eye className="w-4 h-4 ml-1" />
                              تفاصيل
                            </Button>
                            {!session.is_approved && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteSession(session.id, session.session_number)}
                                disabled={loading}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AdminFooter backUrl="/drivers" backLabel="السائقون" previousUrl="/drivers" />
    </div>
  )
}
