"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, Package, User, Phone, MapPin, FileText, Calendar, DollarSign, Weight, Globe } from "lucide-react"
import type { Shipment } from "./shipment-form"
import { useRouter } from "next/navigation"
import Image from "next/image"

const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
    pending: {
      label: "قيد الانتظار",
      color: "text-yellow-700",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-300",
    },
    processing: {
      label: "قيد المعالجة",
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300",
    },
    "in-transit": {
      label: "قيد الشحن",
      color: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-300",
    },
    "out-for-delivery": {
      label: "خارج للتوصيل",
      color: "text-indigo-700",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-300",
    },
    delivered: {
      label: "تم التسليم",
      color: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-300",
    },
    cancelled: { label: "ملغاة", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-300" },
    returned: { label: "مرتجعة", color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-300" },
  }
  return (
    statusMap[status] || {
      label: status,
      color: "text-gray-700",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-300",
    }
  )
}

export function ShipmentDetails({ id }: { id: string }) {
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem("shipments")
    if (stored) {
      const shipments: Shipment[] = JSON.parse(stored)
      const found = shipments.find((s) => s.id === id)
      if (found) {
        setShipment(found)
      } else {
        router.push("/")
      }
    }
  }, [id, router])

  const handlePrint = () => {
    window.print()
  }

  if (!shipment) {
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Print Button - Hidden when printing */}
      <div className="mb-6 print:hidden">
        <Button onClick={handlePrint} size="lg" className="w-full sm:w-auto">
          <Printer className="w-5 h-5 ml-2" />
          طباعة تفاصيل الشحنة
        </Button>
      </div>

      {/* Printable Content */}
      <div className="print:p-0">
        <Card className="shadow-lg print:shadow-none">
          <CardHeader className="bg-gradient-to-r from-[#0a3d4d] to-[#1e5a6e] text-white print:bg-[#0a3d4d] print:p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg print:p-1.5 w-14 h-14 print:w-12 print:h-12 flex-shrink-0">
                  <div className="relative w-full h-full">
                    <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold print:text-base">مؤسسة الريان واريان للشحن</CardTitle>
                  <p className="text-xs opacity-90 mt-0.5 print:text-[10px]">
                    الريان للخدمات اللوجستية وحلول الشحن والتوصيل
                  </p>
                  <p className="text-xs opacity-90 mt-1 print:text-[10px]">رقم الشحنة: #{shipment.id}</p>
                </div>
              </div>
              <div className="text-left text-sm opacity-90 bg-white/10 px-4 py-2 rounded-lg print:text-xs print:px-2 print:py-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 print:w-3 print:h-3" />
                  <span>{new Date(shipment.createdAt).toLocaleDateString("en-GB")}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6 print:pt-3 print:space-y-3 print:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
              <div className="p-6 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 border-2 border-accent print:p-3 print:border">
                <div className="flex items-center gap-3 mb-2 print:gap-2 print:mb-1">
                  <DollarSign className="w-6 h-6 text-accent print:w-4 print:h-4" />
                  <p className="text-sm text-muted-foreground print:text-xs">قيمة الشحن</p>
                </div>
                <p className="text-3xl font-bold text-foreground print:text-xl">
                  {shipment.amount?.toFixed(2) || "0.00"} د.أ
                </p>
              </div>

              <div className="p-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary print:p-3 print:border">
                <div className="flex items-center gap-3 mb-2 print:gap-2 print:mb-1">
                  <Weight className="w-6 h-6 text-primary print:w-4 print:h-4" />
                  <p className="text-sm text-muted-foreground print:text-xs">الوزن</p>
                </div>
                <p className="text-3xl font-bold text-foreground print:text-xl">
                  {shipment.weight?.toFixed(2) || "0.00"} كجم
                </p>
              </div>

              <div className={`p-6 rounded-lg border-2 ${statusInfo.bgColor} ${statusInfo.borderColor} print:hidden`}>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-sm text-muted-foreground">حالة الشحنة</p>
                </div>
                <p className={`text-2xl font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
              <div className="p-4 rounded-lg bg-muted/50 border border-border print:p-2">
                <p className="text-xs text-muted-foreground mb-2 print:mb-1">رقم التتبع</p>
                <p className="text-lg font-mono font-semibold text-primary print:text-sm">{shipment.trackingNumber}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border print:p-2">
                <p className="text-xs text-muted-foreground mb-2 print:mb-1">تاريخ الاستلام</p>
                <p className="text-lg font-semibold text-foreground print:text-sm">
                  {new Date(shipment.receivedDate).toLocaleDateString("en-GB")}
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
              <div className="p-6 rounded-lg bg-muted/50 border border-border print:p-3">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border print:mb-2 print:pb-2">
                  <FileText className="w-5 h-5 text-primary print:w-4 print:h-4" />
                  <h3 className="text-lg font-bold text-foreground print:text-sm">وصف الشحنة</h3>
                </div>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap print:text-sm">
                  {shipment.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            position: relative;
          }
          /* إضافة خلفية خافتة بالشعار عند الطباعة */
          body::before {
            content: '';
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            height: 400px;
            background-image: url('/images/logo.jpg');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.03;
            z-index: -1;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:p-2 {
            padding: 0.5rem !important;
          }
          .print\\:p-3 {
            padding: 0.75rem !important;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          .print\\:pt-3 {
            padding-top: 0.75rem !important;
          }
          .print\\:space-y-3 > * + * {
            margin-top: 0.75rem !important;
          }
          .print\\:gap-2 {
            gap: 0.5rem !important;
          }
          .print\\:mb-1 {
            margin-bottom: 0.25rem !important;
          }
          .print\\:mb-2 {
            margin-bottom: 0.5rem !important;
          }
          .print\\:pb-2 {
            padding-bottom: 0.5rem !important;
          }
          .print\\:border {
            border-width: 1px !important;
          }
          .print\\:border-l-2 {
            border-left-width: 2px !important;
          }
          .print\\:text-xs {
            font-size: 0.75rem !important;
            line-height: 1rem !important;
          }
          .print\\:text-\\[10px\\] {
            font-size: 10px !important;
          }
          .print\\:text-sm {
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
          }
          .print\\:text-base {
            font-size: 1rem !important;
            line-height: 1.5rem !important;
          }
          .print\\:text-lg {
            font-size: 1.125rem !important;
            line-height: 1.75rem !important;
          }
          .print\\:text-xl {
            font-size: 1.25rem !important;
            line-height: 1.75rem !important;
          }
          .print\\:w-3 {
            width: 0.75rem !important;
          }
          .print\\:h-3 {
            height: 0.75rem !important;
          }
          .print\\:w-4 {
            width: 1rem !important;
          }
          .print\\:h-4 {
            height: 1rem !important;
          }
          .print\\:w-6 {
            width: 1.5rem !important;
          }
          .print\\:h-6 {
            height: 1.5rem !important;
          }
          .print\\:w-12 {
            width: 3rem !important;
          }
          .print\\:h-12 {
            height: 3rem !important;
          }
          .print\\:p-1\\.5 {
            padding: 0.375rem !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:bg-\\[\\#0a3d4d\\] {
            background: #0a3d4d !important;
            color: white !important;
          }
          * {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}
