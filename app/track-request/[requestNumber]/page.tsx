"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Package, MapPin, User, MessageCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase-client"
import { toast } from "sonner"
import { ChatDialog } from "@/components/chat-dialog"
import { useParams } from "next/navigation"

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
  const statusMap: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline"; description: string }
  > = {
    pending: { label: "قيد الانتظار", variant: "outline", description: "طلبك قيد المراجعة" },
    approved: { label: "تمت الموافقة", variant: "default", description: "تمت الموافقة على طلبك" },
    processing: { label: "قيد المعالجة", variant: "secondary", description: "جاري تجهيز شحنتك" },
    rejected: { label: "مرفوض", variant: "destructive", description: "تم رفض الطلب" },
    completed: { label: "مكتمل", variant: "default", description: "تم تحويل طلبك إلى شحنة" },
  }

  return statusMap[status] || { label: status, variant: "outline", description: "" }
}

export default function TrackRequestPage() {
  const params = useParams()
  const requestNumber = params.requestNumber as string
  const [request, setRequest] = useState<ShippingRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const supabase = createBrowserClient()

  useEffect(() => {
    loadRequest()
    loadUnreadCount()
    // تحديث البيانات كل 10 ثواني
    const interval = setInterval(() => {
      loadRequest()
      loadUnreadCount()
    }, 10000)
    return () => clearInterval(interval)
  }, [requestNumber])

  const loadRequest = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("shipping_requests")
        .select("*")
        .eq("request_number", requestNumber)
        .single()

      if (error) throw error

      setRequest(data)
    } catch (error) {
      console.error("[v0] Error loading request:", error)
      toast.error("فشل تحميل بيانات الطلب")
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = () => {
    if (!request) return
    try {
      const allMessages = JSON.parse(localStorage.getItem("messages") || "[]")
      const unread = allMessages.filter(
        (msg: any) => msg.request_id === request.id && msg.sender_type === "admin" && !msg.read,
      )
      setUnreadCount(unread.length)
    } catch (error) {
      console.error("[v0] Error loading unread count:", error)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg glass-effect">
          <CardContent className="pt-6 text-center space-y-4">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/50" />
            <h2 className="text-xl lg:text-3xl font-bold text-foreground">تتبع الطلب</h2>
            <p className="text-sm text-muted-foreground">رقم الطلب {requestNumber} غير موجود في النظام</p>
            <Link href="/request-shipping">
              <Button className="w-full gradient-accent">
                <Package className="w-5 h-5 ml-2" />
                طلب شحن جديد
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = getStatusInfo(request.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl gradient-primary shadow-glow">
                <Package className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">تتبع الطلب</h1>
                <p className="text-sm text-muted-foreground mt-1">رقم الطلب: {request.request_number}</p>
              </div>
            </div>
            <Link href="/request-shipping">
              <Button
                variant="outline"
                className="gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent"
              >
                <ArrowRight className="w-5 h-5" />
                <span className="hidden sm:inline">طلب جديد</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Card */}
          <Card className="shadow-lg glass-effect">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                  <Package className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <Badge variant={statusInfo.variant} className="text-lg px-4 py-2">
                    {statusInfo.label}
                  </Badge>
                  <p className="text-muted-foreground mt-2">{statusInfo.description}</p>
                </div>
                <Button onClick={() => setIsChatOpen(true)} className="gap-2 gradient-accent relative" size="lg">
                  <MessageCircle className="w-5 h-5" />
                  تواصل معنا
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center bg-red-500">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card className="shadow-lg glass-effect">
            <CardHeader className="bg-primary/5">
              <CardTitle>تفاصيل الطلب</CardTitle>
              <CardDescription>معلومات كاملة عن طلب الشحن</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Request Info */}
              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
                <h3 className="font-semibold text-lg">معلومات الطلب</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">رقم الطلب</Label>
                    <p className="font-mono text-sm font-semibold">{request.request_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">تاريخ الطلب</Label>
                    <p className="text-sm">{formatDate(request.request_date)}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  معلومات العميل
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">الاسم</Label>
                    <p className="text-sm font-semibold">{request.customer_name}</p>
                  </div>
                  {request.customer_phone && (
                    <div>
                      <Label className="text-xs text-muted-foreground">رقم الهاتف</Label>
                      <p className="text-sm">{request.customer_phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent" />
                    موقع الاستلام
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">المدينة</Label>
                      <p className="text-sm font-semibold">{request.pickup_location}</p>
                    </div>
                    {request.pickup_address && (
                      <div>
                        <Label className="text-xs text-muted-foreground">العنوان</Label>
                        <p className="text-sm">{request.pickup_address}</p>
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
                      <p className="text-sm font-semibold">{request.delivery_location}</p>
                    </div>
                    {request.delivery_address && (
                      <div>
                        <Label className="text-xs text-muted-foreground">العنوان</Label>
                        <p className="text-sm">{request.delivery_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  تفاصيل الطرد
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {request.package_description && (
                    <div className="sm:col-span-3">
                      <Label className="text-xs text-muted-foreground">الوصف</Label>
                      <p className="text-sm">{request.package_description}</p>
                    </div>
                  )}
                  {request.estimated_weight && (
                    <div>
                      <Label className="text-xs text-muted-foreground">الوزن التقديري</Label>
                      <p className="text-sm font-semibold">{request.estimated_weight} كجم</p>
                    </div>
                  )}
                  {request.estimated_value && (
                    <div>
                      <Label className="text-xs text-muted-foreground">القيمة التقديرية</Label>
                      <p className="text-sm font-semibold">{request.estimated_value.toFixed(2)} د.أ</p>
                    </div>
                  )}
                </div>
              </div>

              {request.notes && (
                <div className="space-y-2 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <Label className="text-xs text-muted-foreground">ملاحظات</Label>
                  <p className="text-sm">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Chat Dialog */}
      <ChatDialog
        open={isChatOpen}
        onOpenChange={(open) => {
          setIsChatOpen(open)
          if (!open) {
            loadUnreadCount()
          }
        }}
        requestId={request.id}
        requestNumber={request.request_number}
        customerName={request.customer_name}
        isAdmin={false}
      />
    </div>
  )
}
