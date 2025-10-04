"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Calendar, Printer, Filter, ExternalLink, Package } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Shipment } from "@/components/shipment-form"

export default function ShipmentsTablePage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [companyInfo, setCompanyInfo] = useState({ name: "", phone: "", address: "" })
  const [tripDialogOpen, setTripDialogOpen] = useState(false)
  const [tripSerialNumber, setTripSerialNumber] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadShipments()
    loadCompanyInfo()
  }, [])

  useEffect(() => {
    filterShipments()
  }, [startDate, endDate, shipments])

  const loadShipments = () => {
    const stored = localStorage.getItem("shipments")
    if (stored) {
      const parsed = JSON.parse(stored)
      setShipments(parsed)
    }
  }

  const loadCompanyInfo = () => {
    const stored = localStorage.getItem("companyInfo")
    if (stored) {
      setCompanyInfo(JSON.parse(stored))
    }
  }

  const filterShipments = () => {
    let filtered = [...shipments]

    if (startDate) {
      filtered = filtered.filter((s) => s.receivedDate >= startDate)
    }

    if (endDate) {
      filtered = filtered.filter((s) => s.receivedDate <= endDate)
    }

    setFilteredShipments(filtered)
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "قيد الانتظار",
      processing: "قيد المعالجة",
      "in-transit": "في الطريق",
      "out-for-delivery": "خارج للتوصيل",
      delivered: "تم التوصيل",
      cancelled: "ملغي",
      returned: "مرتجع",
    }
    return statusMap[status] || status
  }

  const printTable = () => {
    window.print()
  }

  const openTableView = () => {
    const params = new URLSearchParams()
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)
    router.push(`/shipments-table/view?${params.toString()}`)
  }

  const openDeliveryPayments = () => {
    if (!tripSerialNumber.trim()) {
      alert("الرجاء إدخال رقم الرحلة التسلسلي")
      return
    }
    router.push(`/shipments-table/delivery-payments?tripSerial=${tripSerialNumber}`)
    setTripDialogOpen(false)
    setTripSerialNumber("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10 print:hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">جدول الشحنات</h1>
                <p className="text-sm text-muted-foreground">عرض وتصفية الشحنات حسب الفترة الزمنية</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={tripDialogOpen} onOpenChange={setTripDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 gradient-accent">
                    <Package className="w-4 h-4" />
                    شحنات عند التسليم
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>شحنات الدفع عند التسليم</DialogTitle>
                    <DialogDescription>أدخل رقم الرحلة التسلسلي لعرض الشحنات</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="tripSerial">رقم الرحلة التسلسلي</Label>
                      <Input
                        id="tripSerial"
                        type="number"
                        placeholder="أدخل رقم الرحلة"
                        value={tripSerialNumber}
                        onChange={(e) => setTripSerialNumber(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            openDeliveryPayments()
                          }
                        }}
                      />
                    </div>
                    <Button onClick={openDeliveryPayments} className="w-full">
                      عرض الشحنات
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={openTableView} className="gap-2" variant="secondary">
                <ExternalLink className="w-4 h-4" />
                عرض الجدول
              </Button>
              <Button onClick={printTable} className="gap-2" variant="default">
                <Printer className="w-4 h-4" />
                طباعة / حفظ PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6 print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              تصفية حسب الفترة الزمنية
            </CardTitle>
            <CardDescription>اختر الفترة الزمنية لعرض الشحنات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  من تاريخ
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  إلى تاريخ
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                عدد الشحنات: <span className="font-bold text-foreground">{filteredShipments.length}</span>
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("")
                  setEndDate("")
                }}
              >
                إعادة تعيين
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="hidden print:block mb-8 border-b-2 border-gray-300 pb-6">
          <div className="text-center mb-4">
            {companyInfo.name && <h1 className="text-4xl font-bold mb-2">{companyInfo.name}</h1>}
            {companyInfo.phone && <p className="text-sm text-gray-600">هاتف: {companyInfo.phone}</p>}
            {companyInfo.address && <p className="text-sm text-gray-600">العنوان: {companyInfo.address}</p>}
          </div>

          <div className="text-center mt-6">
            <h2 className="text-3xl font-bold mb-4 text-primary">تقرير الشحنات</h2>

            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mt-4">
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm font-semibold text-gray-700">تاريخ الطباعة</p>
                <p className="text-lg font-bold">{new Date().toLocaleDateString("ar-JO")}</p>
              </div>

              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm font-semibold text-gray-700">عدد الشحنات</p>
                <p className="text-lg font-bold text-primary">{filteredShipments.length}</p>
              </div>

              {startDate && (
                <div className="bg-gray-100 p-3 rounded">
                  <p className="text-sm font-semibold text-gray-700">من تاريخ</p>
                  <p className="text-lg font-bold">{new Date(startDate).toLocaleDateString("ar-JO")}</p>
                </div>
              )}

              {endDate && (
                <div className="bg-gray-100 p-3 rounded">
                  <p className="text-sm font-semibold text-gray-700">إلى تاريخ</p>
                  <p className="text-lg font-bold">{new Date(endDate).toLocaleDateString("ar-JO")}</p>
                </div>
              )}

              {!startDate && !endDate && (
                <div className="bg-gray-100 p-3 rounded col-span-2">
                  <p className="text-sm font-semibold text-gray-700">الفترة الزمنية</p>
                  <p className="text-lg font-bold">جميع الشحنات</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم التتبع</TableHead>
                    <TableHead className="text-right">المرسل</TableHead>
                    <TableHead className="text-right">هاتف المرسل</TableHead>
                    <TableHead className="text-right">المستلم</TableHead>
                    <TableHead className="text-right">هاتف المستلم</TableHead>
                    <TableHead className="text-right">عنوان المستلم</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">الوزن (كجم)</TableHead>
                    <TableHead className="text-right">القيمة (د.أ)</TableHead>
                    <TableHead className="text-right">تاريخ الاستلام</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        لا توجد شحنات في الفترة المحددة
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredShipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-medium">{shipment.trackingNumber}</TableCell>
                        <TableCell>{shipment.senderName}</TableCell>
                        <TableCell dir="ltr" className="text-right">
                          {shipment.senderPhone}
                        </TableCell>
                        <TableCell>{shipment.receiverName}</TableCell>
                        <TableCell dir="ltr" className="text-right">
                          {shipment.receiverPhone}
                        </TableCell>
                        <TableCell className="max-w-xs truncate print:max-w-none">{shipment.receiverAddress}</TableCell>
                        <TableCell className="max-w-xs truncate print:max-w-none">{shipment.description}</TableCell>
                        <TableCell>{shipment.weight}</TableCell>
                        <TableCell>{shipment.amount.toFixed(2)}</TableCell>
                        <TableCell>{shipment.receivedDate}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              shipment.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : shipment.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : shipment.status === "in-transit"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {getStatusLabel(shipment.status)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
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
            size: A4 landscape;
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
            font-size: 11px !important;
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
        }
      `}</style>
    </div>
  )
}
