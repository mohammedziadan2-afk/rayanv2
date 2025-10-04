"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Calendar, Printer, Filter, Package, Search, Eye, FileText, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Shipment } from "@/components/shipment-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ShippingHistoryPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [companyInfo, setCompanyInfo] = useState({ name: "", phone: "", address: "" })
  const router = useRouter()

  useEffect(() => {
    loadShipments()
    loadCompanyInfo()
  }, [])

  useEffect(() => {
    filterShipments()
  }, [startDate, endDate, statusFilter, searchQuery, shipments])

  const loadShipments = () => {
    const stored = localStorage.getItem("shipments")
    if (stored) {
      const parsed = JSON.parse(stored)
      // Filter out deleted shipments
      const activeShipments = parsed.filter((s: Shipment) => !s.deletedAt)
      setShipments(activeShipments)
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

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter((s) => s.receivedDate >= startDate)
    }

    if (endDate) {
      filtered = filtered.filter((s) => s.receivedDate <= endDate)
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.trackingNumber.toLowerCase().includes(query) ||
          s.senderName.toLowerCase().includes(query) ||
          s.receiverName.toLowerCase().includes(query) ||
          s.senderPhone.includes(query) ||
          s.receiverPhone.includes(query),
      )
    }

    // Sort by received date (newest first)
    filtered.sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime())

    setFilteredShipments(filtered)
  }

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "قيد الانتظار", variant: "outline" },
      processing: { label: "قيد المعالجة", variant: "secondary" },
      "in-transit": { label: "في الطريق", variant: "default" },
      "out-for-delivery": { label: "خارج للتوصيل", variant: "default" },
      delivered: { label: "تم التوصيل", variant: "default" },
      cancelled: { label: "ملغي", variant: "destructive" },
      returned: { label: "مرتجع", variant: "outline" },
    }
    return statusMap[status] || { label: status, variant: "outline" }
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      processing: "bg-blue-100 text-blue-800 border-blue-300",
      "in-transit": "bg-purple-100 text-purple-800 border-purple-300",
      "out-for-delivery": "bg-indigo-100 text-indigo-800 border-indigo-300",
      delivered: "bg-green-100 text-green-800 border-green-300",
      cancelled: "bg-red-100 text-red-800 border-red-300",
      returned: "bg-orange-100 text-orange-800 border-orange-300",
    }
    return colorMap[status] || "bg-gray-100 text-gray-800 border-gray-300"
  }

  const printHistory = () => {
    window.print()
  }

  const calculateStats = () => {
    const total = filteredShipments.length
    const delivered = filteredShipments.filter((s) => s.status === "delivered").length
    const inTransit = filteredShipments.filter(
      (s) => s.status === "in-transit" || s.status === "out-for-delivery",
    ).length
    const totalRevenue = filteredShipments.reduce((sum, s) => sum + (s.amount || 0), 0)

    return { total, delivered, inTransit, totalRevenue }
  }

  const stats = calculateStats()

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
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary" />
                  سجل الشحنات
                </h1>
                <p className="text-sm text-muted-foreground">عرض وتتبع جميع الشحنات السابقة</p>
              </div>
            </div>
            <Button onClick={printHistory} className="gap-2 gradient-primary">
              <Printer className="w-4 h-4" />
              طباعة / حفظ PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 print:hidden">
          <Card className="glass-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                إجمالي الشحنات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                تم التوصيل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.delivered}</p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                قيد الشحن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats.inTransit}</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-2 border-accent/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                إجمالي الإيرادات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-accent">{stats.totalRevenue.toFixed(2)} د.أ</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="mb-6 print:hidden glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              تصفية وبحث
            </CardTitle>
            <CardDescription>استخدم الفلاتر للبحث عن شحنات محددة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  بحث
                </Label>
                <Input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="رقم التتبع، اسم، هاتف..."
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  الحالة
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="processing">قيد المعالجة</SelectItem>
                    <SelectItem value="in-transit">في الطريق</SelectItem>
                    <SelectItem value="out-for-delivery">خارج للتوصيل</SelectItem>
                    <SelectItem value="delivered">تم التوصيل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                    <SelectItem value="returned">مرتجع</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                عدد النتائج: <span className="font-bold text-foreground">{filteredShipments.length}</span>
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("")
                  setEndDate("")
                  setStatusFilter("all")
                  setSearchQuery("")
                }}
              >
                إعادة تعيين الفلاتر
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Print Header - Hidden on screen, visible on print */}
        <div className="hidden print:block mb-8 border-b-2 border-gray-300 pb-6">
          <div className="text-center mb-4">
            {companyInfo.name && <h1 className="text-4xl font-bold mb-2">{companyInfo.name}</h1>}
            {companyInfo.phone && <p className="text-sm text-gray-600">هاتف: {companyInfo.phone}</p>}
            {companyInfo.address && <p className="text-sm text-gray-600">العنوان: {companyInfo.address}</p>}
          </div>

          <div className="text-center mt-6">
            <h2 className="text-3xl font-bold mb-4 text-primary">سجل الشحنات</h2>

            <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto mt-4">
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm font-semibold text-gray-700">تاريخ الطباعة</p>
                <p className="text-lg font-bold">{new Date().toLocaleDateString("ar-JO")}</p>
              </div>

              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm font-semibold text-gray-700">عدد الشحنات</p>
                <p className="text-lg font-bold text-primary">{filteredShipments.length}</p>
              </div>

              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm font-semibold text-gray-700">تم التوصيل</p>
                <p className="text-lg font-bold text-green-600">{stats.delivered}</p>
              </div>

              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm font-semibold text-gray-700">إجمالي الإيرادات</p>
                <p className="text-lg font-bold text-accent">{stats.totalRevenue.toFixed(2)} د.أ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipments Table */}
        <Card className="glass-effect">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right font-bold">رقم التتبع</TableHead>
                    <TableHead className="text-right font-bold">المرسل</TableHead>
                    <TableHead className="text-right font-bold">هاتف المرسل</TableHead>
                    <TableHead className="text-right font-bold">المستلم</TableHead>
                    <TableHead className="text-right font-bold">هاتف المستلم</TableHead>
                    <TableHead className="text-right font-bold">تاريخ الاستلام</TableHead>
                    <TableHead className="text-right font-bold">تاريخ التسليم</TableHead>
                    <TableHead className="text-right font-bold">الحالة</TableHead>
                    <TableHead className="text-right font-bold">القيمة (د.أ)</TableHead>
                    <TableHead className="text-right font-bold print:hidden">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Package className="w-12 h-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">لا توجد شحنات تطابق معايير البحث</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredShipments.map((shipment) => (
                      <TableRow key={shipment.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono font-semibold text-primary">
                          {shipment.trackingNumber}
                        </TableCell>
                        <TableCell className="font-medium">{shipment.senderName}</TableCell>
                        <TableCell dir="ltr" className="text-right">
                          {shipment.senderPhone}
                        </TableCell>
                        <TableCell className="font-medium">{shipment.receiverName}</TableCell>
                        <TableCell dir="ltr" className="text-right">
                          {shipment.receiverPhone}
                        </TableCell>
                        <TableCell>{new Date(shipment.receivedDate).toLocaleDateString("ar-JO")}</TableCell>
                        <TableCell>
                          {shipment.status === "delivered" && new Date(shipment.createdAt).toLocaleDateString("ar-JO")}
                          {shipment.status !== "delivered" && <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(shipment.status)}`}
                          >
                            {getStatusInfo(shipment.status).label}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-accent">{shipment.amount.toFixed(2)}</TableCell>
                        <TableCell className="print:hidden">
                          <Link href={`/shipment/${shipment.id}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Eye className="w-4 h-4" />
                              عرض
                            </Button>
                          </Link>
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
          
          .bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          
          .text-primary {
            color: #3b82f6 !important;
          }
          
          .text-green-600 {
            color: #16a34a !important;
          }
          
          .text-accent {
            color: #f59e0b !important;
          }
        }
      `}</style>
    </div>
  )
}
