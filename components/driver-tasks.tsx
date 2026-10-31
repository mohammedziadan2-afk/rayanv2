"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  getDriverTasks,
  deleteDriverTask,
  updateDriverTask,
  createDriverSession,
  assignTasksToSession,
  getDriverSessions,
  getSessionTasks,
  approveDriverSession,
  returnShipmentToTasks,
  confirmShipmentDelivery,
  toggleSessionCollection,
  deleteDriverSession, // Import deleteDriverSession
} from "@/app/actions/drivers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Trash2, Package, User, Phone, MapPin, DollarSign, FileText, Send, Calendar, Link2, Copy } from "lucide-react"
import { AddDriverShipmentsDialog } from "@/components/add-driver-shipments-dialog"

interface DriverTasksProps {
  driverId: string
  driverName: string
}

export function DriverTasks({ driverId, driverName }: DriverTasksProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; number: string } | null>(null)
  const [sessionTasks, setSessionTasks] = useState<any[]>([])
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    loadTasks()
    loadSessions()
  }, [driverId])

  const loadTasks = async () => {
    setLoading(true)
    const allTasks = await getDriverTasks(driverId)
    const pendingTasks = allTasks.filter((task: any) => !task.session_id || task.status === "postponed")
    setTasks(pendingTasks)
    setLoading(false)
  }

  const loadSessions = async () => {
    const data = await getDriverSessions(driverId)
    setSessions(data)
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشحنة من مهام السائق؟")) return

    const result = await deleteDriverTask(taskId)
    if (result.success) {
      await loadTasks()
    }
  }

  const handleDeliveryTypeChange = async (taskId: string, newType: string) => {
    await updateDriverTask(taskId, { delivery_type: newType })
    await loadTasks()
  }

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const toggleAllTasks = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t.id)))
    }
  }

  const handleSendToDriver = async () => {
    if (selectedTasks.size === 0) {
      alert("الرجاء تحديد شحنات لإرسالها للسائق")
      return
    }

    setLoading(true)

    try {
      // Create new session with selected date
      const sessionResult = await createDriverSession(driverId, undefined, sessionDate)

      if (!sessionResult.success) {
        alert("فشل في إنشاء الجلسة")
        setLoading(false)
        return
      }

      // Assign selected tasks to the session
      const taskIds = Array.from(selectedTasks)
      const assignResult = await assignTasksToSession(sessionResult.data.id, taskIds)

      if (assignResult.success) {
        alert("تم إرسال الشحنات للسائق بنجاح")
        setSelectedTasks(new Set())
        setSendDialogOpen(false)
        const [newTasks, newSessions] = await Promise.all([getDriverTasks(driverId), getDriverSessions(driverId)])
        const pendingTasks = newTasks.filter((task: any) => !task.session_id || task.status === "postponed")
        setTasks(pendingTasks)
        setSessions(newSessions)
      } else {
        alert("فشل في إرسال الشحنات")
      }
    } catch (error) {
      console.error("Error sending to driver:", error)
      alert("حدث خطأ أثناء الإرسال")
    } finally {
      setLoading(false)
    }
  }

  const handleViewSession = (session: any) => {
    router.push(`/drivers/${driverId}/sessions/${session.id}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-green-600">تم التسليم</Badge>
      case "rejected":
        return <Badge variant="destructive">رفض التسليم</Badge>
      case "postponed":
        return <Badge className="bg-yellow-600 text-white">مؤجل</Badge>
      case "refused":
        return <Badge className="bg-gray-600 text-white">مرفوض</Badge>
      default:
        return <Badge variant="secondary">قيد الانتظار</Badge>
    }
  }

  const totalStats = sessions.reduce(
    (acc, session) => ({
      totalRevenue: acc.totalRevenue + (Number(session.total_revenue) || 0),
      totalDriverFee: acc.totalDriverFee + (Number(session.total_driver_fee) || 0),
      totalDelivered: acc.totalDelivered + (session.tasks?.filter((t: any) => t.status === "delivered").length || 0),
    }),
    { totalRevenue: 0, totalDriverFee: 0, totalDelivered: 0 },
  )

  const handleConfirmDelivery = async (taskId: string) => {
    const result = await confirmShipmentDelivery(taskId)
    if (result.success) {
      await loadSessionDetails(selectedSession.id)
    }
  }

  const handleReturnToTasks = async (taskId: string) => {
    if (!confirm("هل أنت متأكد من إرجاع هذه الشحنة إلى جدول المهام؟")) return

    const result = await returnShipmentToTasks(taskId)
    if (result.success) {
      alert("تم إرجاع الشحنة إلى جدول المهام بنجاح")
      await loadSessionDetails(selectedSession.id)
      await loadTasks()
    }
  }

  const handleApproveSession = async () => {
    if (!selectedSession) return
    if (!confirm("هل أنت متأكد من اعتماد هذه الجلسة؟ لن يمكن التعديل عليها بعد الاعتماد.")) return

    const result = await approveDriverSession(selectedSession.id)
    if (result.success) {
      const totalRevenue = Number(result.data.total_revenue) || 0
      const totalDriverFee = Number(result.data.total_driver_fee) || 0
      const remainingCollection = Number(result.data.remaining_collection) || 0

      alert(
        `تم اعتماد الجلسة بنجاح\n\nإجمالي الإيرادات: ${totalRevenue.toFixed(2)} د.أ\nأجرة السائق: ${totalDriverFee.toFixed(2)} د.أ\nباقي التحصيل: ${remainingCollection.toFixed(2)} د.أ`,
      )
      await loadSessions()
      setSessionDetailsOpen(false)
    }
  }

  const loadSessionDetails = async (sessionId: string) => {
    const tasks = await getSessionTasks(sessionId)
    setSessionTasks(tasks)
  }

  const handlePrintSession = () => {
    const style = document.createElement("style")
    style.textContent = `
      @media print {
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        
        .no-print {
          display: none !important;
        }
        
        * {
          font-size: 10px !important;
          line-height: 1.3 !important;
        }
        
        h1, h2, h3 {
          font-size: 14px !important;
        }
        
        table {
          font-size: 9px !important;
        }
      }
    `
    document.head.appendChild(style)
    window.print()
    document.head.removeChild(style)
  }

  const handleCollectionToggle = async (sessionId: string, currentValue: boolean) => {
    const result = await toggleSessionCollection(sessionId, !currentValue)
    if (result.success) {
      await loadSessions()
    }
  }

  const handleCopyDriverLink = async () => {
    const latestPendingSession = sessions.find((s) => !s.is_approved)

    if (!latestPendingSession) {
      alert("لا توجد جلسات غير معتمدة. الرجاء إنشاء جلسة جديدة أولاً.")
      return
    }

    const driverLink = `${window.location.origin}/driver-view/${driverId}?sessionId=${latestPendingSession.id}`

    try {
      await navigator.clipboard.writeText(driverLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      alert("فشل في نسخ الرابط")
    }
  }

  const handleDeleteSession = async (sessionId: string, sessionNumber: string) => {
    if (
      !confirm(
        `هل أنت متأكد من حذف الجلسة رقم ${sessionNumber}؟ سيتم إرجاع جميع الشحنات إلى حالتها الأصلية وإعادة ترتيب أرقام الجلسات.`,
      )
    )
      return

    setLoading(true)
    const result = await deleteDriverSession(sessionId)
    if (result.success) {
      alert("تم حذف الجلسة بنجاح وإعادة ترتيب أرقام الجلسات")
      await loadSessions()
      await loadTasks()
    } else {
      alert("فشل في حذف الجلسة")
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <AddDriverShipmentsDialog driverId={driverId} driverName={driverName} onSuccess={loadTasks} />

          <Button
            onClick={handleCopyDriverLink}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent w-full sm:w-auto"
            size="lg"
          >
            {copySuccess ? (
              <>
                <Copy className="w-5 h-5 mr-2" />
                تم النسخ!
              </>
            ) : (
              <>
                <Link2 className="w-5 h-5 mr-2" />
                نسخ رابط أيقونات السائق
              </>
            )}
          </Button>
        </div>

        {selectedTasks.size > 0 && (
          <Button
            onClick={() => setSendDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            size="lg"
          >
            <Send className="w-5 h-5 mr-2" />
            إرسال للسائق ({selectedTasks.size})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            المهام الحالية ({tasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">لا توجد مهام مخصصة للسائق حالياً</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTasks.size === tasks.length && tasks.length > 0}
                        onCheckedChange={toggleAllTasks}
                      />
                    </TableHead>
                    <TableHead>رقم التتبع</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المستلم</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>نوع التوصيل</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const isUnpaid = task.shipments?.payment_status === "unpaid"
                    const textColorClass = isUnpaid ? "text-red-600" : ""

                    return (
                      <TableRow key={task.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTasks.has(task.id)}
                            onCheckedChange={() => toggleTaskSelection(task.id)}
                          />
                        </TableCell>
                        <TableCell className={`font-medium ${textColorClass}`}>
                          {task.shipments?.tracking_number || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className={`w-4 h-4 ${isUnpaid ? "text-red-400" : "text-muted-foreground"}`} />
                            <span className={`max-w-[200px] truncate ${textColorClass}`}>
                              {task.shipments?.description || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className={`w-4 h-4 ${isUnpaid ? "text-red-400" : "text-muted-foreground"}`} />
                            <span className={textColorClass}>{task.shipments?.receiver_name || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className={`w-4 h-4 ${isUnpaid ? "text-red-400" : "text-muted-foreground"}`} />
                            <span className={textColorClass}>{task.shipments?.receiver_phone || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <MapPin
                              className={`w-4 h-4 flex-shrink-0 ${isUnpaid ? "text-red-400" : "text-muted-foreground"}`}
                            />
                            <span className={`truncate ${textColorClass}`}>
                              {task.shipments?.receiver_address || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className={`w-4 h-4 ${isUnpaid ? "text-red-400" : "text-muted-foreground"}`} />
                            <span className={textColorClass}>{Number(task.shipments?.amount || 0).toFixed(2)} د.أ</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={task.delivery_type}
                            onValueChange={(value) => handleDeliveryTypeChange(task.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="included">شامل التوصيل</SelectItem>
                              <SelectItem value="not_included">غير شامل التوصيل</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(task.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {sessions.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              ملخص جلسات السائق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Link href={`/drivers/${driverId}/sessions`}>
                <Button variant="outline" className="w-full bg-transparent hover:bg-blue-50 hover:border-blue-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  عرض تفاصيل جميع الجلسات
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={sessionDetailsOpen} onOpenChange={setSessionDetailsOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              جلسة رقم {selectedSession?.session_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">عدد الشحنات المسلمة</p>
                <p className="text-2xl font-bold">{selectedSession?.delivered_count || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-green-600">
                  {Number(selectedSession?.total_revenue || 0).toFixed(2)} د.أ
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">أجرة السائق</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Number(selectedSession?.total_driver_fee || 0).toFixed(2)} د.أ
                </p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التتبع</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المستلم</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.shipments?.tracking_number || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="max-w-[200px] truncate">{task.shipments?.description || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{task.shipments?.receiver_name || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{task.shipments?.receiver_phone || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <MapPin className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate">{task.shipments?.receiver_address || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>{Number(task.shipments?.amount || 0).toFixed(2)} د.أ</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!selectedSession?.is_approved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSession(task.session_id, task.session_number)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        {selectedSession?.is_approved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReturnToTasks(task.id)}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-600"
                          >
                            <Send className="w-4 h-4" />
                            إرجاع إلى المهام
                          </Button>
                        )}
                        {task.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirmDelivery(task.id)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-600"
                          >
                            <Send className="w-4 h-4" />
                            تأكيد التسليم
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إرسال الشحنات للسائق</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-date">تاريخ الجلسة</Label>
              <Input
                id="session-date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>عدد الشحنات المحددة: {selectedTasks.size}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSendToDriver} className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
