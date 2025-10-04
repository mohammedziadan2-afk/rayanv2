"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Eye, Trash2, Search, ChevronDown, ChevronUp, Edit, FileText, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ShipmentInvoice } from "./shipment-invoice"

interface ShipmentItem {
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
  paymentMethod?: string // إضافة طريقة الدفع
  paymentLocation?: string // إضافة مكان الدفع
  createdAt: string
  location?: {
    x: number
    y: number
    label?: string
  }
  deletedAt?: string // إضافة تاريخ الحذف
}

const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: "قيد الانتظار", color: "text-yellow-700", bgColor: "bg-yellow-100 border-yellow-300" },
    processing: { label: "قيد المعالجة", color: "text-blue-700", bgColor: "bg-blue-100 border-blue-300" },
    "in-transit": { label: "في الطريق", color: "text-purple-700", bgColor: "bg-purple-100 border-purple-300" },
    "out-for-delivery": { label: "خارج للتوصيل", color: "text-indigo-700", bgColor: "bg-indigo-100 border-indigo-300" },
    delivered: { label: "تم التوصيل", color: "text-green-700", bgColor: "bg-green-100 border-green-300" },
    cancelled: { label: "ملغي", color: "text-red-700", bgColor: "bg-red-100 border-red-300" },
    returned: { label: "مرتجع", color: "text-orange-700", bgColor: "bg-orange-100 border-orange-300" },
  }

  return statusMap[status] || { label: status, color: "text-gray-700", bgColor: "bg-gray-100 border-gray-300" }
}

const getShortDescription = (description: string | undefined): string => {
  if (!description) return "-"
  const words = description.trim().split(/\s+/)
  return words.slice(0, 2).join(" ")
}

export function ShipmentList() {
  const [shipments, setShipments] = useState<ShipmentItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isExpanded, setIsExpanded] = useState(true)
  const [editingShipment, setEditingShipment] = useState<ShipmentItem | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [invoiceShipment, setInvoiceShipment] = useState<ShipmentItem | null>(null)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const { toast } = useToast()

  const loadShipments = () => {
    const stored = localStorage.getItem("shipments")
    if (stored) {
      setShipments(JSON.parse(stored))
    }
  }

  useEffect(() => {
    loadShipments()

    const handleUpdate = () => loadShipments()
    window.addEventListener("shipmentsUpdated", handleUpdate)

    return () => window.removeEventListener("shipmentsUpdated", handleUpdate)
  }, [])

  const deleteShipment = (id: string) => {
    const shipmentToDelete = shipments.find((s) => s.id === id)
    if (!shipmentToDelete) return

    // إضافة تاريخ الحذف
    const deletedShipment = {
      ...shipmentToDelete,
      deletedAt: new Date().toISOString(),
    }

    // حفظ في سلة المحذوفات
    const deletedShipments = JSON.parse(localStorage.getItem("deletedShipments") || "[]")
    deletedShipments.push(deletedShipment)
    localStorage.setItem("deletedShipments", JSON.stringify(deletedShipments))

    // إزالة من القائمة الرئيسية
    const updated = shipments.filter((s) => s.id !== id)
    localStorage.setItem("shipments", JSON.stringify(updated))
    setShipments(updated)

    toast({
      title: "تم النقل إلى سلة المحذوفات",
      description: "يمكنك استرجاع الشحنة خلال شهر من تاريخ الحذف",
    })
  }

  const updateShipmentStatus = (id: string, newStatus: string) => {
    const updated = shipments.map((s) => {
      if (s.id === id) {
        const updatedShipment = { ...s, status: newStatus }
        // إذا تم تغيير الحالة إلى "تم التوصيل" وطريقة الدفع "عند التسليم"، غيرها إلى "نقداً"
        if (newStatus === "delivered" && s.paymentMethod === "on-delivery") {
          updatedShipment.paymentMethod = "cash"
        }
        return updatedShipment
      }
      return s
    })
    localStorage.setItem("shipments", JSON.stringify(updated))
    setShipments(updated)
    toast({
      title: "نجح",
      description: "تم تحديث حالة الشحنة بنجاح",
    })
  }

  const saveShipmentEdit = () => {
    if (!editingShipment) return

    const updated = shipments.map((s) => (s.id === editingShipment.id ? editingShipment : s))
    localStorage.setItem("shipments", JSON.stringify(updated))
    setShipments(updated)
    setIsEditDialogOpen(false)
    setEditingShipment(null)
    toast({
      title: "نجح",
      description: "تم تحديث الشحنة بنجاح",
    })
  }

  const openEditDialog = (shipment: ShipmentItem) => {
    setEditingShipment({ ...shipment })
    setIsEditDialogOpen(true)
  }

  const openInvoice = (shipment: ShipmentItem) => {
    setInvoiceShipment(shipment)
    setIsInvoiceOpen(true)
  }

  const filteredShipments = shipments.filter(
    (shipment) =>
      shipment.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.id.includes(searchTerm),
  )

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader
          className="bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors p-3 sm:p-6"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <div>
                <CardTitle className="text-base sm:text-lg">قائمة الشحنات</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  عرض وإدارة جميع الشحنات ({filteredShipments.length})
                </CardDescription>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="mb-3 sm:mb-4 relative">
              <Search className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن شحنة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8 sm:pr-10 text-sm"
              />
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredShipments.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد شحنات"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden lg:grid lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr_1.5fr_1.5fr_1.5fr_2fr] gap-3 p-3 bg-muted/50 rounded-lg font-semibold text-sm border border-border">
                    <div>رقم التتبع</div>
                    <div>القيمة</div>
                    <div>طريقة الدفع</div>
                    <div>مكان الدفع</div>
                    <div>الحالة</div>
                    <div>الوصف</div>
                    <div>المرسل</div>
                    <div>المستلم</div>
                    <div className="text-center">الإجراءات</div>
                  </div>

                  {filteredShipments.map((shipment) => {
                    const statusInfo = getStatusInfo(shipment.status)
                    return (
                      <div
                        key={shipment.id}
                        className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr_1.5fr_1.5fr_1.5fr_2fr] gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground lg:hidden font-semibold">رقم التتبع</span>
                          <span className="text-[10px] sm:text-xs font-mono text-primary-foreground bg-primary px-2 py-1 rounded w-fit">
                            {shipment.trackingNumber}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground lg:hidden font-semibold">القيمة</span>
                          <span className="text-[10px] sm:text-xs font-semibold text-accent-foreground bg-accent px-2 py-1 rounded w-fit">
                            {shipment.amount?.toFixed(2) || "0.00"} د.أ
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground lg:hidden font-semibold">طريقة الدفع</span>
                          <span className="text-[10px] sm:text-xs font-semibold text-foreground">
                            {shipment.paymentMethod === "cash"
                              ? "نقداً"
                              : shipment.paymentMethod === "on-delivery"
                                ? "عند التسليم"
                                : "نقداً"}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground lg:hidden font-semibold">مكان الدفع</span>
                          <span className="text-[10px] sm:text-xs font-semibold text-foreground">
                            {shipment.paymentLocation === "sender"
                              ? "عند المرسل"
                              : shipment.paymentLocation === "receiver"
                                ? "عند المستلم"
                                : "عند المرسل"}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground lg:hidden font-semibold">الحالة</span>
                          <Select
                            value={shipment.status}
                            onValueChange={(value) => updateShipmentStatus(shipment.id, value)}
                          >
                            <SelectTrigger
                              className={`text-[10px] sm:text-xs font-semibold px-2 py-1 h-auto border ${statusInfo.bgColor} ${statusInfo.color} w-full lg:w-auto`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
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

                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground lg:hidden font-semibold">الوصف</span>
                          <span className="text-xs text-foreground/80" title={shipment.description}>
                            {getShortDescription(shipment.description)}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground lg:hidden font-semibold">المرسل</span>
                          <p className="font-semibold text-xs sm:text-sm text-foreground">{shipment.senderName}</p>
                          {shipment.senderCountry && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground">{shipment.senderCountry}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground lg:hidden font-semibold">المستلم</span>
                          <p className="font-semibold text-xs sm:text-sm text-foreground">{shipment.receiverName}</p>
                          {shipment.receiverCountry && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground">{shipment.receiverCountry}</p>
                          )}
                        </div>

                        <div className="flex gap-1.5 sm:gap-2 justify-start lg:justify-center flex-wrap">
                          <Link href={`/shipment/${shipment.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              title="عرض التفاصيل"
                              className="h-8 w-8 p-0 bg-transparent hover:bg-accent/10 hover:text-accent hover:border-accent"
                            >
                              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                          </Link>
                          <Link href={`/location/${shipment.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              title="موقع الشحنة الحالي"
                              className="h-8 w-8 p-0 bg-transparent hover:bg-accent/10 hover:text-accent hover:border-accent"
                            >
                              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(shipment)}
                            title="تعديل"
                            className="h-8 w-8 p-0 hover:bg-accent/10 hover:text-accent hover:border-accent"
                          >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 w-8 p-0 gradient-accent"
                            onClick={() => openInvoice(shipment)}
                            title="طباعة فاتورة"
                          >
                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" title="حذف" className="h-8 w-8 p-0">
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-base sm:text-lg">هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs sm:text-sm">
                                  سيتم حذف الشحنة نهائياً ولا يمكن التراجع عن هذا الإجراء
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="text-xs sm:text-sm">إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteShipment(shipment.id)}
                                  className="text-xs sm:text-sm"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">تعديل الشحنة</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">قم بتعديل تفاصيل الشحنة</DialogDescription>
          </DialogHeader>

          {editingShipment && (
            <div className="space-y-3 sm:space-y-4">
              {/* معلومات المرسل */}
              <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg bg-secondary/50">
                <h3 className="font-semibold text-xs sm:text-sm">معلومات المرسل</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">الاسم</Label>
                    <Input
                      value={editingShipment.senderName}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderName: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">رقم الهاتف</Label>
                    <Input
                      value={editingShipment.senderPhone}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderPhone: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">الدولة</Label>
                    <Input
                      value={editingShipment.senderCountry}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderCountry: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                    <Label className="text-xs sm:text-sm">العنوان</Label>
                    <Textarea
                      value={editingShipment.senderAddress}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderAddress: e.target.value })}
                      className="text-sm min-h-[60px]"
                    />
                  </div>
                </div>
              </div>

              {/* معلومات المستقبل */}
              <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg bg-accent/10">
                <h3 className="font-semibold text-xs sm:text-sm">معلومات المستقبل</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">الاسم</Label>
                    <Input
                      value={editingShipment.receiverName}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverName: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">رقم الهاتف</Label>
                    <Input
                      value={editingShipment.receiverPhone}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverPhone: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">الدولة</Label>
                    <Input
                      value={editingShipment.receiverCountry}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverCountry: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                    <Label className="text-xs sm:text-sm">العنوان</Label>
                    <Textarea
                      value={editingShipment.receiverAddress}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverAddress: e.target.value })}
                      className="text-sm min-h-[60px]"
                    />
                  </div>
                </div>
              </div>

              {/* تفاصيل الشحنة */}
              <div className="space-y-2 sm:space-y-3">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">وصف الشحنة</Label>
                  <Textarea
                    value={editingShipment.description}
                    onChange={(e) => setEditingShipment({ ...editingShipment, description: e.target.value })}
                    className="text-sm min-h-[60px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">الوزن (كجم)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingShipment.weight}
                      onChange={(e) =>
                        setEditingShipment({ ...editingShipment, weight: Number.parseFloat(e.target.value) })
                      }
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">القيمة (د.أ)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingShipment.amount}
                      onChange={(e) =>
                        setEditingShipment({ ...editingShipment, amount: Number.parseFloat(e.target.value) })
                      }
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">تاريخ الاستلام</Label>
                    <Input
                      type="date"
                      value={editingShipment.receivedDate}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receivedDate: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">الحالة</Label>
                    <Select
                      value={editingShipment.status}
                      onValueChange={(value) => setEditingShipment({ ...editingShipment, status: value })}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">طريقة الدفع</Label>
                    <Select
                      value={editingShipment.paymentMethod}
                      onValueChange={(value) => setEditingShipment({ ...editingShipment, paymentMethod: value })}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقداً</SelectItem>
                        <SelectItem value="on-delivery">عند التسليم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">مكان الدفع</Label>
                    <Select
                      value={editingShipment.paymentLocation || "sender"}
                      onValueChange={(value) => setEditingShipment({ ...editingShipment, paymentLocation: value })}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sender">عند المرسل</SelectItem>
                        <SelectItem value="receiver">عند المستلم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 sm:pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  إلغاء
                </Button>
                <Button onClick={saveShipmentEdit} size="sm" className="text-xs sm:text-sm">
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ShipmentInvoice shipment={invoiceShipment} open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen} />
    </>
  )
}
