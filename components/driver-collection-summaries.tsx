"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, FileText, Calendar, PhoneIcon, Printer } from "lucide-react"
import Link from "next/link"
import { getSessionTasks } from "@/app/actions/drivers"

interface Session {
  id: string
  session_number: number
  session_date: string
  total_revenue: number
  total_driver_fee: number
  remaining_collection: number
  delivered_count: number
  is_collected: boolean
  approved_at: string
}

interface Driver {
  id: string
  name: string
  phone?: string
}

interface DriverCollectionSummariesProps {
  driver: Driver
  sessions: Session[]
}

export function DriverCollectionSummaries({ driver, sessions }: DriverCollectionSummariesProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sessionTasks, setSessionTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const printContentRef = useRef<HTMLDivElement>(null)

  const handleOpenSession = async (session: Session) => {
    setSelectedSession(session)
    setLoading(true)
    setDialogOpen(true)

    try {
      const tasks = await getSessionTasks(String(session.id))
      setSessionTasks(tasks || [])
    } catch (error) {
      console.error("Error fetching session tasks:", error)
      setSessionTasks([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "غير محدد"
    return new Date(dateStr).toLocaleDateString("ar-JO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handlePrint = () => {
    if (!printContentRef.current || !selectedSession) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للطباعة")
      return
    }

    const totalRevenue = Number(selectedSession.total_revenue || 0).toFixed(2)
    const totalDriverFee = Number(selectedSession.total_driver_fee || 0).toFixed(2)
    const remainingCollection = Number(selectedSession.remaining_collection || 0).toFixed(2)

    let rowsHtml = ""
    let rowIndex = 0
    sessionTasks.forEach((task) => {
      rowIndex++
      const isCashReceipt = task.task_type === "cash_receipt"

      if (isCashReceipt) {
        const cashAmount = Number(task.cash_amount || 0)
        const isNeg = cashAmount < 0
        rowsHtml += `
          <tr class="${isNeg ? "row-paid" : "row-received"}">
            <td class="col-idx">${rowIndex}</td>
            <td class="col-name"><strong>${isNeg ? "مبلغ مدفوع" : "مبلغ مستلم"}</strong></td>
            <td class="col-desc">${task.description || task.note || "-"}</td>
            <td class="col-status"><span class="badge ${isNeg ? "b-paid" : "b-received"}">${isNeg ? "مبلغ مدفوع" : "مبلغ مستلم"}</span></td>
            <td class="col-amount"><strong style="color:${isNeg ? "#dc2626" : "#16a34a"};">${cashAmount.toFixed(2)}</strong></td>
            <td class="col-fee">0.00</td>
          </tr>
        `
        return
      }

      const collectionMethod = task.shipments?.collection_method || "driver"
      const driverCollects = collectionMethod === "driver"
      const shipmentAmount = Number(task.shipments?.amount || task.shipments?.price || 0)
      const driverFee = Number(task.driver_fee) || 0

      rowsHtml += `
        <tr class="${driverCollects ? "row-collect" : ""}">
          <td class="col-idx">${rowIndex}</td>
          <td class="col-name">
            <strong>${task.shipments?.receiver_name || "غير محدد"}</strong>
            ${task.shipments?.receiver_phone ? `<span class="phone" dir="ltr">${task.shipments.receiver_phone}</span>` : ""}
          </td>
          <td class="col-desc">${task.shipments?.description || "بدون وصف"}</td>
          <td class="col-status"><span class="badge ${driverCollects ? "b-collect" : "b-transfer"}">${driverCollects ? "يحصّل" : "محوّل"}</span></td>
          <td class="col-amount"><strong>${driverCollects ? shipmentAmount.toFixed(2) : "0.00"}</strong></td>
          <td class="col-fee">${driverFee.toFixed(2)}</td>
        </tr>
      `
    })

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>ملخص التحصيلات - جلسة رقم ${selectedSession.session_number}</title>
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
          .col-desc { width: 34%; color: #4b5563; }
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
            <h1>ملخص التحصيلات - جلسة رقم ${selectedSession.session_number}</h1>
            <p>تاريخ الجلسة: ${formatDate(selectedSession.session_date || selectedSession.approved_at)}</p>
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

          <div class="section-title">تفاصيل الشحنات (${sessionTasks.length} شحنة)</div>
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
            <p>تم إنشاء هذا التقرير بواسطة نظام الريان للشحن - ${new Date().toLocaleDateString("ar-JO")}</p>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {driver.name?.charAt(0) || "؟"}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mt-3">{driver.name}</h1>
        <p className="text-center text-cyan-100 mt-1">ملخصات التحصيلات السابقة</p>
        <div className="flex justify-center mt-3">
          <Badge className="bg-white/20 text-white">{sessions.length} جلسة معتمدة</Badge>
        </div>
      </div>

      {/* Sessions List */}
      <div className="p-4 space-y-3 mt-4">
        {sessions.length === 0 ? (
          <Card className="bg-gray-50">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">لا يوجد جلسات معتمدة لهذا السائق</p>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card
              key={session.id}
              className="hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
              onClick={() => handleOpenSession(session)}
            >
              <div className={`h-1 ${session.is_collected ? "bg-green-500" : "bg-orange-500"}`} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-cyan-600 border-cyan-600">
                      جلسة رقم {session.session_number}
                    </Badge>
                    {session.is_collected ? (
                      <Badge className="bg-green-100 text-green-700">مقبوضة</Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-700">غير مقبوضة</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(session.session_date || session.approved_at)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">الإيرادات</p>
                    <p className="font-bold text-green-600">{Number(session.total_revenue || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">أجرة السائق</p>
                    <p className="font-bold text-orange-600">{Number(session.total_driver_fee || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">المتبقي</p>
                    <p className="font-bold text-red-600">{Number(session.remaining_collection || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                  <span>{session.delivered_count || 0} شحنة مسلّمة</span>
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Session Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-cyan-600">
              ملخص التحصيلات - جلسة رقم {selectedSession?.session_number}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600"></div>
            </div>
          ) : (
            <div className="space-y-4" ref={printContentRef}>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handlePrint}>
                  <Printer className="w-4 h-4" />
                  طباعة / حفظ PDF
                </Button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">مجموع الإيرادات</p>
                  <p className="text-lg font-bold text-green-600">
                    {Number(selectedSession?.total_revenue || 0).toFixed(2)} د.أ
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">أجرة السائق</p>
                  <p className="text-lg font-bold text-orange-600">
                    {Number(selectedSession?.total_driver_fee || 0).toFixed(2)} د.أ
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">باقي التحصيل</p>
                  <p className="text-lg font-bold text-red-600">
                    {Number(selectedSession?.remaining_collection || 0).toFixed(2)} د.أ
                  </p>
                </div>
              </div>

              {/* Shipment Details */}
              {sessionTasks.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">تفاصيل الشحنات</h3>
                  {sessionTasks.map((task, index) => {
                    const isCashReceipt = task.task_type === "cash_receipt"

                    if (isCashReceipt) {
                      const cashAmount = Number(task.cash_amount || 0)
                      const isNegative = cashAmount < 0
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${isNegative ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className={`font-semibold text-sm ${isNegative ? "text-red-700" : "text-amber-700"}`}>
                              {isNegative ? "مبلغ مدفوع" : "مبلغ مستلم"}
                            </p>
                            <Badge className={`text-xs ${isNegative ? "bg-red-100 text-red-700 border-red-300" : "bg-amber-100 text-amber-700 border-amber-300"}`}>
                              {isNegative ? "مبلغ مدفوع" : "مبلغ مستلم"}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>
                              المبلغ: <strong className={isNegative ? "text-red-600" : "text-green-600"}>{cashAmount.toFixed(2)}</strong> د.أ
                            </span>
                            <span>
                              الأجرة: <strong>0.00</strong> د.أ
                            </span>
                          </div>
                        </div>
                      )
                    }

                    const collectionMethod = task.shipments?.collection_method || "driver"
                    const driverCollects = collectionMethod === "driver"
                    const shipmentAmount = Number(task.shipments?.amount || task.shipments?.price || 0)
                    const driverFee = Number(task.driver_fee) || 0

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          driverCollects ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-sm">{task.shipments?.receiver_name || "غير محدد"}</p>
                            {task.shipments?.receiver_phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <PhoneIcon className="w-3 h-3" />
                                <span dir="ltr">{task.shipments.receiver_phone}</span>
                              </div>
                            )}
                          </div>
                          {driverCollects ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">يحصّل</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              محوّل
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {task.shipments?.description || "بدون وصف"}
                        </p>
                        <div className="flex justify-between items-center text-sm">
                          <span>
                            المبلغ: <strong>{driverCollects ? Number(shipmentAmount).toFixed(2) : "0.00"}</strong> د.أ
                          </span>
                          <span>
                            الأجرة: <strong>{driverFee.toFixed(2)}</strong> د.أ
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">لا يوجد تفاصيل شحنات</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <Link href="/admin/collection-summaries">
          <Button variant="outline" className="w-full gap-2 bg-transparent">
            <ChevronLeft className="w-4 h-4 rotate-180" />
            العودة لقائمة السائقين
          </Button>
        </Link>
      </div>
    </div>
  )
}
