"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Printer, Package } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { Shipment } from "@/components/shipment-form"

interface TripShipment {
  shipmentId: string
  trackingNumber: string
  senderName: string
  recipientName: string
  amount: number
  deliveryCost: number
}

interface Trip {
  id: string
  serialNumber: number
  date: string
  shipments: TripShipment[]
  [key: string]: any
}

function DeliveryPaymentsContent() {
  const searchParams = useSearchParams()
  const tripSerial = searchParams.get("tripSerial")

  const [shipments, setShipments] = useState<Shipment[]>([])
  const [trip, setTrip] = useState<Trip | null>(null)
  const [companyInfo, setCompanyInfo] = useState({ name: "", phone: "", address: "" })

  useEffect(() => {
    loadData()
  }, [tripSerial])

  const loadData = () => {
    console.log("[v0] Loading data for trip serial:", tripSerial)

    // تحميل معلومات الشركة
    const storedCompany = localStorage.getItem("companyInfo")
    if (storedCompany) {
      setCompanyInfo(JSON.parse(storedCompany))
    }

    // تحميل الرحلة
    const storedTrips = localStorage.getItem("trips")
    if (storedTrips && tripSerial) {
      const trips: Trip[] = JSON.parse(storedTrips)
      console.log("[v0] All trips:", trips)

      const foundTrip = trips.find((t) => t.serialNumber === Number.parseInt(tripSerial))
      console.log("[v0] Found trip:", foundTrip)

      if (foundTrip) {
        setTrip(foundTrip)

        // تحميل الشحنات
        const storedShipments = localStorage.getItem("shipments")
        if (storedShipments) {
          const allShipments: Shipment[] = JSON.parse(storedShipments)
          console.log("[v0] All shipments:", allShipments)
          console.log(
            "[v0] Trip shipments IDs:",
            foundTrip.shipments.map((ts) => ts.shipmentId),
          )

          const filtered = allShipments.filter((s) => {
            // البحث عن الشحنة في array الرحلة باستخدام shipmentId
            const inTrip = foundTrip.shipments.some((ts) => ts.shipmentId === s.id)
            // البحث عن paymentLocation = "receiver" (وليس "at-receiver")
            const isReceiverPayment = s.paymentLocation === "receiver"
            console.log(
              "[v0] Shipment",
              s.trackingNumber,
              "- inTrip:",
              inTrip,
              "- paymentLocation:",
              s.paymentLocation,
              "- isReceiverPayment:",
              isReceiverPayment,
            )
            return inTrip && isReceiverPayment
          })

          console.log("[v0] Filtered shipments:", filtered)
          setShipments(filtered)
        }
      }
    }
  }

  const printTable = () => {
    window.print()
  }

  const totalAmount = shipments.reduce((sum, s) => sum + (s.amount || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10 print:hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/shipments-table">
                <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">شحنات الدفع عند التسليم</h1>
                <p className="text-sm text-muted-foreground">
                  رحلة رقم {tripSerial} - {trip?.date ? new Date(trip.date).toLocaleDateString("ar-JO") : ""}
                </p>
              </div>
            </div>
            <Button onClick={printTable} className="gap-2">
              <Printer className="w-4 h-4" />
              طباعة / حفظ PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="hidden print:block mb-8 border-b-2 border-gray-300 pb-6">
        <div className="text-center mb-4">
          {companyInfo.name && <h1 className="text-4xl font-bold mb-2">{companyInfo.name}</h1>}
          {companyInfo.phone && <p className="text-sm text-gray-600">هاتف: {companyInfo.phone}</p>}
          {companyInfo.address && <p className="text-sm text-gray-600">العنوان: {companyInfo.address}</p>}
        </div>

        <div className="text-center mt-6">
          <h2 className="text-3xl font-bold mb-4 text-primary">شحنات الدفع عند التسليم</h2>

          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mt-4">
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm font-semibold text-gray-700">رقم الرحلة</p>
              <p className="text-lg font-bold text-primary">{tripSerial}</p>
            </div>

            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm font-semibold text-gray-700">تاريخ الرحلة</p>
              <p className="text-lg font-bold">{trip?.date ? new Date(trip.date).toLocaleDateString("ar-JO") : ""}</p>
            </div>

            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm font-semibold text-gray-700">عدد الشحنات</p>
              <p className="text-lg font-bold text-primary">{shipments.length}</p>
            </div>

            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm font-semibold text-gray-700">إجمالي المبالغ</p>
              <p className="text-lg font-bold text-green-600">{totalAmount.toFixed(2)} د.أ</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6 print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              معلومات الرحلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">رقم الرحلة</p>
                <p className="text-lg font-bold text-primary">{tripSerial}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">تاريخ الرحلة</p>
                <p className="text-lg font-bold">{trip?.date ? new Date(trip.date).toLocaleDateString("ar-JO") : ""}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">عدد الشحنات</p>
                <p className="text-lg font-bold text-primary">{shipments.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">إجمالي المبالغ</p>
                <p className="text-lg font-bold text-green-600">{totalAmount.toFixed(2)} د.أ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الشحنة</TableHead>
                    <TableHead className="text-right">القيمة (د.أ)</TableHead>
                    <TableHead className="text-right">مكان التسليم</TableHead>
                    <TableHead className="text-right">اسم المستلم</TableHead>
                    <TableHead className="text-right">رقم هاتف المستلم</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        لا توجد شحنات بطريقة الدفع عند التسليم في هذه الرحلة
                      </TableCell>
                    </TableRow>
                  ) : (
                    shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-medium">{shipment.trackingNumber}</TableCell>
                        <TableCell className="font-bold text-green-600">{shipment.amount.toFixed(2)}</TableCell>
                        <TableCell className="max-w-xs truncate print:max-w-none">{shipment.receiverAddress}</TableCell>
                        <TableCell>{shipment.receiverName}</TableCell>
                        <TableCell dir="ltr" className="text-right">
                          {shipment.receiverPhone}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {shipments.length > 0 && (
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell>الإجمالي</TableCell>
                      <TableCell className="text-green-600">{totalAmount.toFixed(2)} د.أ</TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
          
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          * {
            box-shadow: none !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          table {
            page-break-inside: auto;
            width: 100%;
            border-collapse: collapse;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
            font-weight: bold;
            background-color: #f3f4f6 !important;
          }
          
          th, td {
            border: 1px solid #d1d5db !important;
            padding: 8px !important;
            font-size: 12px !important;
          }
          
          th {
            background-color: #e5e7eb !important;
            font-weight: bold !important;
          }
          
          .print\\:max-w-none {
            max-width: none !important;
            white-space: normal !important;
          }
          
          .bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          
          .text-primary {
            color: #3b82f6 !important;
          }
          
          .text-green-600 {
            color: #16a34a !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function DeliveryPaymentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>}>
      <DeliveryPaymentsContent />
    </Suspense>
  )
}
