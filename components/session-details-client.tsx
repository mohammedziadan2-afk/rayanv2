"use client"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Package, User, Hash, Check, ArrowLeft, Printer, Save, Edit, Trash2 } from "lucide-react"
import {
  approveDriverSession,
  returnShipmentToTasks,
  confirmShipmentDelivery,
  updateDriverTask,
  recalculateApprovedSession,
  updateApprovedSessionFees,
  deleteDriverSession, // Import deleteDriverSession
} from "@/app/actions/drivers"

interface SessionDetailsClientProps {
  driver: any
  session: any
  tasks: any[]
}

export function SessionDetailsClient({ driver, session, tasks: initialTasks }: SessionDetailsClientProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [loading, setLoading] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ [key: string]: { driver_fee: number; status: string } }>({})
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editSessionFees, setEditSessionFees] = useState<{ [key: string]: number }>({})

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

  const handleStartEdit = (taskId: string, currentFee: number, currentStatus: string) => {
    setEditingTask(taskId)
    setEditValues({
      ...editValues,
      [taskId]: { driver_fee: currentFee, status: currentStatus },
    })
  }

  const handleSaveEdit = async (taskId: string) => {
    setLoading(true)
    const values = editValues[taskId]
    const result = await updateDriverTask(taskId, {
      driver_fee: values.driver_fee,
      status: values.status,
      completed_date: values.status === "delivered" ? new Date().toISOString() : undefined,
    })

    if (result.success) {
      setEditingTask(null)
      router.refresh()
    }
    setLoading(false)
  }

  const handleCancelEdit = () => {
    setEditingTask(null)
  }

  const handleConfirmDelivery = async (taskId: string) => {
    setLoading(true)
    const result = await confirmShipmentDelivery(taskId)
    if (result.success) {
      router.refresh()
    }
    setLoading(false)
  }

  const handleReturnToTasks = async (taskId: string) => {
    if (!confirm("هل أنت متأكد من إرجاع هذه الشحنة إلى جدول المهام؟")) return

    setLoading(true)
    const result = await returnShipmentToTasks(taskId)
    if (result.success) {
      alert("تم إرجاع الشحنة إلى جدول المهام بنجاح")
      router.refresh()
    }
    setLoading(false)
  }

  const handleApproveSession = async () => {
    if (!confirm("هل أنت متأكد من اعتماد هذه الجلسة؟ لن يمكن التعديل عليها بعد الاعتماد.")) return

    setLoading(true)
    const result = await approveDriverSession(session.id)
    if (result.success && result.data) {
      const totalRevenue = Number(result.data.total_revenue) || 0
      const totalDriverFee = Number(result.data.total_driver_fee) || 0
      const remainingCollection = Number(result.data.remaining_collection) || 0

      alert(
        `تم اعتماد الجلسة بنجاح\n\nإجمالي الإيرادات: ${totalRevenue.toFixed(2)} د.أ\nأجرة السائق: ${totalDriverFee.toFixed(2)} د.أ\nباقي التحصيل: ${remainingCollection.toFixed(2)} د.أ`,
      )
      router.refresh()
    } else {
      alert(result.error || "فشل في اعتماد الجلسة")
    }
    setLoading(false)
  }

  const handleRecalculate = async () => {
    if (!confirm("هل تريد إعادة حساب ملخص الجلسة؟")) return

    setLoading(true)
    const result = await recalculateApprovedSession(session.id)
    if (result.success) {
      alert("تم إعادة حساب الملخص بنجاح")
      router.refresh()
    } else {
      alert("فشل في إعادة حساب الملخص")
    }
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    router.push(`/drivers/${driver.id}`)
  }

  const handleOpenEditDialog = () => {
    const initialFees: { [key: string]: number } = {}
    tasks.forEach((task) => {
      initialFees[task.id] = task.driver_fee || 0
    })
    setEditSessionFees(initialFees)
    setIsEditDialogOpen(true)
  }

  const handleSaveSessionFees = async () => {
    if (!confirm("هل أنت متأكد من حفظ التعديلات؟ سيتم إعادة حساب الملخص تلقائياً.")) return

    setLoading(true)
    const updates = tasks.map((task) => ({
      taskId: task.id,
      driverFee: editSessionFees[task.id] ?? task.driver_fee ?? 0,
    }))

    const result = await updateApprovedSessionFees(session.id, updates)
    if (result.success) {
      alert("تم حفظ التعديلات وإعادة حساب الملخص بنجاح")
      setIsEditDialogOpen(false)
      router.refresh()
    } else {
      alert("فشل في حفظ التعديلات")
    }
    setLoading(false)
  }

  const handleDeleteSession = async () => {
    const confirmMessage = session.is_approved
      ? "هل أنت متأكد من حذف هذه الجلسة المعتمدة؟ سيتم إرجاع جميع الشحنات إلى المهام الحالية وإعادة ترتيب أرقام الجلسات."
      : "هل أنت متأكد من حذف هذه الجلسة؟ سيتم إرجاع جميع الشحنات إلى المهام الحالية."

    if (!confirm(confirmMessage)) return

    setLoading(true)
    const result = await deleteDriverSession(session.id)
    if (result.success) {
      alert("تم حذف الجلسة بنجاح وإرجاع الشحنات إلى المهام الحالية")
      router.push(`/drivers/${driver.id}`)
    } else {
      alert(result.error || "فشل في حذف الجلسة")
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto py-8 print-content">
      <div className="hidden print:block mb-8 border-b-2 border-primary pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">شركة الريان للشحن</h1>
              <p className="text-muted-foreground">Al-Rayan Shipping Company</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground">تاريخ الطباعة</p>
            <p className="font-semibold">{new Date().toLocaleDateString("ar-EG")}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          رجوع
        </Button>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleDeleteSession}
            disabled={loading}
            className="flex-1 sm:flex-none bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50 border-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            حذف الجلسة
          </Button>
          {session.is_approved && (
            <>
              <Button
                variant="outline"
                onClick={handleOpenEditDialog}
                disabled={loading}
                className="flex-1 sm:flex-none bg-transparent"
              >
                <Edit className="w-4 h-4 mr-2" />
                تعديل الجلسة
              </Button>
              <Button
                variant="outline"
                onClick={handleRecalculate}
                disabled={loading}
                className="flex-1 sm:flex-none bg-transparent"
              >
                <Save className="w-4 h-4 mr-2" />
                إعادة حساب الملخص
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handlePrint} className="flex-1 sm:flex-none bg-transparent">
            <Printer className="w-4 h-4 mr-2" />
            طباعة
          </Button>
        </div>
      </div>

      <div className="hidden print:block mb-4 p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <span className="font-semibold">السائق:</span>
          <span>{driver.name}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              جلسة رقم {session.session_number} - {new Date(session.session_date).toLocaleDateString("ar-EG")}
              {session.is_approved && (
                <Badge className="bg-green-600 mr-2">
                  <Check className="w-3 h-3 mr-1" />
                  معتمدة
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">عدد الشحنات المسلمة</p>
              <p className="text-2xl font-bold">{session.delivered_count || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">مجموع الإيرادات</p>
              <p className="text-2xl font-bold text-green-600">{Number(session.total_revenue || 0).toFixed(2)} د.أ</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">أجرة السائق</p>
              <p className="text-2xl font-bold text-orange-600">
                {Number(session.total_driver_fee || 0).toFixed(2)} د.أ
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">باقي التحصيل</p>
              <p className="text-2xl font-bold text-blue-600">
                {Number(session.remaining_collection || 0).toFixed(2)} د.أ
              </p>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم التتبع</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">المستلم</TableHead>
                  <TableHead className="text-right">أجرة السائق</TableHead>
                  <TableHead className="text-right">إيراد السائق</TableHead>
                  {!session.is_approved && <TableHead className="text-right print:hidden">إجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const collectionMethod = task.shipments?.collection_method || "driver"
                  const wasOriginallyPaid = task.original_payment_status === "paid"
                  const displayAmount = wasOriginallyPaid ? Number(task.shipments?.amount || 0) : 0

                  let driverRevenue = 0

                  // إذا "يحصلها السائق" → القيمة الفعلية تدخل في الإيراد
                  if (collectionMethod === "driver") {
                    driverRevenue = Number(task.shipments?.amount || 0)
                  }
                  // إذا "حصلت في المكتب" → القيمة = 0

                  // إضافة أجرة السائق إذا كانت غير شاملة التوصيل
                  if (task.delivery_type === "not_included") {
                    driverRevenue += Number(task.driver_fee || 0)
                  }

                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.shipments?.tracking_number || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{task.shipments?.description || "-"}</TableCell>
                      <TableCell>{task.shipments?.receiver_name || "-"}</TableCell>
                      <TableCell>
                        {!session.is_approved && editingTask === task.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editValues[task.id]?.driver_fee || 0}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                [task.id]: {
                                  ...editValues[task.id],
                                  driver_fee: Number.parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-24"
                          />
                        ) : (
                          <span>{(Number(task.driver_fee) || 0).toFixed(2)} د.أ</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={
                              driverRevenue > 0 ? "text-green-600 font-semibold" : "text-gray-500 font-semibold"
                            }
                          >
                            {driverRevenue.toFixed(2)} د.أ
                          </span>
                          {collectionMethod === "office" ? (
                            <span className="text-xs text-gray-600 font-medium">حصلت في المكتب</span>
                          ) : (
                            <span className="text-xs text-blue-600">يحصلها السائق</span>
                          )}
                        </div>
                      </TableCell>
                      {!session.is_approved && (
                        <TableCell className="print:hidden">
                          <div className="flex gap-2">
                            {editingTask === task.id ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                  onClick={() => handleSaveEdit(task.id)}
                                  disabled={loading}
                                >
                                  <Save className="w-4 h-4 mr-1" />
                                  حفظ
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={loading}>
                                  إلغاء
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                  onClick={() => handleStartEdit(task.id, task.driver_fee || 0, task.status)}
                                  disabled={loading}
                                >
                                  تعديل
                                </Button>
                                {task.status !== "delivered" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                    onClick={() => handleConfirmDelivery(task.id)}
                                    disabled={loading}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    تم
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                                  onClick={() => handleReturnToTasks(task.id)}
                                  disabled={loading}
                                >
                                  <ArrowLeft className="w-4 h-4 mr-1" />
                                  إرجاع
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {!session.is_approved && tasks.length > 0 && (
            <div className="flex justify-end pt-4 border-t print:hidden">
              <Button
                onClick={handleApproveSession}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
                disabled={loading}
              >
                <Check className="w-5 h-5 mr-2" />
                اعتماد الجلسة
              </Button>
            </div>
          )}

          <div className="hidden print:block mt-8 pt-6 border-t-2 border-primary">
            <div className="text-center text-sm text-muted-foreground">
              <p>شركة الريان للشحن - Al-Rayan Shipping Company</p>
              <p className="mt-1">تم الطباعة بتاريخ: {new Date().toLocaleString("ar-EG")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل أجور السائق</DialogTitle>
            <DialogDescription>قم بتعديل أجرة السائق لكل شحنة. يمكنك إدخال قيمة صفر أيضاً.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التتبع</TableHead>
                  <TableHead>المستلم</TableHead>
                  <TableHead>أجرة السائق الحالية</TableHead>
                  <TableHead>أجرة السائق الجديدة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const collectionMethod = task.shipments?.collection_method || "driver"
                  const wasOriginallyPaid = task.original_payment_status === "paid"
                  const displayAmount = wasOriginallyPaid ? Number(task.shipments?.amount || 0) : 0

                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.shipments?.tracking_number || "-"}</TableCell>
                      <TableCell>{task.shipments?.receiver_name || "-"}</TableCell>
                      <TableCell>{(Number(task.driver_fee) || 0).toFixed(2)} د.أ</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editSessionFees[task.id] ?? task.driver_fee ?? 0}
                          onChange={(e) =>
                            setEditSessionFees({
                              ...editSessionFees,
                              [task.id]: Number.parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-32"
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={loading}>
              إلغاء
            </Button>
            <Button onClick={handleSaveSessionFees} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          
          body > * {
            display: none !important;
          }
          
          body .print-content {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-width: 210mm !important;
            max-height: 297mm !important;
            padding: 10mm !important;
            margin: 0 !important;
            overflow: hidden !important;
            font-family: 'Arial', sans-serif !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print-content .hidden.print\\:block:first-child {
            margin-bottom: 5mm !important;
            padding-bottom: 4mm !important;
            border-bottom: 2px solid #333 !important;
          }
          
          .print-content h1 {
            font-size: 18pt !important;
            margin-bottom: 2mm !important;
            color: #1a365d !important;
          }
          
          .print-content table th:nth-child(1),
          .print-content table td:nth-child(1),
          .print-content table th:nth-child(4),
          .print-content table td:nth-child(4),
          .print-content table th:nth-child(6),
          .print-content table td:nth-child(6),
          .print-content table th:nth-child(7),
          .print-content table td:nth-child(7),
          .print-content table th:nth-child(8),
          .print-content table td:nth-child(8) {
            display: none !important;
          }
          
          .print-content p {
            font-size: 10pt !important;
            margin: 0 !important;
          }
          
          .print-content .text-3xl {
            font-size: 18pt !important;
          }
          
          .print-content .text-2xl {
            font-size: 14pt !important;
          }
          
          .print-content .text-xl {
            font-size: 12pt !important;
          }
          
          .print-content .text-lg {
            font-size: 11pt !important;
          }
          
          .print-content .text-base {
            font-size: 10pt !important;
          }
          
          .print-content .text-sm {
            font-size: 9pt !important;
          }
          
          .print-content .text-xs {
            font-size: 8pt !important;
          }
          
          .print-content .grid-cols-4 {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 3mm !important;
            margin-bottom: 5mm !important;
            padding: 3mm !important;
            background-color: #f3f4f6 !important;
            border-radius: 2mm !important;
          }
          
          .print-content .grid-cols-4 > div {
            text-align: center !important;
            padding: 2mm !important;
          }
          
          .print-content table {
            font-size: 9pt !important;
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 0 !important;
            border: 1px solid #ddd !important;
          }
          
          .print-content th {
            padding: 2mm !important;
            font-size: 10pt !important;
            font-weight: 600 !important;
            background-color: #e5e7eb !important;
            border: 1px solid #ddd !important;
          }
          
          .print-content td {
            padding: 2mm !important;
            font-size: 9pt !important;
            border: 1px solid #ddd !important;
          }
          
          .print-content .mt-8.pt-6.border-t-2 {
            position: absolute !important;
            bottom: 10mm !important;
            left: 10mm !important;
            right: 10mm !important;
            margin-top: 5mm !important;
            padding-top: 3mm !important;
            border-top: 2px solid #333 !important;
            text-align: center !important;
          }
          
          .print-content .mt-8.pt-6.border-t-2 p {
            font-size: 9pt !important;
            margin: 1mm 0 !important;
            color: #666 !important;
          }
          
          .print-content .space-y-6 > * + * {
            margin-top: 4mm !important;
          }
          
          .print-content .w-20,
          .print-content .h-20 {
            width: 18mm !important;
            height: 18mm !important;
          }
          
          .print-content .w-12,
          .print-content .h-12 {
            width: 12mm !important;
            height: 12mm !important;
          }
          
          .print-content .w-5,
          .print-content .h-5 {
            width: 5mm !important;
            height: 5mm !important;
          }
        }
      `}</style>
    </div>
  )
}
