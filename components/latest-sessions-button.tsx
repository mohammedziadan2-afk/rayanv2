"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClipboardList, Users, Printer, X, AlertTriangle, CheckCircle2, Clock, DollarSign } from "lucide-react"
import { getLatestSessionsForAllDrivers } from "@/app/actions/drivers"

interface LatestSession {
  id: string
  driver_id: string
  session_number: number
  session_date: string
  is_approved: boolean
  is_collected: boolean
  total_revenue: number
  total_driver_fee: number
  remaining_collection: number
  delivered_count: number
  driver_name: string
  driver_phone?: string
}

export function LatestSessionsButton() {
  const [showDialog, setShowDialog] = useState(false)
  const [sessions, setSessions] = useState<LatestSession[]>([])
  const [loading, setLoading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const data = await getLatestSessionsForAllDrivers()
      setSessions(data)
    } catch (error) {
      console.error("Error fetching latest sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setShowDialog(true)
    fetchSessions()
  }

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML
      const printDate = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
      const iframe = document.createElement("iframe")
      iframe.style.position = "absolute"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "none"
      iframe.style.left = "-9999px"
      document.body.appendChild(iframe)
      const iframeDoc = iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(`
          <!DOCTYPE html>
          <html dir="rtl">
          <head>
            <title>ملخص آخر جلسات السائقين</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; direction: rtl; }
              h1 { text-align: center; margin-bottom: 20px; color: #0891b2; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: center; }
              th { background-color: #0891b2; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .status-approved { color: #16a34a; font-weight: bold; }
              .status-pending { color: #f59e0b; font-weight: bold; }
              .amount { font-weight: bold; color: #0891b2; }
              .print-date { text-align: center; color: #666; margin-top: 20px; font-size: 12px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <h1>ملخص آخر جلسات السائقين</h1>
            ${printContent}
            <p class="print-date">تاريخ الطباعة: ${printDate}</p>
          </body>
          </html>
        `)
        iframeDoc.close()
        setTimeout(() => {
          iframe.contentWindow?.print()
          setTimeout(() => {
            document.body.removeChild(iframe)
          }, 1000)
        }, 250)
      }
    }
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outline"
        className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3 md:px-4 py-2 h-auto bg-transparent"
      >
        <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
        <span className="truncate text-foreground">ملخص آخر جلسات</span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-center gap-2 text-xl">
              <ClipboardList className="w-6 h-6 text-cyan-600" />
              ملخص آخر جلسات السائقين
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto" ref={printRef}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>لا توجد جلسات مسجلة للسائقين</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
                      <th className="border border-cyan-700 px-3 py-3 text-center font-bold">#</th>
                      <th className="border border-cyan-700 px-3 py-3 text-center font-bold">اسم السائق</th>
                      <th className="border border-cyan-700 px-3 py-3 text-center font-bold">رقم الجلسة</th>
                      <th className="border border-cyan-700 px-3 py-3 text-center font-bold">باقي التحصيل</th>
                      <th className="border border-cyan-700 px-3 py-3 text-center font-bold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session, index) => (
                      <tr
                        key={session.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="border border-gray-200 px-3 py-3 text-center font-medium text-gray-600">
                          {index + 1}
                        </td>
                        <td className="border border-gray-200 px-3 py-3">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
                              {session.driver_name?.charAt(0) || "?"}
                            </div>
                            <span className="font-bold text-gray-800">{session.driver_name}</span>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-3 py-3 text-center">
                          <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
                            #{session.session_number || "-"}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-3 py-3 text-center">
                          <span className={`font-bold text-lg ${session.is_collected ? "text-green-600" : "text-cyan-700"}`}>
                            {session.is_collected ? "0.00" : Number(session.remaining_collection || 0).toFixed(2)} د.أ
                          </span>
                          {session.is_collected && (
                            <div className="text-xs text-green-500 mt-1">تم القبض</div>
                          )}
                        </td>
                        <td className="border border-gray-200 px-3 py-3 text-center">
                          {session.is_approved ? (
                            <div className="flex items-center justify-center gap-1 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="font-medium">معتمدة</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center justify-center gap-1 text-amber-600">
                                <Clock className="w-4 h-4" />
                                <span className="font-medium">غير معتمدة</span>
                              </div>
                              <span className="text-xs text-red-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                شحنات الجلسة غير مكتملة
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-cyan-50 font-bold">
                      <td colSpan={3} className="border border-gray-200 px-3 py-3 text-center text-cyan-800">
                        إجمالي باقي التحصيلات
                      </td>
                      <td className="border border-gray-200 px-3 py-3 text-center text-xl text-cyan-700">
                        {sessions.reduce((sum, s) => sum + (s.is_collected ? 0 : Number(s.remaining_collection || 0)), 0).toFixed(2)} د.أ
                      </td>
                      <td className="border border-gray-200 px-3 py-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex gap-3 pt-4 border-t mt-4">
            <Button
              onClick={handlePrint}
              className="flex-1 gap-2 bg-cyan-600 hover:bg-cyan-700"
              disabled={loading || sessions.length === 0}
            >
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="flex-1 gap-2 bg-transparent"
            >
              <X className="w-4 h-4" />
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
