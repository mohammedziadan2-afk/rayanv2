"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface SessionData {
  id: number
  driver_name: string
  total_revenue: number
  total_driver_fee: number
  remaining_collection: number
  is_approved: boolean
  tasks: TaskData[]
}

interface TaskData {
  shipment_id: number
  tracking_number: string
  original_payment_status: string
  current_payment_status: string
  price: number
  driver_fee: number
  delivery_type: string
  calculated_revenue: number
}

export default function VerifyRevenuesPage() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/verify-revenues")
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error("Error fetching sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const fixSession = async (sessionId: number) => {
    setLoading(true)
    try {
      const response = await fetch("/api/fix-session-revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      const data = await response.json()
      if (data.success) {
        alert("تم تصحيح الجلسة بنجاح")
        fetchSessions()
      }
    } catch (error) {
      console.error("Error fixing session:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>فحص وتصحيح إيرادات السائقين</CardTitle>
          <CardDescription>التحقق من صحة حساب الإيرادات بناءً على حالة الدفع الأصلية</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchSessions} disabled={loading}>
            {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
            فحص جميع الجلسات
          </Button>

          {sessions.length > 0 && (
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الجلسة</TableHead>
                    <TableHead>السائق</TableHead>
                    <TableHead>الإيراد المسجل</TableHead>
                    <TableHead>الإيراد الصحيح</TableHead>
                    <TableHead>الفرق</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => {
                    const correctRevenue = session.tasks.reduce((sum, task) => sum + task.calculated_revenue, 0)
                    const difference = session.total_revenue - correctRevenue
                    const isCorrect = Math.abs(difference) < 0.01

                    return (
                      <TableRow key={session.id}>
                        <TableCell>{session.id}</TableCell>
                        <TableCell>{session.driver_name}</TableCell>
                        <TableCell>{session.total_revenue.toFixed(2)} د.أ</TableCell>
                        <TableCell>{correctRevenue.toFixed(2)} د.أ</TableCell>
                        <TableCell className={difference !== 0 ? "text-red-500 font-bold" : ""}>
                          {difference.toFixed(2)} د.أ
                        </TableCell>
                        <TableCell>
                          {isCorrect ? <Badge variant="default">صحيح</Badge> : <Badge variant="destructive">خطأ</Badge>}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSession(session)}
                            className="ml-2"
                          >
                            تفاصيل
                          </Button>
                          {!isCorrect && (
                            <Button size="sm" onClick={() => fixSession(session.id)} disabled={loading}>
                              تصحيح
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {selectedSession && (
            <div className="mt-6 border rounded-lg p-4">
              <h3 className="text-lg font-bold mb-4">
                تفاصيل الجلسة #{selectedSession.id} - {selectedSession.driver_name}
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم التتبع</TableHead>
                    <TableHead>الحالة الأصلية</TableHead>
                    <TableHead>الحالة الحالية</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>أجرة السائق</TableHead>
                    <TableHead>الإيراد المحسوب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSession.tasks.map((task) => (
                    <TableRow key={task.shipment_id}>
                      <TableCell>{task.tracking_number}</TableCell>
                      <TableCell>
                        <Badge variant={task.original_payment_status === "paid" ? "default" : "secondary"}>
                          {task.original_payment_status === "paid" ? "مدفوعة" : "غير مدفوعة"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={task.current_payment_status === "paid" ? "default" : "secondary"}>
                          {task.current_payment_status === "paid" ? "مدفوعة" : "غير مدفوعة"}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.price.toFixed(2)} د.أ</TableCell>
                      <TableCell>{task.driver_fee.toFixed(2)} د.أ</TableCell>
                      <TableCell className="font-bold">{task.calculated_revenue.toFixed(2)} د.أ</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" onClick={() => setSelectedSession(null)} className="mt-4">
                إغلاق
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
