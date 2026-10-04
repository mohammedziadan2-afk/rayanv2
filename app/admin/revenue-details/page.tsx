"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react"

interface ShipmentDetail {
  id: number
  tracking_number: string
  price: number
  driver_fee: number
  delivery_type: string
  original_payment_status: string
  current_payment_status: string
  should_include_in_revenue: boolean
  revenue_amount: number
}

interface SessionDetail {
  session_id: number
  driver_id: number
  driver_name: string
  total_revenue: number
  total_driver_fee: number
  remaining_collection: number
  shipments: ShipmentDetail[]
}

export default function RevenueDetailsPage() {
  const [sessions, setSessions] = useState<SessionDetail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/revenue-details")
      const data = await response.json()
      setSessions(data)
    } catch (error) {
      console.error("Error fetching sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">تفاصيل حساب إيرادات السائقين</h1>
        <p className="text-muted-foreground">شرح تفصيلي لكيفية حساب الإيرادات بناءً على حالة الدفع الأصلية</p>
      </div>

      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>منطق حساب الإيرادات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-semibold">شحنة غير مدفوعة → مدفوعة (السائق حصّلها)</p>
              <p className="text-sm text-muted-foreground">
                تدخل في إيراد السائق بالمبلغ الكامل لأن السائق حصّلها من المستلم
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">شحنة مدفوعة → مدفوعة (مدفوعة مسبقاً)</p>
              <p className="text-sm text-muted-foreground">
                لا تدخل في إيراد السائق (قيمتها = 0) لأنها كانت مدفوعة من البداية
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {sessions.map((session) => (
          <Card key={session.session_id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>جلسة رقم {session.session_id}</CardTitle>
                  <CardDescription className="text-white/90">السائق: {session.driver_name}</CardDescription>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold">{session.total_revenue} د.أ</div>
                  <div className="text-sm">إجمالي الإيرادات</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                {session.shipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className={`p-4 rounded-lg border-2 ${
                      shipment.should_include_in_revenue ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {shipment.should_include_in_revenue ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                        <div>
                          <div className="font-semibold">{shipment.tracking_number}</div>
                          <div className="text-sm text-muted-foreground">المبلغ: {shipment.price} د.أ</div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div
                          className={`text-2xl font-bold ${
                            shipment.should_include_in_revenue ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {shipment.revenue_amount} د.أ
                        </div>
                        <div className="text-xs text-muted-foreground">في الإيراد</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant={shipment.original_payment_status === "unpaid" ? "destructive" : "default"}>
                        {shipment.original_payment_status === "unpaid" ? "غير مدفوعة" : "مدفوعة"}
                      </Badge>
                      <ArrowRight className="h-4 w-4" />
                      <Badge variant={shipment.current_payment_status === "paid" ? "default" : "destructive"}>
                        {shipment.current_payment_status === "paid" ? "مدفوعة" : "غير مدفوعة"}
                      </Badge>
                    </div>

                    <div className="mt-3 text-sm">
                      {shipment.should_include_in_revenue ? (
                        <p className="text-green-700">✓ السائق حصّل هذه الشحنة (كانت unpaid وأصبحت paid)</p>
                      ) : (
                        <p className="text-red-700">✗ شحنة مدفوعة مسبقاً (كانت paid من البداية)</p>
                      )}
                      {shipment.delivery_type === "not_included" && (
                        <p className="text-orange-600 mt-1">+ أجرة التوصيل: {shipment.driver_fee} د.أ (غير مشمولة)</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>مجموع الإيرادات:</span>
                  <span className="font-semibold">{session.total_revenue} د.أ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>أجرة السائق:</span>
                  <span className="font-semibold text-orange-600">- {session.total_driver_fee} د.أ</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>الباقي للشركة:</span>
                  <span className="text-blue-600">{session.remaining_collection} د.أ</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
