"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  deleteDriverTask,
  updateDriverTask,
  createDriverSession,
  assignTasksToSession,
  deleteDriverSession,
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
import {
  Trash2,
  Package,
  User,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  Send,
  Calendar,
  Link2,
  Copy,
  Loader2,
} from "lucide-react"
import { AddDriverShipmentsDialog } from "@/components/add-driver-shipments-dialog"
import { useToast } from "@/hooks/use-toast"

interface DriverTasksClientProps {
  driverId: string
  driverName: string
  tasks: any[]
  sessions: any[]
  isLoading: boolean
  onRefresh: () => void
}

export function DriverTasksClient({
  driverId,
  driverName,
  tasks,
  sessions,
  isLoading,
  onRefresh,
}: DriverTasksClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0])
  const [copySuccess, setCopySuccess] = useState(false)

  const handleDelete = async (taskId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشحنة من مهام السائق؟")) return

    setActionLoading(true)
    try {
      const result = await deleteDriverTask(taskId)
      if (result.success) {
        toast({ title: "نجح", description: "تم حذف المهمة بنجاح" })
        onRefresh()
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeliveryTypeChange = async (taskId: string, newType: string) => {
    setActionLoading(true)
    try {
      await updateDriverTask(taskId, { delivery_type: newType })
      onRefresh()
    } finally {
      setActionLoading(false)
    }
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
      toast({ title: "خطأ", description: "الرجاء تحديد شحنات لإرسالها للسائق", variant: "destructive" })
      return
    }

    setActionLoading(true)
    try {
      const sessionResult = await createDriverSession(driverId, undefined, sessionDate)

      if (!sessionResult.success) {
        toast({ title: "خطأ", description: "فشل في إنشاء الجلسة", variant: "destructive" })
        return
      }

      const taskIds = Array.from(selectedTasks)
      const assignResult = await assignTasksToSession(sessionResult.data.id, taskIds)

      if (assignResult.success) {
        toast({ title: "نجح", description: "تم إرسال الشحنات للسائق بنجاح" })
        setSelectedTasks(new Set())
        setSendDialogOpen(false)
        onRefresh()
      } else {
        toast({ title: "خطأ", description: "فشل في إرسال الشحنات", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الإرسال", variant: "destructive" })
    } finally {
      setActionLoading(false)
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

  const handleCopyDriverLink = async () => {
    const latestPendingSession = sessions.find((s) => !s.is_approved)

    if (!latestPendingSession) {
      toast({
        title: "تنبيه",
        description: "لا توجد جلسات غير معتمدة. الرجاء إنشاء جلسة جديدة أولاً.",
        variant: "destructive",
      })
      return
    }

    const driverLink = `${window.location.origin}/driver-view/${driverId}?sessionId=${latestPendingSession.id}`

    try {
      await navigator.clipboard.writeText(driverLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
      toast({ title: "نجح", description: "تم نسخ الرابط بنجاح" })
    } catch (err) {
      toast({ title: "خطأ", description: "فشل في نسخ الرابط", variant: "destructive" })
    }
  }

  const handleDeleteSession = async (sessionId: string, sessionNumber: string) => {
    if (!confirm(`هل أنت متأكد من حذف الجلسة رقم ${sessionNumber}؟`)) return

    setActionLoading(true)
    try {
      const result = await deleteDriverSession(sessionId)
      if (result.success) {
        toast({ title: "نجح", description: "تم حذف الجلسة بنجاح" })
        onRefresh()
      } else {
        toast({ title: "خطأ", description: "فشل في حذف الجلسة", variant: "destructive" })
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <AddDriverShipmentsDialog driverId={driverId} driverName={driverName} onSuccess={onRefresh} />

          <Button
            onClick={handleCopyDriverLink}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent w-full sm:w-auto"
            size="lg"
            disabled={actionLoading}
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
            disabled={actionLoading}
          >
            {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
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
                            disabled={actionLoading}
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
              <Link href={`/drivers/${driverId}/sessions`} prefetch={true}>
                <Button variant="outline" className="w-full bg-transparent hover:bg-blue-50 hover:border-blue-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  عرض تفاصيل جميع الجلسات
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إرسال الشحنات للسائق</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>تاريخ الجلسة</Label>
              <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground">
              سيتم إرسال {selectedTasks.size} شحنة للسائق {driverName}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSendToDriver} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
