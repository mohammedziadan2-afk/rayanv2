"use client"

import Link from "next/link"

import { useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowRight, Calendar, Package, CheckCircle, Pencil, Trash2, Printer, RefreshCw, Loader2, Banknote } from "lucide-react"
import {
  approveDriverSession,
  updateApprovedSessionFees,
  deleteDriverSession,
  deleteDriverTask,
  recalculateApprovedSession,
  confirmShipmentDelivery,
  returnShipmentToTasks,
  addCashReceiptToSession,
} from "@/app/actions/drivers"
import { useToast } from "@/hooks/use-toast"
import { AdminFooter } from "@/components/admin-footer"
import { AddShipmentToSession } from "@/components/add-shipment-to-session"
import { useDriver, useSession, useSessionTasks } from "@/hooks/use-drivers"

interface SessionDetailPageClientProps {
  driverId: string
  sessionId: string
}

export function SessionDetailPageClient({ driverId, sessionId }: SessionDetailPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)
  
  // Get return URL from query params or default to sessions page
  const returnUrl = searchParams.get('returnUrl') || `/drivers/${driverId}/sessions`

  const { driver, isLoading: driverLoading } = useDriver(driverId)
  const { session, isLoading: sessionLoading, refresh: refreshSession } = useSession(driverId, sessionId)
  const { tasks, isLoading: tasksLoading, refresh: refreshTasks } = useSessionTasks(driverId, sessionId)

  const [actionLoading, setActionLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editFees, setEditFees] = useState<{ [key: string]: string }>({})
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingFeeValue, setEditingFeeValue] = useState("")
  const [cashReceiptOpen, setCashReceiptOpen] = useState(false)
  const [cashAmount, setCashAmount] = useState("")
  const [cashNote, setCashNote] = useState("")

  const isLoading = driverLoading || sessionLoading || tasksLoading

  const refreshAll = () => {
    refreshSession()
    refreshTasks()
  }

  const handleApprove = async () => {
    if (!confirm("هل أنت متأكد من اعتماد هذه الجلسة؟ لن يمكن التعديل عليها بعد الاعتماد.")) return

    setActionLoading(true)
    try {
      const result = await approveDriverSession(sessionId)
      if (result.success) {
        toast({ title: "نجح", description: "تم اعتماد الجلسة بنجاح" })
        refreshAll()
      } else {
        toast({ title: "خطأ", description: result.error || "فشل في اعتماد الجلسة", variant: "destructive" })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذه الجلسة؟")) return

    setActionLoading(true)
    try {
      const result = await deleteDriverSession(sessionId)
      if (result.success) {
        toast({ title: "نجح", description: "تم حذف الجلسة بنجاح" })
        router.push(`/drivers/${driverId}/sessions`)
      } else {
        toast({ title: "خطأ", description: result.error || "فشل في حذف الجلسة", variant: "destructive" })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleRecalculate = async () => {
    setActionLoading(true)
    try {
      const result = await recalculateApprovedSession(sessionId)
      if (result.success) {
        toast({ title: "نجح", description: "تم إعادة حساب الملخص بنجاح" })
        refreshAll()
      } else {
        toast({ title: "خطأ", description: result.error || "فشل في إعادة الحساب", variant: "destructive" })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const openEditDialog = () => {
    const fees: { [key: string]: string } = {}
    tasks.forEach((task: any) => {
      fees[task.id] = String(task.driver_fee || 0)
    })
    setEditFees(fees)
    setEditDialogOpen(true)
  }

  const handleSaveFees = async () => {
    setActionLoading(true)
    try {
      const feesArray = Object.entries(editFees).map(([taskId, fee]) => ({
        taskId,
        driverFee: Number.parseFloat(fee) || 0,
      }))

      const result = await updateApprovedSessionFees(sessionId, feesArray)
      if (result.success) {
        toast({ title: "نجح", description: "تم تحديث الأجور بنجاح" })
        setEditDialogOpen(false)
        refreshAll()
      } else {
        toast({ title: "خطأ", description: result.error || "فشل في تحديث الأجور", variant: "destructive" })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmDelivery = async (taskId: string) => {
    setActionLoading(true)
    try {
      const result = await confirmShipmentDelivery(taskId)
      if (result.success) {
        toast({ title: "نجح", description: "تم تأكيد التسليم" })
        refreshTasks()
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveFromSession = async (taskId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشحنة من الجلسة؟")) return

    setActionLoading(true)
    try {
      const result = await deleteDriverTask(taskId)
      if (result.success) {
        toast({ title: "تم الحذف", description: "تم حذف الشحنة من الجلسة بنجاح" })
        refreshAll()
      } else {
        toast({ title: "خطأ", description: result.error || "فشل في حذف الشحنة", variant: "destructive" })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartEditFee = (taskId: string, currentFee: number) => {
    setEditingTaskId(taskId)
    setEditingFeeValue(String(currentFee || 0))
  }

  const handleCancelEditFee = () => {
    setEditingTaskId(null)
    setEditingFeeValue("")
  }

  const handleSaveSingleFee = async (taskId: string) => {
    setActionLoading(true)
    try {
      const feeValue = Number.parseFloat(editingFeeValue) || 0
      const result = await updateApprovedSessionFees(sessionId, [
        { taskId, driverFee: feeValue },
      ])
      if (result.success) {
        toast({ title: "تم الحفظ", description: "تم تعديل أجرة السائق بنجاح" })
        setEditingTaskId(null)
        setEditingFeeValue("")
        refreshAll()
      } else {
        toast({ title: "خطأ", description: result.error || "فشل في تعديل الأجرة", variant: "destructive" })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddCashReceipt = async () => {
    const amount = Number.parseFloat(cashAmount)
    if (isNaN(amount) || amount === 0) {
      toast({ title: "تنبيه", description: "يرجى إدخال مبلغ صحيح", variant: "destructive" })
      return
    }

    setActionLoading(true)
    try {
      const result = await addCashReceiptToSession(driverId, sessionId, amount, cashNote)
      if (result.success) {
        const label = amount < 0 ? "مبلغ مدفوع" : "مبلغ مستلم"
        toast({ title: "تم", description: `تم إضافة ${label} ${Math.abs(amount).toFixed(2)} د.أ بنجاح` })
        setCashReceiptOpen(false)
        setCashAmount("")
        setCashNote("")
        refreshAll()
      } else {
        toast({ title: "خطأ", description: result.error || "فشل في إضافة المبلغ", variant: "destructive" })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleReturnToTasks = async (taskId: string) => {
    if (!confirm("هل أنت متأكد من إرجاع هذه الشحنة إلى جدول المهام؟")) return

    setActionLoading(true)
    try {
      const result = await returnShipmentToTasks(taskId)
      if (result.success) {
        toast({ title: "نجح", description: "تم إرجاع الشحنة إلى جدول المهام" })
        refreshTasks()
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-green-600">تم التسليم</Badge>
      case "rejected":
        return <Badge variant="destructive">رفض التسليم</Badge>
      case "postponed":
        return <Badge className="bg-yellow-600 text-white">مؤجل</Badge>
      default:
        return <Badge variant="secondary">قيد الانتظار</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!driver || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">الجلسة غير موجودة</p>
      </div>
    )
  }

  const deliveredCount = tasks.filter((t: any) => t.status === "delivered" && t.task_type !== "cash_receipt").length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-700 text-white p-6 print:hidden">
        <div className="container mx-auto">
          <Link 
            href={returnUrl}
            prefetch={true}
            className="inline-flex items-center gap-2 text-white hover:bg-white/20 mb-4 px-3 py-2 rounded-md transition-colors active:scale-95 touch-manipulation"
          >
            <ArrowRight className="w-4 h-4" />
            رجوع
          </Link>

          <div className="flex flex-wrap gap-2 mb-4">
            {!session.is_approved && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={actionLoading}
                className="bg-red-500/80 hover:bg-red-500 text-white border-0"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                حذف الجلسة
              </Button>
            )}
            {session.is_approved && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEditDialog}
                  disabled={actionLoading}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Pencil className="w-4 h-4 ml-1" />
                  تعديل الجلسة
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRecalculate}
                  disabled={actionLoading}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <RefreshCw className="w-4 h-4 ml-1" />
                  إعادة حساب الملخص
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <Printer className="w-4 h-4 ml-1" />
              طباعة
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6 pb-24" ref={printRef}>
        {/* Session Info Card */}
        <Card className="print:shadow-none print:border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              جلسة رقم {session.session_number} - {new Date(session.session_date).toLocaleDateString("ar-EG")}
            </CardTitle>
            {session.is_approved ? (
              <Badge className="bg-green-600">
                <CheckCircle className="w-4 h-4 ml-1" />
                معتمدة
              </Badge>
            ) : (
              <Badge variant="secondary">قيد المراجعة</Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground">عدد الشحنات المسلمة</p>
                <p className="text-2xl font-bold text-purple-600">{deliveredCount}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">مجموع الإيرادات</p>
                <p className="text-2xl font-bold text-green-600">{Number(session.total_revenue || 0).toFixed(2)} د.أ</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-muted-foreground">أجرة السائق</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Number(session.total_driver_fee || 0).toFixed(2)} د.أ
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground">باقي التحصيل</p>
                <p className="text-2xl font-bold text-red-600">
                  {Number(session.remaining_collection || 0).toFixed(2)} د.أ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card className="print:shadow-none print:border">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              تفاصيل الشحنات ({tasks.filter((t: any) => t.task_type !== "cash_receipt").length})
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <AddShipmentToSession 
                driverId={driverId} 
                sessionId={sessionId} 
                onSuccess={refreshAll} 
              />
              <Button
                size="sm"
                onClick={() => setCashReceiptOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
              >
                <Banknote className="w-4 h-4 ml-1" />
                مبلغ نقدي
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المستلم</TableHead>
                    <TableHead>أجرة السائق</TableHead>
                    <TableHead>إيراد السائق</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="print:hidden">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task: any) => {
                    const isCashReceipt = task.task_type === "cash_receipt"
                    const driverCollects =
                      task.driver_collects === true ||
                      task.driver_collects === "true" ||
                      task.driver_collects === 1 ||
                      task.delivery_type === "included"
                    const amount = isCashReceipt ? Number(task.cash_amount || 0) : Number(task.shipments?.amount || 0)

                    if (isCashReceipt) {
                      return (
                        <TableRow key={task.id} className={amount < 0 ? "bg-red-50/50" : "bg-amber-50/50"}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Banknote className={`w-4 h-4 ${amount < 0 ? "text-red-600" : "text-amber-600"}`} />
                              <span className={`font-semibold ${amount < 0 ? "text-red-700" : "text-amber-700"}`}>
                                {amount < 0 ? "مبلغ مدفوع" : "مبلغ مستلم"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.cash_note ? (
                              <span className={`text-xs ${amount < 0 ? "text-red-600" : "text-amber-700"}`}>{task.cash_note}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-orange-600 font-semibold">-</span>
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${amount < 0 ? "text-red-600" : "text-green-600"}`}>{amount.toFixed(2)} د.أ</span>
                          </TableCell>
                          <TableCell>
                            {amount < 0 ? (
                              <Badge className="bg-red-100 text-red-700 border-red-300">مبلغ مدفوع</Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-300">مبلغ مستلم</Badge>
                            )}
                          </TableCell>
                          <TableCell className="print:hidden">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveFromSession(task.id)}
                              disabled={actionLoading}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    }

                    return (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.shipments?.description || "-"}</TableCell>
                        <TableCell>{task.shipments?.receiver_name || "-"}</TableCell>
                        <TableCell>
                          {editingTaskId === task.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingFeeValue}
                                onChange={(e) => setEditingFeeValue(e.target.value)}
                                className="w-20 h-8 text-sm p-1 text-center"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveSingleFee(task.id)
                                  if (e.key === "Escape") handleCancelEditFee()
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveSingleFee(task.id)}
                                disabled={actionLoading}
                                className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEditFee}
                                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                              >
                                <span className="text-lg leading-none">&times;</span>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-orange-600 font-semibold">
                              {Number(task.driver_fee || 0).toFixed(2)} د.أ
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className={driverCollects ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                              {driverCollects ? `${amount.toFixed(2)} د.أ` : "-"}
                            </span>
                            {driverCollects && <span className="text-xs text-muted-foreground">يحصلها السائق</span>}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell className="print:hidden">
                          <div className="flex gap-1">
                            {task.status !== "delivered" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConfirmDelivery(task.id)}
                                disabled={actionLoading}
                                className="text-green-600 hover:bg-green-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReturnToTasks(task.id)}
                              disabled={actionLoading}
                              className="text-orange-600 hover:bg-orange-50"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEditFee(task.id, Number(task.driver_fee || 0))}
                              disabled={actionLoading || editingTaskId === task.id}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveFromSession(task.id)}
                              disabled={actionLoading}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Approve Button */}
        {!session.is_approved && (
          <div className="flex justify-center print:hidden">
            <Button
              size="lg"
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 ml-2" />
              )}
              اعتماد الجلسة
            </Button>
          </div>
        )}
      </div>

      {/* Edit Fees Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل أجور الشحنات</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {tasks.map((task: any) => (
              <div key={task.id} className="flex items-center justify-between gap-4 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{task.shipments?.description || "-"}</p>
                  <p className="text-sm text-muted-foreground">{task.shipments?.receiver_name || "-"}</p>
                </div>
                <div className="w-32">
                  <Label className="text-xs">أجرة السائق</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editFees[task.id] || "0"}
                    onChange={(e) => setEditFees({ ...editFees, [task.id]: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveFees} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : null}
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cash Receipt Dialog */}
      <Dialog open={cashReceiptOpen} onOpenChange={setCashReceiptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-amber-600" />
              استلام مبلغ مالي
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>المبلغ (د.أ)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="أدخل المبلغ (سالب = مدفوع)"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="mt-1 text-lg text-center"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCashReceipt()
                }}
              />
            </div>
            <div>
              <Label>ملاحظة (اختياري)</Label>
              <Input
                type="text"
                placeholder="ملاحظة عن المبلغ"
                value={cashNote}
                onChange={(e) => setCashNote(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCashReceiptOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleAddCashReceipt} 
              disabled={actionLoading || !cashAmount}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Banknote className="w-4 h-4 ml-2" />}
              تأكيد الاستلام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminFooter backUrl={`/drivers/${driverId}/sessions`} backLabel="الجلسات" previousUrl={returnUrl} />
    </div>
  )
}
