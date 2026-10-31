"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Eye, DollarSign, ArrowRight, Filter, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ShipmentData {
  id: string
  trackingNumber: string
  senderName: string
  senderPhone: string
  senderAddress: string
  senderCountry: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  receiverCountry: string
  description: string
  amount: number
  weight: number
  receivedDate: string
  status: string
  paymentStatus?: string
  createdAt: string
}

interface InvoicesContentProps {
  initialShipments: ShipmentData[]
}

export function InvoicesContent({ initialShipments }: InvoicesContentProps) {
  const [shipments, setShipments] = useState<ShipmentData[]>(initialShipments)
  const [filteredShipments, setFilteredShipments] = useState<ShipmentData[]>(initialShipments)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showInvoices, setShowInvoices] = useState(false)

  useEffect(() => {
    setShipments(initialShipments)
    setFilteredShipments(initialShipments)
  }, [initialShipments])

  useEffect(() => {
    filterShipments()
  }, [searchTerm, statusFilter, shipments])

  const filterShipments = () => {
    let filtered = shipments

    if (searchTerm) {
      filtered = filtered.filter(
        (shipment) =>
          generateInvoiceNumber(shipment, shipments.indexOf(shipment))
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          shipment.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shipment.receiverPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((shipment) => shipment.status === statusFilter)
    }

    setFilteredShipments(filtered)
  }

  const generateInvoiceNumber = (shipment: ShipmentData, index: number) => {
    const year = new Date(shipment.createdAt || shipment.receivedDate).getFullYear()
    const sequentialNumber = String(index + 1).padStart(4, "0")
    return `INV-${year}-${sequentialNumber}`
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "قيد الانتظار", variant: "secondary" as const },
      processing: { label: "قيد المعالجة", variant: "outline" as const },
      "in-transit": { label: "في الطريق", variant: "outline" as const },
      "out-for-delivery": { label: "خارج للتوصيل", variant: "outline" as const },
      delivered: { label: "تم التوصيل", variant: "default" as const },
      cancelled: { label: "ملغاة", variant: "destructive" as const },
      returned: { label: "مرتجع", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const totalAmount = filteredShipments.reduce((sum, shipment) => sum + Number(shipment.amount || 0), 0)
  const deliveredAmount = filteredShipments
    .filter((s) => s.status === "delivered")
    .reduce((sum, shipment) => sum + Number(shipment.amount || 0), 0)
  const pendingAmount = filteredShipments
    .filter((s) => s.status === "pending" || s.status === "in-transit" || s.status === "processing")
    .reduce((sum, shipment) => sum + Number(shipment.amount || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-glow ring-2 ring-primary/20">
              <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-2" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                نظام الفواتير
              </h1>
              <p className="text-sm text-muted-foreground">إدارة ومتابعة جميع الفواتير</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-effect p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
                <p className="text-2xl font-bold text-foreground">{totalAmount.toFixed(2)} د.أ</p>
              </div>
            </div>
          </Card>

          <Card className="glass-effect p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المبالغ المحصلة</p>
                <p className="text-2xl font-bold text-green-600">{deliveredAmount.toFixed(2)} د.أ</p>
              </div>
            </div>
          </Card>

          <Card className="glass-effect p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/10">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                <p className="text-2xl font-bold text-orange-600">{pendingAmount.toFixed(2)} د.أ</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-effect p-6 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="البحث برقم الفاتورة أو اسم العميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="processing">قيد المعالجة</SelectItem>
                <SelectItem value="in-transit">في الطريق</SelectItem>
                <SelectItem value="out-for-delivery">خارج للتوصيل</SelectItem>
                <SelectItem value="delivered">تم التوصيل</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
                <SelectItem value="returned">مرتجع</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowInvoices(!showInvoices)} variant="outline" className="gap-2">
              {showInvoices ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  إخفاء القائمة
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  إظهار القائمة
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Invoices Table */}
        {showInvoices && (
          <Card className="glass-effect shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right font-bold">رقم الفاتورة</TableHead>
                    <TableHead className="text-right font-bold">رقم التتبع</TableHead>
                    <TableHead className="text-right font-bold">اسم المستلم</TableHead>
                    <TableHead className="text-right font-bold">رقم الهاتف</TableHead>
                    <TableHead className="text-right font-bold">المبلغ</TableHead>
                    <TableHead className="text-right font-bold">تاريخ الاستلام</TableHead>
                    <TableHead className="text-right font-bold">الحالة</TableHead>
                    <TableHead className="text-right font-bold">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-12 h-12 text-muted-foreground" />
                          <p className="text-muted-foreground">لا توجد فواتير</p>
                          {shipments.length === 0 && (
                            <p className="text-sm text-muted-foreground">قم بإضافة شحنات أولاً لإنشاء الفواتير</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredShipments.map((shipment, index) => {
                      const originalIndex = shipments.findIndex((s) => s.id === shipment.id)
                      return (
                        <TableRow key={shipment.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-mono font-semibold text-primary">
                            {generateInvoiceNumber(shipment, originalIndex)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{shipment.trackingNumber}</TableCell>
                          <TableCell>{shipment.receiverName}</TableCell>
                          <TableCell className="font-mono" dir="ltr" style={{ textAlign: "right" }}>
                            {shipment.receiverPhone}
                          </TableCell>
                          <TableCell className="font-bold text-primary">
                            {Number(shipment.amount || 0).toFixed(2)} د.أ
                          </TableCell>
                          <TableCell>{new Date(shipment.receivedDate).toLocaleDateString("ar-IQ")}</TableCell>
                          <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                          <TableCell>
                            <Link href={`/invoices/${shipment.id}`}>
                              <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                                <Eye className="w-4 h-4" />
                                عرض
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
