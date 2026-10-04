"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Loader2, Printer } from "lucide-react"
import { DriverShipmentDialog } from "@/components/driver-shipment-dialog"
import { getDriverTasks, getSessionTasks } from "@/app/actions/drivers"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { PhoneIcon, FileTextIcon, ChevronDown, ChevronUp } from "lucide-react"

interface Driver {
  id: string
  name: string
}

interface Session {
  id: string | number
  session_number: number
  session_date: string
  is_approved?: boolean
  total_revenue?: number
  total_driver_fee?: number
  remaining_collection?: number
}

interface Task {
  id: string
  status: string
  delivery_type: string
  driver_fee?: number
  shipments?: {
    tracking_number: string
    receiver_name: string
    receiver_phone: string
    receiver_address: string
    amount: number
    description?: string
    payment_status?: string
    collection_method?: string
    price?: number
  }
  session_id?: string
}

interface DriverViewClientProps {
  driver: Driver
  initialTasks: Task[]
  session?: Session | null
  approvedSessions?: Session[]
}

export default function DriverViewClient({
  driver,
  initialTasks,
  session,
  approvedSessions = [],
}: DriverViewClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false)
  const [selectedApprovedSession, setSelectedApprovedSession] = useState<Session | null>(null)
  const [approvedSessionTasks, setApprovedSessionTasks] = useState<Task[]>([])
  const [loadingApprovedTasks, setLoadingApprovedTasks] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isApprovedSessionsOpen, setIsApprovedSessionsOpen] = useState(false)

  useEffect(() => {
    const handleTasksUpdate = async () => {
      try {
        if (session) {
          const updatedTasks = await getDriverTasks(driver.id)
          const sessionTasks = updatedTasks.filter((t: any) => t.session_id === session.id && t.status !== "postponed")
          setTasks(sessionTasks)
        }
      } catch (error) {
        console.error("Error updating tasks:", error)
      }
    }

    window.addEventListener("driverTasksUpdated", handleTasksUpdate)

    return () => {
      window.removeEventListener("driverTasksUpdated", handleTasksUpdate)
    }
  }, [driver.id, session])

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (!window.location.pathname.startsWith("/driver-view/")) {
        e.preventDefault()
        window.history.pushState(null, "", window.location.href)
      }
    }

    window.history.pushState(null, "", window.location.href)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  useEffect(() => {
    const handleTasksUpdated = () => {
      // إعادة جلب المهام عند التحديث من صفحة أخرى
      if (driver?.id) {
        getDriverTasks(driver.id).then((updatedTasks) => {
          if (session) {
            const sessionTasks = updatedTasks.filter(
              (t: any) =>
                t.session_id === session.id &&
                t.status !== "delivered" &&
                t.status !== "postponed" &&
                t.status !== "rejected" &&
                t.status !== "refused",
            )
            setTasks(sessionTasks)
          }
        })
      }
    }

    window.addEventListener("driverTasksUpdated", handleTasksUpdated)
    return () => {
      window.removeEventListener("driverTasksUpdated", handleTasksUpdated)
    }
  }, [driver?.id, session])

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setDialogOpen(true)
  }

  const handleUpdate = async () => {
    try {
      if (session) {
        const updatedTasks = await getDriverTasks(driver.id)
        const sessionTasks = updatedTasks.filter(
          (t: any) =>
            t.session_id === session.id &&
            t.status !== "delivered" &&
            t.status !== "postponed" &&
            t.status !== "rejected" &&
            t.status !== "refused",
        )
        setTasks(sessionTasks)
      }
    } catch (error) {
      console.error("Error updating tasks:", error)
    }
  }

  const handleOpenApprovedSessionSummary = async (approvedSession: Session) => {
    setSelectedApprovedSession(approvedSession)
    setLoadingApprovedTasks(true)
    setFetchError(null)
    setSummaryDialogOpen(true)

    try {
      const sessionIdStr = String(approvedSession.id)
      console.log("[v0] Fetching tasks for session:", sessionIdStr)

      const sessionTasks = await getSessionTasks(sessionIdStr)
      console.log("[v0] Received session tasks:", sessionTasks)

      setApprovedSessionTasks(sessionTasks || [])
    } catch (error) {
      console.error("[v0] Error fetching session tasks:", error)
      setFetchError("حدث خطأ أثناء تحميل بيانات الجلسة")
      setApprovedSessionTasks([])
    } finally {
      setLoadingApprovedTasks(false)
    }
  }

  const handlePrintApprovedSession = () => {
    if (!selectedApprovedSession || !approvedSessionSummary) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للطباعة")
      return
    }

    const totalRevenue = Number(
      selectedApprovedSession.total_revenue ?? approvedSessionSummary.totalRevenue ?? 0,
    ).toFixed(2)
    const totalDriverFee = Number(
      selectedApprovedSession.total_driver_fee ?? approvedSessionSummary.totalDriverFee ?? 0,
    ).toFixed(2)
    const remainingCollection = Number(
      selectedApprovedSession.remaining_collection ?? approvedSessionSummary.remainingCollection ?? 0,
    ).toFixed(2)

    const formatDate = (dateStr: string) => {
      if (!dateStr) return "غير محدد"
      return new Date(dateStr).toLocaleDateString("ar-JO", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }

    let rowsHtml = ""
    let rowIndex = 0
    approvedSessionSummary.shipmentDetails.forEach((shipment) => {
      rowIndex++
      if (shipment.isCashReceipt) {
        const isNeg = (shipment.cashAmount || 0) < 0
        rowsHtml += `
          <tr class="${isNeg ? "row-paid" : "row-received"}">
            <td class="col-idx">${rowIndex}</td>
            <td class="col-name"><strong>${isNeg ? "مبلغ مدفوع" : "مبلغ مستلم"}</strong></td>
            <td class="col-desc">${shipment.cashNote || "-"}</td>
            <td class="col-status"><span class="badge ${isNeg ? "b-paid" : "b-received"}">${isNeg ? "مبلغ مدفوع" : "مبلغ مستلم"}</span></td>
            <td class="col-amount"><strong style="color:${isNeg ? "#dc2626" : "#16a34a"};">${Number(shipment.cashAmount || 0).toFixed(2)}</strong></td>
            <td class="col-fee">0.00</td>
          </tr>
        `
        return
      }
      rowsHtml += `
        <tr class="${shipment.driverCollects ? "row-collect" : ""}">
          <td class="col-idx">${rowIndex}</td>
          <td class="col-name">
            <strong>${shipment.receiverName}</strong>
            ${shipment.receiverPhone ? `<span class="phone" dir="ltr">${shipment.receiverPhone}</span>` : ""}
          </td>
          <td class="col-desc">${shipment.description}</td>
          <td class="col-status"><span class="badge ${shipment.driverCollects ? "b-collect" : "b-transfer"}">${shipment.driverCollects ? "يحصّل" : "محوّل"}</span></td>
          <td class="col-amount"><strong>${Number(shipment.amount || 0).toFixed(2)}</strong></td>
          <td class="col-fee">${Number(shipment.driverFee || 0).toFixed(2)}</td>
        </tr>
      `
    })

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>ملخص التحصيلات - جلسة رقم ${selectedApprovedSession.session_number}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f1f5f9; color: #111827; }
          .sheet { width: 190mm; margin: 0 auto; padding: 6mm 0; }
          .header { text-align: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #0891b2; }
          .header h1 { color: #0891b2; font-size: 18px; margin-bottom: 4px; }
          .header p { color: #6b7280; font-size: 12px; }
          .driver-name { font-size: 14px; font-weight: 600; color: #374151; margin-top: 4px; }
          .summary-grid { display: flex; gap: 8px; margin-bottom: 14px; }
          .summary-item { flex: 1; text-align: center; padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc; }
          .summary-item p { font-size: 11px; color: #6b7280; margin-bottom: 2px; }
          .summary-item .value { font-size: 16px; font-weight: 700; }
          .green { color: #16a34a; }
          .orange { color: #ea580c; }
          .red { color: #dc2626; }
          .section-title { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          thead th { background: #0891b2; color: #fff; padding: 6px 5px; text-align: right; font-weight: 600; border: 1px solid #0e7490; }
          tbody td { padding: 5px; border: 1px solid #e5e7eb; vertical-align: middle; }
          tbody tr:nth-child(even) { background: #f9fafb; }
          .row-collect { background: #f0fdf4 !important; }
          .row-received { background: #fffbeb !important; }
          .row-paid { background: #fef2f2 !important; }
          .col-idx { text-align: center; width: 6%; color: #6b7280; }
          .col-name { width: 24%; }
          .col-name .phone { display: block; font-size: 10px; color: #6b7280; margin-top: 1px; }
          .col-desc { width: 34%; color: #4b5563; white-space: pre-line; }
          .col-status { width: 12%; text-align: center; }
          .col-amount { width: 12%; text-align: center; white-space: nowrap; }
          .col-fee { width: 12%; text-align: center; white-space: nowrap; color: #4b5563; }
          .badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600; }
          .b-collect { background: #dcfce7; color: #15803d; }
          .b-transfer { background: #f3f4f6; color: #374151; }
          .b-received { background: #fef3c7; color: #b45309; }
          .b-paid { background: #fee2e2; color: #b91c1c; }
          .footer { text-align: center; margin-top: 14px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
          .action-buttons { display: flex; justify-content: center; gap: 10px; padding: 12px; position: sticky; top: 0; background: #0891b2; z-index: 10; }
          .action-buttons button { padding: 10px 22px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; min-height: 44px; min-width: 110px; }
          .print-btn { background: #22c55e; color: white; }
          .close-btn { background: #ffffff; color: #0891b2; }
          @media print {
            body { background: #fff; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .sheet { width: 100%; padding: 0; }
            .action-buttons { display: none !important; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="action-buttons">
          <button class="print-btn" onclick="window.print()">طباعة / حفظ PDF</button>
          <button class="close-btn" onclick="window.close()">إغلاق</button>
        </div>

        <div class="sheet">
          <div class="header">
            <h1>ملخص التحصيلات - جلسة رقم ${selectedApprovedSession.session_number}</h1>
            <p>تاريخ الجلسة: ${formatDate(selectedApprovedSession.session_date)}</p>
            <p class="driver-name">السائق: ${driver.name}</p>
          </div>

          <div class="summary-grid">
            <div class="summary-item">
              <p>مجموع الإيرادات</p>
              <div class="value green">${totalRevenue} د.أ</div>
            </div>
            <div class="summary-item">
              <p>أجرة السائق</p>
              <div class="value orange">${totalDriverFee} د.أ</div>
            </div>
            <div class="summary-item">
              <p>باقي التحصيل</p>
              <div class="value red">${remainingCollection} د.أ</div>
            </div>
          </div>

          <div class="section-title">تفاصيل الشحنات (${approvedSessionSummary.shipmentDetails.length} شحنة)</div>
          <table>
            <thead>
              <tr>
                <th class="col-idx">#</th>
                <th class="col-name">المستلم</th>
                <th class="col-desc">الوصف</th>
                <th class="col-status">الحالة</th>
                <th class="col-amount">المبلغ (د.أ)</th>
                <th class="col-fee">الأجرة (د.أ)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="6" style="text-align:center; color:#6b7280; padding:16px;">لا يوجد تفاصيل شحنات</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            تم إنشاء هذا التقرير بواسطة نظام الريان للشحن - ${new Date().toLocaleDateString("en-GB")}
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
  }

  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== "delivered" && t.status !== "postponed")
  }, [tasks])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "from-green-500 to-green-600"
      case "rejected":
        return "from-red-500 to-red-600"
      case "postponed":
        return "from-yellow-500 to-yellow-600"
      case "refused":
        return "from-gray-500 to-gray-600"
      default:
        return "from-blue-500 to-indigo-600"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return { variant: "default" as const, text: "تم التسليم", className: "bg-green-600" }
      case "rejected":
        return { variant: "destructive" as const, text: "رفض التسليم", className: "" }
      case "postponed":
        return { variant: "secondary" as const, text: "مؤجل", className: "bg-yellow-600 text-white" }
      case "refused":
        return { variant: "secondary" as const, text: "مرفوض", className: "bg-gray-600 text-white" }
      default:
        return { variant: "secondary" as const, text: "قيد الانتظار", className: "" }
    }
  }

  const approvedSessionSummary = useMemo(() => {
    if (!selectedApprovedSession) return null

    const sessionTotalRevenue = selectedApprovedSession.total_revenue ?? 0
    const sessionTotalDriverFee = selectedApprovedSession.total_driver_fee ?? 0
    const sessionRemainingCollection = selectedApprovedSession.remaining_collection ?? 0

    if (approvedSessionTasks.length === 0) {
      return {
        totalRevenue: sessionTotalRevenue,
        totalDriverFee: sessionTotalDriverFee,
        remainingCollection: sessionRemainingCollection,
        shipmentDetails: [],
      }
    }

    let totalRevenue = 0
    let totalDriverFee = 0
    const shipmentDetails: Array<{
      receiverName: string
      receiverPhone: string
      description: string
      amount: number
      driverCollects: boolean
      driverFee: number
      isCashReceipt?: boolean
      cashAmount?: number
      cashNote?: string
    }> = []

    approvedSessionTasks.forEach((task) => {
      const isCashReceipt = task.task_type === "cash_receipt"

      if (isCashReceipt) {
        const cashAmount = Number(task.cash_amount || 0)
        totalRevenue += cashAmount
        shipmentDetails.push({
          receiverName: cashAmount < 0 ? "مبلغ مدفوع" : "مبلغ مستلم",
          receiverPhone: "",
          description: task.cash_note || (cashAmount < 0 ? "مبلغ نقدي مدفوع" : "مبلغ نقدي مستلم"),
          amount: cashAmount,
          driverCollects: true,
          driverFee: 0,
          isCashReceipt: true,
          cashAmount,
          cashNote: task.cash_note || "",
        })
        return
      }

      const deliveryType = task.delivery_type || "not_included"
      const shipmentAmount = Number(task.shipments?.amount || task.shipments?.price || 0)
      const driverFee = Number(task.driver_fee || 0)

      const collectionMethod = task.shipments?.collection_method || "driver"
      const driverCollects = deliveryType === "included" || collectionMethod === "driver"

      if (driverCollects && shipmentAmount > 0) {
        totalRevenue += shipmentAmount
      }

      totalDriverFee += driverFee

      shipmentDetails.push({
        receiverName: task.shipments?.receiver_name || "غير محدد",
        receiverPhone: task.shipments?.receiver_phone || "",
        description: task.shipments?.description || "بدون وصف",
        amount: driverCollects ? shipmentAmount : 0,
        driverCollects,
        driverFee,
      })
    })

    const remainingCollection = totalRevenue - totalDriverFee

    return {
      totalRevenue: totalRevenue > 0 ? totalRevenue : sessionTotalRevenue,
      totalDriverFee: totalDriverFee > 0 ? totalDriverFee : sessionTotalDriverFee,
      remainingCollection: totalRevenue > 0 ? remainingCollection : sessionRemainingCollection,
      shipmentDetails,
    }
  }, [approvedSessionTasks, selectedApprovedSession])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-center mb-4">{driver.name}</h1>
          {session && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-6 text-lg">
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <span>جلسة رقم {session.session_number}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <span>{new Date(session.session_date).toLocaleDateString("ar-EG")}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {approvedSessions.length > 0 && (
          <Collapsible
            open={isApprovedSessionsOpen}
            onOpenChange={setIsApprovedSessionsOpen}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <FileTextIcon className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-gray-700">ملخصات التحصيلات السابقة</span>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                    {approvedSessions.length}
                  </span>
                </div>
                {isApprovedSessionsOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="flex flex-wrap gap-2 justify-center border-t pt-4">
                {approvedSessions.map((approvedSession) => (
                  <Button
                    key={approvedSession.id}
                    onClick={() => handleOpenApprovedSessionSummary(approvedSession)}
                    variant="outline"
                    className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 hover:from-green-100 hover:to-emerald-100 text-green-700 font-semibold"
                  >
                    <FileTextIcon className="w-4 h-4 ml-2" />
                    جلسة {approvedSession.session_number} -{" "}
                    {new Date(approvedSession.session_date).toLocaleDateString("ar-EG")}
                  </Button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tasks.map((task) => {
            const statusBadge = getStatusBadge(task.status)
            const collectionMethod = task.shipments?.collection_method || "driver"
            const shipmentAmount = Number(task.shipments?.amount || task.shipments?.price || 0)

            const driverCollects = collectionMethod === "driver"
            const displayAmount = driverCollects ? shipmentAmount : 0

            return (
              <Card
                key={task.id}
                className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 border-2 hover:border-blue-500"
                onClick={() => handleTaskClick(task)}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <div
                    className={`w-16 h-16 mx-auto bg-gradient-to-br ${getStatusColor(task.status)} rounded-2xl flex items-center justify-center shadow-lg`}
                  >
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-bold text-base leading-tight whitespace-pre-line break-words">{task.shipments?.description || "شحنة بدون وصف"}</p>
                  <p className="text-xs text-muted-foreground break-words leading-snug">
                    {task.shipments?.receiver_address || "لا يوجد عنوان"}
                  </p>

                  {!driverCollects ? (
                    <>
                      <div className="text-lg font-bold text-gray-700 bg-gray-100 px-3 py-2 rounded">0 دينار</div>
                      <div className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-medium">
                        لا يوجد عليها تحصيل
                      </div>
                    </>
                  ) : (
                    <>
                      {displayAmount > 0 ? (
                        <>
                          <div className="text-lg font-bold text-purple-900 bg-purple-100 px-3 py-2 rounded">
                            {displayAmount} دينار
                          </div>
                          <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                            يحصلها السائق
                          </div>
                        </>
                      ) : (
                        <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
                          لم يتم تحديد المبلغ
                        </div>
                      )}
                    </>
                  )}

                  {task.delivery_type === "not_included" && task.driver_fee && (
                    <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                      غير شامل التوصيل - {task.driver_fee} د.أ
                    </div>
                  )}

                  <Badge variant={statusBadge.variant} className={`text-xs ${statusBadge.className}`}>
                    {statusBadge.text}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {pendingTasks.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-24 h-24 mx-auto text-gray-300 mb-4" />
            <p className="text-2xl text-gray-500">لا توجد شحنات قيد التنفيذ</p>
          </div>
        )}
      </div>

      {selectedTask && (
        <DriverShipmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          task={selectedTask}
          sessionId={session?.id}
          onUpdate={handleUpdate}
        />
      )}

      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-cyan-600">
              ملخص التحصيلات - جلسة رقم {selectedApprovedSession?.session_number}
            </DialogTitle>
          </DialogHeader>

          {loadingApprovedTasks ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="mr-2 text-gray-600">جاري تحميل البيانات...</span>
            </div>
          ) : fetchError ? (
            <div className="text-center py-10 text-red-500">{fetchError}</div>
          ) : approvedSessionSummary ? (
            <div className="space-y-4">
              {/* Print Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handlePrintApprovedSession}
                  className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                >
                  <Printer className="w-4 h-4" />
                  طباعة / حفظ PDF
                </Button>
              </div>

              {/* Summary Grid */}
              <div className="grid grid-cols-3 gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">مجموع الإيرادات</p>
                  <p className="text-lg font-bold text-green-600">
                    {Number(selectedApprovedSession?.total_revenue ?? approvedSessionSummary.totalRevenue ?? 0).toFixed(
                      2,
                    )}{" "}
                    د.أ
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">أجرة السائق</p>
                  <p className="text-lg font-bold text-orange-600">
                    {Number(
                      selectedApprovedSession?.total_driver_fee ?? approvedSessionSummary.totalDriverFee ?? 0,
                    ).toFixed(2)}{" "}
                    د.أ
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">باقي التحصيل</p>
                  <p className="text-lg font-bold text-red-600">
                    {Number(
                      selectedApprovedSession?.remaining_collection ?? approvedSessionSummary.remainingCollection ?? 0,
                    ).toFixed(2)}{" "}
                    د.أ
                  </p>
                </div>
              </div>

              {/* Shipment Details Header */}
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2 text-right">تفاصيل الشحنات</h3>

              {/* Shipment Cards */}
              {approvedSessionSummary.shipmentDetails.length > 0 ? (
                <div className="space-y-3">
                  {approvedSessionSummary.shipmentDetails.map((shipment, index) => {
                    if (shipment.isCashReceipt) {
                      const isNeg = (shipment.cashAmount || 0) < 0
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${isNeg ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className={`font-semibold text-sm ${isNeg ? "text-red-700" : "text-amber-700"}`}>
                                {isNeg ? "مبلغ مدفوع" : "مبلغ مستلم"}
                              </p>
                              {shipment.cashNote && (
                                <p className={`text-xs mt-1 ${isNeg ? "text-red-600" : "text-amber-600"}`}>
                                  {shipment.cashNote}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${isNeg ? "bg-red-100 text-red-700 border-red-300" : "bg-amber-100 text-amber-700 border-amber-300"}`}
                            >
                              {isNeg ? "مبلغ مدفوع" : "مبلغ مستلم"}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100">
                            <span>
                              المبلغ:{" "}
                              <strong className={isNeg ? "text-red-600" : "text-green-600"}>
                                {Number(shipment.cashAmount || 0).toFixed(2)} د.أ
                              </strong>
                            </span>
                            <span>
                              الأجرة: <strong className="text-gray-400">0.00 د.أ</strong>
                            </span>
                          </div>
                        </div>
                      )
                    }

                    return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        shipment.driverCollects ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm">{shipment.receiverName}</p>
                          {shipment.receiverPhone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <PhoneIcon className="w-3 h-3" />
                              <span dir="ltr">{shipment.receiverPhone}</span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line break-words">{shipment.description}</p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            shipment.driverCollects
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-gray-100 text-gray-600 border-gray-300"
                          }`}
                        >
                          {shipment.driverCollects ? "يحصّل" : "محوّل"}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100">
                        <span>
                          المبلغ:{" "}
                          <strong className={shipment.driverCollects ? "text-green-700" : "text-gray-500"}>
                            {Number(shipment.amount || 0).toFixed(2)} د.أ
                          </strong>
                        </span>
                        <span>
                          الأجرة:{" "}
                          <strong className="text-orange-600">{Number(shipment.driverFee || 0).toFixed(2)} د.أ</strong>
                        </span>
                      </div>
                    </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد تفاصيل شحنات لهذه الجلسة</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { DriverViewClient }
