"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, Package, User, Phone, MapPin, FileText, Calendar, DollarSign, Weight, Globe, Hash, Truck, Clock, CheckCircle2, AlertCircle, RotateCcw, XCircle, Loader2, ArrowLeftRight } from "lucide-react"
import type { Shipment } from "./shipment-form"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getShipmentById } from "@/app/actions/shipments"
import { AdminFooter } from "@/components/admin-footer"

const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: any; gradient: string }> = {
    pending: {
      label: "قيد الانتظار",
      color: "text-amber-700",
      bgColor: "bg-gradient-to-br from-amber-50 to-yellow-100",
      borderColor: "border-amber-300",
      icon: Clock,
      gradient: "from-amber-400 to-yellow-500",
    },
    processing: {
      label: "قيد المعالجة",
      color: "text-blue-700",
      bgColor: "bg-gradient-to-br from-blue-50 to-sky-100",
      borderColor: "border-blue-300",
      icon: Loader2,
      gradient: "from-blue-400 to-sky-500",
    },
    "in-transit": {
      label: "قيد الشحن",
      color: "text-purple-700",
      bgColor: "bg-gradient-to-br from-purple-50 to-violet-100",
      borderColor: "border-purple-300",
      icon: Truck,
      gradient: "from-purple-400 to-violet-500",
    },
    "out-for-delivery": {
      label: "خارج للتوصيل",
      color: "text-indigo-700",
      bgColor: "bg-gradient-to-br from-indigo-50 to-blue-100",
      borderColor: "border-indigo-300",
      icon: ArrowLeftRight,
      gradient: "from-indigo-400 to-blue-500",
    },
    delivered: {
      label: "تم التسليم",
      color: "text-emerald-700",
      bgColor: "bg-gradient-to-br from-emerald-50 to-green-100",
      borderColor: "border-emerald-300",
      icon: CheckCircle2,
      gradient: "from-emerald-400 to-green-500",
    },
    cancelled: { 
      label: "ملغاة", 
      color: "text-red-700", 
      bgColor: "bg-gradient-to-br from-red-50 to-rose-100", 
      borderColor: "border-red-300",
      icon: XCircle,
      gradient: "from-red-400 to-rose-500",
    },
    returned: { 
      label: "مرتجعة", 
      color: "text-orange-700", 
      bgColor: "bg-gradient-to-br from-orange-50 to-amber-100", 
      borderColor: "border-orange-300",
      icon: RotateCcw,
      gradient: "from-orange-400 to-amber-500",
    },
  }
  return (
    statusMap[status] || {
      label: status,
      color: "text-gray-700",
      bgColor: "bg-gradient-to-br from-gray-50 to-slate-100",
      borderColor: "border-gray-300",
      icon: AlertCircle,
      gradient: "from-gray-400 to-slate-500",
    }
  )
}

export function ShipmentDetails({ id }: { id: string }) {
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchShipment = async () => {
      setLoading(true)
      try {
        const result = await getShipmentById(id)

        if (result.success && result.data) {
          setShipment(result.data as Shipment)
        } else {
          router.push("/admin")
        }
      } catch (error) {
        console.error("[v0] Error fetching shipment:", error)
        router.push("/admin")
      } finally {
        setLoading(false)
      }
    }

    fetchShipment()
  }, [id, router])

  const handlePrint = () => {
    window.print()
  }

  if (loading || !shipment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(shipment.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
      {/* Header with Logo */}
      <div className="print:p-0">
        {/* Company Header */}
        <div className="bg-gradient-to-r from-[#0a3d4d] via-[#0d4a5c] to-[#1e5a6e] text-white rounded-t-2xl p-6 sm:p-8 shadow-xl print:rounded-none print:p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2.5 rounded-xl shadow-lg print:p-1.5 w-16 h-16 print:w-12 print:h-12 flex-shrink-0">
                <div className="relative w-full h-full">
                  <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold print:text-base">مؤسسة الريان واريان للشحن</h1>
                <p className="text-sm opacity-90 mt-1 print:text-[10px]">
                  الريان للخدمات اللوجستية وحلول الشحن والتوصيل
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="w-4 h-4" />
                  <span className="font-bold">شحنة رقم: {shipment.id}</span>
                </div>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(shipment.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Print Button */}
        <div className="flex justify-end p-4 bg-white/80 backdrop-blur-sm border-x border-gray-200 print:hidden">
          <Button onClick={handlePrint} size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-lg">
            <Printer className="w-5 h-5 ml-2" />
            طباعة تفاصيل الشحنة
          </Button>
        </div>

        {/* Main Content */}
        <Card className="rounded-t-none border-t-0 shadow-xl print:shadow-none print:border-0">
          <CardContent className="p-4 sm:p-6 space-y-6 print:pt-3 print:space-y-3 print:p-4">
            
            {/* Status Banner */}
            <div className={`p-5 rounded-2xl border-2 ${statusInfo.bgColor} ${statusInfo.borderColor} print:hidden`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${statusInfo.gradient} shadow-lg`}>
                    <StatusIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">حالة الشحنة</p>
                    <p className={`text-2xl font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground mb-1">رقم التتبع</p>
                  <p className="text-lg font-mono font-bold text-primary bg-white/50 px-3 py-1 rounded-lg">{shipment.trackingNumber}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 print:grid-cols-4 print:gap-2">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 text-center print:p-2">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 shadow-md">
                    <DollarSign className="w-5 h-5 text-white print:w-3 print:h-3" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1 print:text-[9px]">المبلغ الإجمالي</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-700 print:text-base">
                  {shipment.totalAmount ? Number(shipment.totalAmount).toFixed(2) : "0.00"}
                </p>
                <p className="text-xs text-emerald-600">د.أ</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-200 text-center print:p-2">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400 to-sky-500 shadow-md">
                    <Weight className="w-5 h-5 text-white print:w-3 print:h-3" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1 print:text-[9px]">الوزن</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700 print:text-base">
                  {shipment.weight ? Number(shipment.weight).toFixed(2) : "0.00"}
                </p>
                <p className="text-xs text-blue-600">كجم</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 text-center print:p-2">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-400 to-violet-500 shadow-md">
                    <Calendar className="w-5 h-5 text-white print:w-3 print:h-3" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1 print:text-[9px]">تاريخ الاستلام</p>
                <p className="text-base sm:text-lg font-bold text-purple-700 print:text-sm">
                  {new Date(shipment.receivedDate).toLocaleDateString("en-GB")}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 text-center print:p-2">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                    <Package className="w-5 h-5 text-white print:w-3 print:h-3" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1 print:text-[9px]">نوع الشحنة</p>
                <p className="text-base sm:text-lg font-bold text-amber-700 print:text-sm">
                  {shipment.shipmentType === "oil" ? "زيت" : shipment.shipmentType === "goods" ? "بضائع" : "طرود"}
                </p>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-secondary/50 border-l-4 border-primary print:p-3 print:border-l-2">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border print:mb-2 print:pb-2">
                <div className="bg-primary/10 p-2 rounded-lg print:p-1">
                  <User className="w-5 h-5 text-primary print:w-4 print:h-4" />
                </div>
                <h3 className="text-lg font-bold text-foreground print:text-sm">معلومات المرسل</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
                <div className="flex items-start gap-3 print:gap-2">
                  <User className="w-4 h-4 text-muted-foreground mt-1 print:w-3 print:h-3" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">الاسم</p>
                    <p className="font-semibold text-foreground print:text-sm">{shipment.senderName}</p>
                  </div>
                </div>
                {shipment.senderPhone && (
                  <div className="flex items-start gap-3 print:gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground mt-1 print:w-3 print:h-3" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">رقم الهاتف</p>
                      <p
                        className="font-semibold text-foreground print:text-sm"
                        dir="ltr"
                        style={{ textAlign: "right" }}
                      >
                        {shipment.senderPhone}
                      </p>
                    </div>
                  </div>
                )}
                {shipment.senderCountry && (
                  <div className="flex items-start gap-3 print:gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground mt-1 print:w-3 print:h-3" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">الدولة</p>
                      <p className="font-semibold text-foreground print:text-sm">{shipment.senderCountry}</p>
                    </div>
                  </div>
                )}
                {shipment.senderAddress && (
                  <div className="flex items-start gap-3 md:col-span-2 print:gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1 print:w-3 print:h-3" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">العنوان</p>
                      <p className="text-foreground leading-relaxed print:text-sm">{shipment.senderAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 rounded-lg bg-accent/10 border-l-4 border-accent print:p-3 print:border-l-2">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-accent/30 print:mb-2 print:pb-2">
                <div className="bg-accent/20 p-2 rounded-lg print:p-1">
                  <User className="w-5 h-5 text-accent print:w-4 print:h-4" />
                </div>
                <h3 className="text-lg font-bold text-foreground print:text-sm">معلومات المستقبل</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
                <div className="flex items-start gap-3 print:gap-2">
                  <User className="w-4 h-4 text-muted-foreground mt-1 print:w-3 print:h-3" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">الاسم</p>
                    <p className="font-semibold text-foreground print:text-sm">{shipment.receiverName}</p>
                  </div>
                </div>
                {shipment.receiverPhone && (
                  <div className="flex items-start gap-3 print:gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground mt-1 print:w-3 print:h-3" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">رقم الهاتف</p>
                      <p
                        className="font-semibold text-foreground print:text-sm"
                        dir="ltr"
                        style={{ textAlign: "right" }}
                      >
                        {shipment.receiverPhone}
                      </p>
                    </div>
                  </div>
                )}
                {shipment.receiverCountry && (
                  <div className="flex items-start gap-3 print:gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground mt-1 print:w-3 print:h-3" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">الدولة</p>
                      <p className="font-semibold text-foreground print:text-sm">{shipment.receiverCountry}</p>
                    </div>
                  </div>
                )}
                {shipment.receiverAddress && (
                  <div className="flex items-start gap-3 md:col-span-2 print:gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1 print:w-3 print:h-3" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">العنوان</p>
                      <p className="text-foreground leading-relaxed print:text-sm">{shipment.receiverAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {shipment.description && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200 print:p-3">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200 print:mb-2 print:pb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-slate-400 to-gray-500 shadow-md">
                    <FileText className="w-5 h-5 text-white print:w-4 print:h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground print:text-sm">وصف الشحنة</h3>
                </div>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap print:text-sm bg-white/50 p-4 rounded-lg">
                  {shipment.description}
                </p>
              </div>
            )}

            {/* Tracking Number for Print */}
            <div className="hidden print:block p-3 rounded-lg bg-gray-50 border border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-1">رقم التتبع</p>
              <p className="text-lg font-mono font-bold text-primary">{shipment.trackingNumber}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="print:hidden">
        <AdminFooter backUrl="/shipments-tracking" backLabel="متابعة الشحنات" />
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          body {
            width: 190mm !important;
            min-height: 277mm !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:p-0 { padding: 0 !important; }
          .print\\:p-2 { padding: 2mm !important; }
          .print\\:p-3 { padding: 3mm !important; }
          .print\\:p-4 { padding: 4mm !important; }
          
          .print\\:pt-3 { padding-top: 3mm !important; }
          .print\\:space-y-3 > * + * { margin-top: 3mm !important; }
          
          .print\\:gap-2 { gap: 2mm !important; }
          .print\\:mb-1 { margin-bottom: 1mm !important; }
          .print\\:mb-2 { margin-bottom: 2mm !important; }
          .print\\:pb-2 { padding-bottom: 2mm !important; }
          
          .print\\:border { border-width: 0.5pt !important; }
          .print\\:border-l-2 { border-left-width: 1.5pt !important; }
          
          .print\\:text-xs { font-size: 9pt !important; line-height: 1.3 !important; }
          .print\\:text-\\[10px\\] { font-size: 9pt !important; }
          .print\\:text-sm { font-size: 10pt !important; line-height: 1.3 !important; }
          .print\\:text-base { font-size: 11pt !important; line-height: 1.4 !important; }
          .print\\:text-lg { font-size: 12pt !important; line-height: 1.4 !important; }
          .print\\:text-xl { font-size: 13pt !important; line-height: 1.5 !important; }
          
          .print\\:w-3 { width: 3mm !important; }
          .print\\:h-3 { height: 3mm !important; }
          .print\\:w-4 { width: 4mm !important; }
          .print\\:h-4 { height: 4mm !important; }
          .print\\:w-6 { width: 5mm !important; }
          .print\\:h-6 { height: 5mm !important; }
          .print\\:w-12 { width: 10mm !important; }
          .print\\:h-12 { height: 10mm !important; }
          
          .print\\:p-1\\.5 { padding: 1.5mm !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          
          .print\\:bg-\\[\\#0a3d4d\\] {
            background: #0a3d4d !important;
            color: white !important;
          }
          
          * {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}
