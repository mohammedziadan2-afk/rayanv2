"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  FileText,
  MapPin,
  Package,
  Calendar,
  Phone,
  User,
  Eye,
  ArrowRight,
  CheckCircle,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase-client"
import { toast } from "sonner"
import type { Shipment } from "@/components/shipment-form"
import { ChatDialog } from "@/components/chat-dialog"

interface ShippingRequest {
  id: string
  request_number: string
  customer_name: string
  customer_phone: string | null
  pickup_location: string
  pickup_address: string | null
  delivery_location: string
  delivery_address: string | null
  package_description: string | null
  estimated_weight: number | null
  estimated_value: number | null
  status: string
  notes: string | null
  request_date: string
  created_at: string
  updated_at: string
}

const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "قيد الانتظار", variant: "outline" },
    approved: { label: "تمت الموافقة", variant: "default" },
    processing: { label: "قيد المعالجة", variant: "secondary" },
    rejected: { label: "مرفوض", variant: "destructive" },
    completed: { label: "مكتمل", variant: "default" },
  }

  return statusMap[status] || { label: status, variant: "outline" }
}

export default function ShippingRequestsPage() {
  const [requests, setRequests] = useState<ShippingRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ShippingRequest[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedRequest, setSelectedRequest] = useState<ShippingRequest | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({})

  const supabase = createBrowserClient()

  useEffect(() => {
    loadRequests()
    loadUnreadCounts()
    const interval = setInterval(loadUnreadCounts, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("shipping_requests")
        .select("*")
        .order("request_date", { ascending: false })

      if (error) throw error

      setRequests(data || [])
    } catch (error) {
      console.error("[v0] Error loading shipping requests:", error)
      toast.error("فشل تحميل طلبات الشحن")
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCounts = () => {
    try {
      const allMessages = JSON.parse(localStorage.getItem("messages") || "[]")
      const counts: { [key: string]: number } = {}

      allMessages.forEach((msg: any) => {
        if (msg.sender_type === "customer" && !msg.read) {
          counts[msg.request_id] = (counts[msg.request_id] || 0) + 1
        }
      })

      setUnreadCounts(counts)
    } catch (error) {
      console.error("[v0] Error loading unread counts:", error)
    }
  }

  useEffect(() => {
    filterRequests()
  }, [requests, searchTerm, statusFilter])

  const filterRequests = () => {
    let filtered = requests

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (req) =>
          req.customer_name.toLowerCase().includes(term) ||
          req.request_number.toLowerCase().includes(term) ||
          req.pickup_location.toLowerCase().includes(term) ||
          req.delivery_location.toLowerCase().includes(term),
      )
    }

    setFilteredRequests(filtered)
  }

  const openDetails = (request: ShippingRequest) => {
    setSelectedRequest(request)
    setIsDetailsOpen(true)
  }

  const openChat = (request: ShippingRequest) => {
    setSelectedRequest(request)
    setIsChatOpen(true)
  }

  const convertToShipment = async (request: ShippingRequest) => {
    try {
      const trackingNumber = `SH${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`

      const newShipment: Shipment = {
        id: Date.now().toString(),
        trackingNumber,
        senderName: request.customer_name,
        senderPhone: request.customer_phone || "",
        senderAddress: request.pickup_address || request.pickup_location,
        senderCountry: "",
        receiverName: "المستلم",
        receiverPhone: "",
        receiverAddress: request.delivery_address || request.delivery_location,
        receiverCountry: "",
        description: request.package_description || "",
        amount: request.estimated_value || 0,
        weight: request.estimated_weight || 0,
        receivedDate: new Date().toISOString().split("T")[0],
        status: "pending",
        paymentMethod: "cash",
        paymentLocation: "sender",
        createdAt: new Date().toISOString(),
        location: {
          x: 0,
          y: 0,
          label: request.pickup_location,
        },
      }

      const existingShipments = JSON.parse(localStorage.getItem("shipments") || "[]")
      const updatedShipments = [newShipment, ...existingShipments]
      localStorage.setItem("shipments", JSON.stringify(updatedShipments))

      const { error } = await supabase
        .from("shipping_requests")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", request.id)

      if (error) throw error

      await loadRequests()
      window.dispatchEvent(new Event("shipmentsUpdated"))

      toast.success(`تم تحويل الطلب إلى شحنة بنجاح! رقم التتبع: ${trackingNumber}`)
      setIsDetailsOpen(false)
    } catch (error) {
      console.error("[v0] Error converting request to shipment:", error)
      toast.error("فشل تحويل الطلب إلى شحنة")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ar-JO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl gradient-primary shadow-glow">
                <FileText className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">طلبات الشحن</h1>
                <p className="text-sm text-muted-foreground mt-1">عرض وإدارة جميع طلبات الشحن</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/request-shipping">
                <Button
                  variant="outline"
                  className="gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent"
                >
                  <Package className="w-5 h-5" />
                  <span className="hidden sm:inline">طلب شحن جديد</span>
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  className="gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span className="hidden sm:inline">العودة للرئيسية</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <Card className="shadow-lg glass-effect">
          <CardHeader className="bg-primary/5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">قائمة طلبات الشحن</CardTitle>
                <CardDescription>إجمالي الطلبات: {filteredRequests.length}</CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:min-w-[300px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث بالاسم أو رقم الطلب أو الموقع..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="تصفية حسب الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="approved">تمت الموافقة</SelectItem>
                    <SelectItem value="processing">قيد المعالجة</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" ? "لا توجد نتائج للبحث" : "لا توجد طلبات شحن"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="hidden lg:grid lg:grid-cols-[1fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1.2fr] gap-4 p-4 bg-muted/50 rounded-lg font-semibold text-sm border border-border">
                  <div>رقم الطلب</div>
                  <div>اسم العميل</div>
                  <div>موقع الاستلام</div>
                  <div>موقع التسليم</div>
                  <div>الحالة</div>
                  <div>تاريخ الطلب</div>
                  <div className="text-center">الإجراءات</div>
                </div>

                {filteredRequests.map((request) => {
                  const statusInfo = getStatusInfo(request.status)
                  const unreadCount = unreadCounts[request.id] || 0
                  return (
                    <div
                      key={request.id}
                      className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1.2fr] gap-3 p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground lg:hidden font-semibold">رقم الطلب</span>
                        <span className="text-xs font-mono text-primary-foreground bg-primary px-2 py-1 rounded w-fit">
                          {request.request_number}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground lg:hidden font-semibold">اسم العميل</span>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-semibold text-sm">{request.customer_name}</p>
                            {request.customer_phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {request.customer_phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground lg:hidden font-semibold">موقع الاستلام</span>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-accent mt-0.5" />
                          <div>
                            <p className="font-semibold text-sm">{request.pickup_location}</p>
                            {request.pickup_address && (
                              <p className="text-xs text-muted-foreground">{request.pickup_address}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground lg:hidden font-semibold">موقع التسليم</span>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-secondary mt-0.5" />
                          <div>
                            <p className="font-semibold text-sm">{request.delivery_location}</p>
                            {request.delivery_address && (
                              <p className="text-xs text-muted-foreground">{request.delivery_address}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground lg:hidden font-semibold">الحالة</span>
                        <Badge variant={statusInfo.variant} className="w-fit">
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground lg:hidden font-semibold">تاريخ الطلب</span>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">{formatDate(request.request_date)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-start lg:justify-center flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetails(request)}
                          className="gap-2 hover:bg-accent/10 hover:text-accent hover:border-accent"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">عرض التفاصيل</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openChat(request)}
                          className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary relative"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">دردشة</span>
                          {unreadCount > 0 && (
                            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
                              {unreadCount}
                            </Badge>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">تفاصيل طلب الشحن</DialogTitle>
            <DialogDescription>معلومات كاملة عن الطلب</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">معلومات الطلب</h3>
                  <Badge variant={getStatusInfo(selectedRequest.status).variant}>
                    {getStatusInfo(selectedRequest.status).label}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">رقم الطلب</Label>
                    <p className="font-mono text-sm font-semibold">{selectedRequest.request_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">تاريخ الطلب</Label>
                    <p className="text-sm">{formatDate(selectedRequest.request_date)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  معلومات العميل
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">الاسم</Label>
                    <p className="text-sm font-semibold">{selectedRequest.customer_name}</p>
                  </div>
                  {selectedRequest.customer_phone && (
                    <div>
                      <Label className="text-xs text-muted-foreground">رقم الهاتف</Label>
                      <p className="text-sm">{selectedRequest.customer_phone}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent" />
                    موقع الاستلام
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">المدينة</Label>
                      <p className="text-sm font-semibold">{selectedRequest.pickup_location}</p>
                    </div>
                    {selectedRequest.pickup_address && (
                      <div>
                        <Label className="text-xs text-muted-foreground">العنوان</Label>
                        <p className="text-sm">{selectedRequest.pickup_address}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-secondary" />
                    موقع التسليم
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">المدينة</Label>
                      <p className="text-sm font-semibold">{selectedRequest.delivery_location}</p>
                    </div>
                    {selectedRequest.delivery_address && (
                      <div>
                        <Label className="text-xs text-muted-foreground">العنوان</Label>
                        <p className="text-sm">{selectedRequest.delivery_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  تفاصيل الطرد
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedRequest.package_description && (
                    <div className="sm:col-span-3">
                      <Label className="text-xs text-muted-foreground">الوصف</Label>
                      <p className="text-sm">{selectedRequest.package_description}</p>
                    </div>
                  )}
                  {selectedRequest.estimated_weight && (
                    <div>
                      <Label className="text-xs text-muted-foreground">الوزن التقديري</Label>
                      <p className="text-sm font-semibold">{selectedRequest.estimated_weight} كجم</p>
                    </div>
                  )}
                  {selectedRequest.estimated_value && (
                    <div>
                      <Label className="text-xs text-muted-foreground">القيمة التقديرية</Label>
                      <p className="text-sm font-semibold">{selectedRequest.estimated_value.toFixed(2)} د.أ</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="space-y-2 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <Label className="text-xs text-muted-foreground">ملاحظات</Label>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.status !== "completed" && selectedRequest.status !== "rejected" && (
                <Button onClick={() => convertToShipment(selectedRequest)} className="w-full gradient-accent" size="lg">
                  <CheckCircle className="w-5 h-5 ml-2" />
                  تحويل إلى شحنة
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedRequest && (
        <ChatDialog
          open={isChatOpen}
          onOpenChange={(open) => {
            setIsChatOpen(open)
            if (!open) {
              loadUnreadCounts()
            }
          }}
          requestId={selectedRequest.id}
          requestNumber={selectedRequest.request_number}
          customerName={selectedRequest.customer_name}
          isAdmin={true}
        />
      )}
    </div>
  )
}
