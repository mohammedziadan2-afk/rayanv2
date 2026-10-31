"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  ArrowLeft,
  Truck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { ShipmentData } from "@/app/actions/shipments"
import { getAllTrips, type Trip } from "@/app/actions/trips"
import {
  getAdditionalRevenues,
  addAdditionalRevenue,
  deleteAdditionalRevenue,
  type AdditionalRevenue,
} from "@/app/actions/revenues"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCSRFToken } from "@/app/actions/csrf"

interface RevenuesContentProps {
  initialShipments: ShipmentData[]
}

export function RevenuesContent({ initialShipments }: RevenuesContentProps) {
  const [shipments, setShipments] = useState<ShipmentData[]>(initialShipments)
  const [trips, setTrips] = useState<Trip[]>([])
  const [additionalRevenues, setAdditionalRevenues] = useState<AdditionalRevenue[]>([])
  const [csrfToken, setCsrfToken] = useState("")
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalTripRevenues, setTotalTripRevenues] = useState(0)
  const [showShipmentsDetails, setShowShipmentsDetails] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<ShipmentData | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newRevenue, setNewRevenue] = useState({
    title: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "other",
  })
  const { toast } = useToast()

  useEffect(() => {
    getCSRFToken().then(setCsrfToken)
    loadTrips()
    loadAdditionalRevenues()
  }, [])

  const loadTrips = async () => {
    const tripsData = await getAllTrips()
    setTrips(tripsData)
  }

  const loadAdditionalRevenues = async () => {
    const result = await getAdditionalRevenues()
    if (result.success) {
      setAdditionalRevenues(result.data)
    }
  }

  useEffect(() => {
    const shipmentsTotal = shipments.reduce((sum, shipment) => sum + (shipment.amount || 0), 0)
    const tripsTotal = trips.reduce((sum, trip) => sum + trip.tobacco_revenue + trip.other_revenue, 0)
    const additionalTotal = additionalRevenues.reduce((sum, rev) => sum + rev.amount, 0)

    setTotalRevenue(shipmentsTotal + tripsTotal + additionalTotal)
    setTotalTripRevenues(tripsTotal)
  }, [shipments, trips, additionalRevenues])

  const handlePrint = () => {
    window.print()
  }

  const handleAddRevenue = async () => {
    if (!newRevenue.title || !newRevenue.amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      })
      return
    }

    const freshToken = await getCSRFToken()
    const result = await addAdditionalRevenue(
      {
        ...newRevenue,
        amount: Number.parseFloat(newRevenue.amount),
      },
      freshToken,
    )

    if (result.success) {
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الإيراد بنجاح",
      })
      const newToken = await getCSRFToken()
      setCsrfToken(newToken)
      setIsAddDialogOpen(false)
      setNewRevenue({
        title: "",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        category: "other",
      })
      loadAdditionalRevenues()
    } else {
      toast({
        title: "خطأ",
        description: result.error || "فشل في إضافة الإيراد",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRevenue = async (id: string) => {
    const freshToken = await getCSRFToken()
    const result = await deleteAdditionalRevenue(id, freshToken)
    if (result.success) {
      toast({
        title: "تم بنجاح",
        description: "تم حذف الإيراد بنجاح",
      })
      const newToken = await getCSRFToken()
      setCsrfToken(newToken)
      loadAdditionalRevenues()
    } else {
      toast({
        title: "خطأ",
        description: result.error || "فشل في حذف الإيراد",
        variant: "destructive",
      })
    }
  }

  const handleShipmentClick = (shipment: ShipmentData) => {
    setSelectedShipment(shipment)
    setIsShipmentDialogOpen(true)
  }

  const [isShipmentDialogOpen, setIsShipmentDialogOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10 print:hidden">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="relative w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-glow ring-2 ring-primary/20 flex-shrink-0">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-1 sm:p-2" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent leading-tight">
                  مؤسسة الريان واريان للشحن
                </h1>
                <p className="text-[10px] sm:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1">
                  تفاصيل الإيرادات
                </p>
              </div>
            </div>

            <Link href="/finance">
              <Button
                size="sm"
                variant="outline"
                className="gap-1 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">العودة للمالية</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="space-y-6 print:space-y-4">
          <div className="flex items-center justify-between print:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-green-500/10">
                <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">تفاصيل الإيرادات</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  إجمالي الإيرادات من جميع المصادر
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 print:hidden">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">إضافة إيراد</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>إضافة إيراد جديد</DialogTitle>
                    <DialogDescription>أضف إيراد إضافي جديد للميزانية</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">العنوان *</Label>
                      <Input
                        id="title"
                        value={newRevenue.title}
                        onChange={(e) => setNewRevenue({ ...newRevenue, title: e.target.value })}
                        placeholder="مثال: إيراد من خدمات إضافية"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">المبلغ (د.ع) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={newRevenue.amount}
                        onChange={(e) => setNewRevenue({ ...newRevenue, amount: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">التاريخ</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newRevenue.date}
                        onChange={(e) => setNewRevenue({ ...newRevenue, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">الفئة</Label>
                      <Select
                        value={newRevenue.category}
                        onValueChange={(value) => setNewRevenue({ ...newRevenue, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service">خدمات</SelectItem>
                          <SelectItem value="commission">عمولات</SelectItem>
                          <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">الوصف</Label>
                      <Textarea
                        id="description"
                        value={newRevenue.description}
                        onChange={(e) => setNewRevenue({ ...newRevenue, description: e.target.value })}
                        placeholder="تفاصيل إضافية (اختياري)"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleAddRevenue}>إضافة</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={handlePrint} className="gap-2 print:hidden">
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">طباعة</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glass-effect border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                    <p className="text-2xl font-bold text-green-500">{totalRevenue.toLocaleString()} د.ع</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Package className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إيرادات الشحنات</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {shipments.reduce((sum, s) => sum + (s.amount || 0), 0).toLocaleString()} د.ع
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <Truck className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إيرادات الرحلات</p>
                    <p className="text-2xl font-bold text-purple-500">{totalTripRevenues.toLocaleString()} د.ع</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-orange-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-orange-500/10">
                    <Plus className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إيرادات إضافية</p>
                    <p className="text-2xl font-bold text-orange-500">
                      {additionalRevenues.reduce((sum, r) => sum + r.amount, 0).toLocaleString()} د.ع
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {additionalRevenues.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-500" />
                الإيرادات الإضافية ({additionalRevenues.length})
              </h3>
              <div className="space-y-2">
                {additionalRevenues.map((revenue) => (
                  <Card
                    key={revenue.id}
                    className="glass-effect hover:shadow-md transition-shadow border-orange-500/10"
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-muted-foreground" />
                            <p className="font-semibold">{revenue.title}</p>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            {revenue.description && <p>{revenue.description}</p>}
                            <p>
                              الفئة:{" "}
                              {revenue.category === "service"
                                ? "خدمات"
                                : revenue.category === "commission"
                                  ? "عمولات"
                                  : "أخرى"}
                            </p>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(revenue.date).toLocaleDateString("en-GB")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-left">
                            <p className="text-sm text-muted-foreground">المبلغ</p>
                            <p className="text-xl font-bold text-orange-500">{revenue.amount.toLocaleString()} د.ع</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRevenue(revenue.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 print:hidden"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {trips.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-500" />
                إيرادات الرحلات ({trips.length})
              </h3>
              <div className="space-y-2">
                {trips.map((trip) => {
                  const additionalRevenue = trip.tobacco_revenue + trip.other_revenue
                  if (additionalRevenue === 0) return null

                  return (
                    <Card key={trip.id} className="glass-effect hover:shadow-md transition-shadow border-purple-500/10">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-muted-foreground" />
                              <p className="font-semibold">رحلة رقم {trip.trip_number}</p>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-0.5">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(trip.departure_date).toLocaleDateString("en-GB")}</span>
                              </div>
                              <p>إيرادات التبغ: {trip.tobacco_revenue.toLocaleString()} د.ع</p>
                              <p>إيرادات أخرى: {trip.other_revenue.toLocaleString()} د.ع</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-muted-foreground">الإيرادات الإضافية</p>
                            <p className="text-xl font-bold text-purple-500">
                              {additionalRevenue.toLocaleString()} د.ع
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {shipments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  تفاصيل الشحنات ({shipments.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShipmentsDetails(!showShipmentsDetails)}
                  className="gap-2 print:hidden"
                >
                  {showShipmentsDetails ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      إخفاء الجدول
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      إظهار الجدول
                    </>
                  )}
                </Button>
              </div>

              {showShipmentsDetails && (
                <Card className="glass-effect">
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">رقم التتبع</TableHead>
                          <TableHead className="text-right">القيمة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shipments.map((shipment) => (
                          <TableRow key={shipment.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell
                              className="font-medium text-blue-500 hover:text-blue-600 hover:underline"
                              onClick={() => handleShipmentClick(shipment)}
                            >
                              {shipment.trackingNumber}
                            </TableCell>
                            <TableCell className="text-green-500 font-semibold">
                              {shipment.amount.toLocaleString()} د.ع
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {shipments.length === 0 && trips.length === 0 && additionalRevenues.length === 0 && (
            <Card className="glass-effect">
              <CardContent className="pt-6 text-center py-12">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">لا توجد شحنات أو رحلات أو إيرادات إضافية مسجلة</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={isShipmentDialogOpen} onOpenChange={setIsShipmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>تفاصيل الشحنة</DialogTitle>
            <DialogDescription>معلومات كاملة عن الشحنة</DialogDescription>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span className="font-semibold">رقم التتبع</span>
                </div>
                <p className="text-lg font-bold">{selectedShipment.trackingNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">المرسل</p>
                  <p className="font-semibold">{selectedShipment.senderName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">المستلم</p>
                  <p className="font-semibold">{selectedShipment.receiverName}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>تاريخ الاستلام</span>
                </div>
                <p className="font-semibold">{new Date(selectedShipment.receivedDate).toLocaleDateString("ar-EG")}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">الحالة</p>
                <p className="font-semibold">
                  {selectedShipment.status === "pending"
                    ? "قيد الانتظار"
                    : selectedShipment.status === "in_transit"
                      ? "في الطريق"
                      : selectedShipment.status === "delivered"
                        ? "تم التسليم"
                        : "ملغي"}
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm text-muted-foreground">القيمة</p>
                <p className="text-2xl font-bold text-green-500">{selectedShipment.amount.toLocaleString()} د.ع</p>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setIsShipmentDialogOpen(false)}>إغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
