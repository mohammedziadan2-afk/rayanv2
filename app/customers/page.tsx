"use client"

import { useState } from "react"
import {
  Package,
  FileText,
  Search,
  ArrowRight,
  MessageCircle,
  Bell,
  MapPin,
  Phone,
  Mail,
  Globe,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase-client"
import { toast } from "sonner"
import { ChatDialog } from "@/components/chat-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from "next/image"

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

export default function CustomersPage() {
  const [isTrackDialogOpen, setIsTrackDialogOpen] = useState(false)
  const [requestNumber, setRequestNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [request, setRequest] = useState<ShippingRequest | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
  const [selectedPhone, setSelectedPhone] = useState<{ number: string; whatsapp: string } | null>(null)

  const supabase = createBrowserClient()

  const handlePhoneClick = (phoneNumber: string, whatsappLink: string) => {
    setSelectedPhone({ number: phoneNumber, whatsapp: whatsappLink })
    setIsPhoneDialogOpen(true)
  }

  const handleTrackRequest = async () => {
    if (!requestNumber.trim()) {
      toast.error("الرجاء إدخال رقم الطلب")
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("shipping_requests")
        .select("*")
        .eq("request_number", requestNumber.trim())
        .single()

      if (error) {
        toast.error("رقم الطلب غير موجود")
        setRequest(null)
        return
      }

      setRequest(data)
      const messages = JSON.parse(localStorage.getItem("shipping_messages") || "[]")
      const unreadMessages = messages.filter(
        (msg: any) => msg.request_id === data.id && msg.sender_type === "admin" && msg.read === false,
      )
      setUnreadCount(unreadMessages.length)

      if (unreadMessages.length > 0) {
        toast.success(`تم العثور على الطلب - لديك ${unreadMessages.length} رسالة جديدة!`, {
          duration: 5000,
        })
      } else {
        toast.success("تم العثور على الطلب")
      }
    } catch (error) {
      console.error("[v0] Error tracking request:", error)
      toast.error("حدث خطأ أثناء البحث عن الطلب")
      setRequest(null)
    } finally {
      setLoading(false)
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
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/" className="group">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden shadow-glow group-hover:scale-110 transition-transform duration-300">
                  <Image src="/images/logo.jpg" alt="شعار المؤسسة" fill className="object-cover" />
                </div>
              </Link>
              <div>
                <h1 className="text-base sm:text-xl md:text-2xl font-bold gradient-text">مؤسسة الريان واريان</h1>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">للخدمات اللوجستية في الشحن</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">
          <div className="text-center space-y-4 sm:space-y-6 mb-8 sm:mb-12">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-4 sm:mb-6">
              {/* Animated globe background */}
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-blue-500 blur-xl sm:blur-2xl opacity-30 animate-spin"
                style={{ animationDuration: "8s" }}
              ></div>
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-secondary to-accent blur-lg sm:blur-xl opacity-40 animate-pulse"
                style={{ animationDuration: "3s" }}
              ></div>

              {/* Logo with rotating border */}
              <div className="relative w-full h-full rounded-full overflow-hidden shadow-glow border-2 sm:border-4 border-primary/30 animate-pulse">
                <div
                  className="absolute inset-0 rounded-full border-2 sm:border-4 border-transparent border-t-primary border-r-secondary animate-spin"
                  style={{ animationDuration: "4s" }}
                ></div>
                <Image src="/images/logo.jpg" alt="شعار مؤسسة الريان واريان" fill className="object-cover" />
              </div>

              {/* Orbiting dots */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "6s" }}>
                <div className="absolute top-0 left-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full -translate-x-1/2 shadow-glow"></div>
              </div>
              <div
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: "8s", animationDirection: "reverse" }}
              >
                <div className="absolute bottom-0 left-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-secondary rounded-full -translate-x-1/2 shadow-glow"></div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold gradient-text animate-fade-in">
                مؤسسة الريان واريان
              </h2>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground font-semibold">
                للخدمات اللوجستية في الشحن
              </p>
            </div>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              نحن مؤسسة رائدة في مجال خدمات الشحن والنقل، نقدم حلول شحن متكاملة وموثوقة لجميع احتياجاتك
            </p>

            <div className="mt-4 sm:mt-6 space-1 sm:space-y-2">
              <p className="text-sm sm:text-base md:text-lg font-semibold text-muted-foreground">المدير العام</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold gradient-text">محمد زيدان</p>
            </div>
          </div>

          <Card className="glass-effect border-2 border-primary/20 shadow-glow">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl sm:text-3xl gradient-text">عن المؤسسة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
              <p className="text-lg text-center text-muted-foreground leading-relaxed">
                مؤسسة الريان واريان للخدمات اللوجستية في الشحن هي مؤسسة متخصصة في خدمات الشحن والنقل المحلي والدولي.
                نفخر بتقديم خدمات عالية الجودة مع الالتزام بالمواعيد والأمان في التعامل مع شحناتكم.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center p-6 rounded-xl glass-effect border border-primary/20 hover:shadow-glow transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                    <Package className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">شحن سريع</h3>
                  <p className="text-sm text-muted-foreground">توصيل سريع وآمن لجميع الشحنات</p>
                </div>

                <div className="text-center p-6 rounded-xl glass-effect border border-primary/20 hover:shadow-glow transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-secondary flex items-center justify-center shadow-glow">
                    <Globe className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">تغطية عالمية</h3>
                  <p className="text-sm text-muted-foreground">نغطي الأردن وفلسطين ودول الخليج والعالم</p>
                </div>

                <div className="text-center p-6 rounded-xl glass-effect border border-primary/20 hover:shadow-glow transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-accent flex items-center justify-center shadow-glow">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">دعم متواصل</h3>
                  <p className="text-sm text-muted-foreground">فريق دعم متاح على مدار الساعة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <Link href="/track" className="group">
              <Card className="glass-effect hover:shadow-glow transition-all duration-300 h-full border-2 hover:border-primary/50">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="mx-auto mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl gradient-primary shadow-glow w-fit group-hover:scale-110 transition-transform duration-300">
                    <Search className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl">تتبع الشحنات</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">تتبع شحنتك باستخدام رقم التتبع</CardDescription>
                </CardHeader>
                <CardContent className="text-center p-4 sm:p-6 pt-0">
                  <Button className="w-full gradient-primary shadow-glow group-hover:shadow-xl transition-all duration-300 text-sm sm:text-base">
                    تتبع الآن
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/request-shipping" className="group">
              <Card className="glass-effect hover:shadow-glow transition-all duration-300 h-full border-2 hover:border-primary/50">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="mx-auto mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl gradient-secondary shadow-glow w-fit group-hover:scale-110 transition-transform duration-300">
                    <Package className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl">طلب شحنة جديدة</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">أرسل طلب شحن جديد بسهولة</CardDescription>
                </CardHeader>
                <CardContent className="text-center p-4 sm:p-6 pt-0">
                  <Button className="w-full gradient-secondary shadow-glow group-hover:shadow-xl transition-all duration-300 text-sm sm:text-base">
                    طلب شحنة
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Card
              className="glass-effect hover:shadow-glow transition-all duration-300 h-full border-2 hover:border-primary/50 cursor-pointer group sm:col-span-2 md:col-span-1"
              onClick={() => setIsTrackDialogOpen(true)}
            >
              <CardHeader className="text-center p-4 sm:p-6">
                <div className="mx-auto mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-glow w-fit group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg md:text-xl">تتبع طلبات الشحن</CardTitle>
                <CardDescription className="text-xs sm:text-sm">تابع حالة طلبات الشحن الخاصة بك</CardDescription>
              </CardHeader>
              <CardContent className="text-center p-4 sm:p-6 pt-0">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-glow group-hover:shadow-xl transition-all duration-300 text-sm sm:text-base">
                  تتبع الطلب
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-effect border-2 border-primary/20 shadow-glow overflow-hidden">
            <CardHeader className="text-center relative p-4 sm:p-6">
              {/* Animated globe background */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 opacity-10">
                <div className="relative w-full h-full">
                  <div
                    className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping"
                    style={{ animationDuration: "3s" }}
                  ></div>
                  <div
                    className="absolute inset-0 rounded-full border-2 border-dashed border-primary/40 animate-spin"
                    style={{ animationDuration: "20s" }}
                  ></div>
                  <Globe className="absolute inset-0 m-auto w-32 h-32 text-primary animate-pulse" />
                </div>
              </div>

              <CardTitle className="text-xl sm:text-2xl md:text-3xl gradient-text flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                <Globe
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 animate-spin"
                  style={{ animationDuration: "10s" }}
                />
                مناطق التغطية
              </CardTitle>
              <CardDescription className="text-sm sm:text-base md:text-lg relative z-10">
                نغطي المناطق التالية بخدماتنا المتميزة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 sm:space-y-8 p-3 sm:p-4 md:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                  <h3 className="text-xl sm:text-2xl font-bold gradient-text flex items-center gap-2">
                    <MapPin className="w-6 h-6" />
                    التغطية الأساسية
                  </h3>
                  <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                </div>

                <div className="relative">
                  {/* Animated connecting arrows */}
                  <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block w-full h-full pointer-events-none">
                    <defs>
                      {/* Arrow marker for straight arrows */}
                      <marker
                        id="arrowhead-straight"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                        fill="currentColor"
                        className="text-primary"
                      >
                        <polygon points="0 0, 10 3, 0 6" />
                      </marker>

                      {/* Arrow marker for curved arrows */}
                      <marker
                        id="arrowhead-curved"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                        fill="currentColor"
                        className="text-secondary"
                      >
                        <polygon points="0 0, 10 3, 0 6" />
                      </marker>
                    </defs>

                    {/* Straight arrows from Jordan to Palestine (3 arrows) */}
                    <g className="animate-pulse">
                      <line
                        x1="45%"
                        y1="30%"
                        x2="55%"
                        y2="30%"
                        stroke="currentColor"
                        strokeWidth="3"
                        markerEnd="url(#arrowhead-straight)"
                        className="text-primary"
                        opacity="0.8"
                      >
                        <animate attributeName="x1" values="45%;48%;45%" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="x2" values="55%;58%;55%" dur="2s" repeatCount="indefinite" />
                      </line>
                    </g>

                    <g className="animate-pulse" style={{ animationDelay: "0.3s" }}>
                      <line
                        x1="45%"
                        y1="50%"
                        x2="55%"
                        y2="50%"
                        stroke="currentColor"
                        strokeWidth="3"
                        markerEnd="url(#arrowhead-straight)"
                        className="text-primary"
                        opacity="0.8"
                      >
                        <animate
                          attributeName="x1"
                          values="45%;48%;45%"
                          dur="2s"
                          repeatCount="indefinite"
                          begin="0.3s"
                        />
                        <animate
                          attributeName="x2"
                          values="55%;58%;55%"
                          dur="2s"
                          repeatCount="indefinite"
                          begin="0.3s"
                        />
                      </line>
                    </g>

                    <g className="animate-pulse" style={{ animationDelay: "0.6s" }}>
                      <line
                        x1="45%"
                        y1="70%"
                        x2="55%"
                        y2="70%"
                        stroke="currentColor"
                        strokeWidth="3"
                        markerEnd="url(#arrowhead-straight)"
                        className="text-primary"
                        opacity="0.8"
                      >
                        <animate
                          attributeName="x1"
                          values="45%;48%;45%"
                          dur="2s"
                          repeatCount="indefinite"
                          begin="0.6s"
                        />
                        <animate
                          attributeName="x2"
                          values="55%;58%;55%"
                          dur="2s"
                          repeatCount="indefinite"
                          begin="0.6s"
                        />
                      </line>
                    </g>

                    {/* Curved arrows from Palestine to Jordan (3 arrows) */}
                    <g className="animate-pulse" style={{ animationDelay: "0.2s" }}>
                      <path
                        d="M 55% 35% Q 50% 25% 45% 35%"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="none"
                        markerEnd="url(#arrowhead-curved)"
                        className="text-secondary"
                        opacity="0.7"
                      >
                        <animate
                          attributeName="d"
                          values="M 55% 35% Q 50% 25% 45% 35%; M 58% 35% Q 53% 25% 48% 35%; M 55% 35% Q 50% 25% 45% 35%"
                          dur="2.5s"
                          repeatCount="indefinite"
                          begin="0.2s"
                        />
                      </path>
                    </g>

                    <g className="animate-pulse" style={{ animationDelay: "0.5s" }}>
                      <path
                        d="M 55% 55% Q 50% 45% 45% 55%"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="none"
                        markerEnd="url(#arrowhead-curved)"
                        className="text-secondary"
                        opacity="0.7"
                      >
                        <animate
                          attributeName="d"
                          values="M 55% 55% Q 50% 45% 45% 55%; M 58% 55% Q 53% 45% 48% 55%; M 55% 55% Q 50% 45% 45% 55%"
                          dur="2.5s"
                          repeatCount="indefinite"
                          begin="0.5s"
                        />
                      </path>
                    </g>

                    <g className="animate-pulse" style={{ animationDelay: "0.8s" }}>
                      <path
                        d="M 55% 75% Q 50% 65% 45% 75%"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="none"
                        markerEnd="url(#arrowhead-curved)"
                        className="text-secondary"
                        opacity="0.7"
                      >
                        <animate
                          attributeName="d"
                          values="M 55% 75% Q 50% 65% 45% 75%; M 58% 75% Q 53% 65% 48% 75%; M 55% 75% Q 50% 65% 45% 75%"
                          dur="2.5s"
                          repeatCount="indefinite"
                          begin="0.8s"
                        />
                      </path>
                    </g>
                  </svg>

                  <div className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                      {/* Jordan Map */}
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-red-500/20 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                        <div className="relative p-4 sm:p-6 rounded-xl sm:rounded-2xl glass-effect border-2 border-primary/30 hover:border-primary/60 transition-all duration-300">
                          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                            </div>
                            <h4 className="text-lg sm:text-xl md:text-2xl font-bold">الأردن 🇯🇴</h4>
                          </div>

                          <div className="relative w-full h-48 sm:h-56 md:h-64 mb-3 sm:mb-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 p-3 sm:p-4 overflow-hidden">
                            <div className="relative w-full h-full flex items-center justify-center">
                              <Image
                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-10-04%20044022-ndE9r2Zmy866A7KoAlLYzaIt2qk60O.png"
                                alt="خريطة الأردن"
                                width={240}
                                height={300}
                                className="object-contain drop-shadow-2xl max-w-full max-h-full"
                              />
                            </div>

                            {/* Cities as animated dots - تحسين للموبايل */}
                            <div className="absolute inset-0">
                              {/* عمان - في الوسط */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">
                                <div className="relative">
                                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold whitespace-nowrap bg-background/80 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                    عمان
                                  </span>
                                </div>
                              </div>

                              {/* إربد - في الشمال */}
                              <div
                                className="absolute top-[15%] sm:top-[20%] left-[45%] animate-pulse"
                                style={{ animationDelay: "0.2s" }}
                              >
                                <div className="relative">
                                  <div className="w-2 sm:w-2.5 h-2 sm:w-2.5 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-xs font-semibold whitespace-nowrap bg-background/80 px-1 sm:px-1.5 py-0.5 rounded">
                                    إربد
                                  </span>
                                </div>
                              </div>

                              {/* الزرقاء - شرق عمان */}
                              <div
                                className="absolute top-[35%] sm:top-[45%] left-[60%] animate-pulse"
                                style={{ animationDelay: "0.4s" }}
                              >
                                <div className="relative">
                                  <div className="w-2 sm:w-2.5 h-2 sm:w-2.5 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-xs font-semibold whitespace-nowrap bg-background/80 px-1 sm:px-1.5 py-0.5 rounded">
                                    الزرقاء
                                  </span>
                                </div>
                              </div>

                              {/* العقبة - في الجنوب */}
                              <div
                                className="absolute bottom-[5%] sm:bottom-[10%] left-[48%] animate-pulse"
                                style={{ animationDelay: "0.6s" }}
                              >
                                <div className="relative">
                                  <div className="w-2 sm:w-2.5 h-2 sm:w-2.5 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-xs font-semibold whitespace-nowrap bg-background/80 px-1 sm:px-1.5 py-0.5 rounded">
                                    العقبة
                                  </span>
                                </div>
                              </div>

                              {/* السلط - غرب عمان */}
                              <div
                                className="absolute top-[45%] sm:top-[48%] left-[38%] animate-pulse"
                                style={{ animationDelay: "0.8s" }}
                              >
                                <div className="relative">
                                  <div className="w-1.5 sm:w-2 h-1.5 sm:w-2 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-semibold whitespace-nowrap bg-background/80 px-0.5 sm:px-1 py-0.5 rounded">
                                    السلط
                                  </span>
                                </div>
                              </div>

                              {/* مادبا - جنوب غرب عمان */}
                              <div
                                className="absolute top-[50%] sm:top-[55%] left-[45%] animate-pulse"
                                style={{ animationDelay: "1s" }}
                              >
                                <div className="relative">
                                  <div className="w-1.5 sm:w-2 h-1.5 sm:w-2 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-semibold whitespace-nowrap bg-background/80 px-0.5 sm:px-1 py-0.5 rounded">
                                    مادبا
                                  </span>
                                </div>
                              </div>

                              {/* الكرك - في الوسط الجنوبي */}
                              <div
                                className="absolute top-[60%] sm:top-[65%] left-[50%] animate-pulse"
                                style={{ animationDelay: "1.2s" }}
                              >
                                <div className="relative">
                                  <div className="w-1.5 sm:w-2 h-1.5 sm:w-2 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-semibold whitespace-nowrap bg-background/80 px-0.5 sm:px-1 py-0.5 rounded">
                                    الكرك
                                  </span>
                                </div>
                              </div>

                              {/* معان - جنوب */}
                              <div
                                className="absolute bottom-[20%] sm:bottom-[25%] left-[52%] animate-pulse"
                                style={{ animationDelay: "1.4s" }}
                              >
                                <div className="relative">
                                  <div className="w-1.5 sm:w-2 h-1.5 sm:w-2 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-semibold whitespace-nowrap bg-background/80 px-0.5 sm:px-1 py-0.5 rounded">
                                    معان
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-center text-xs sm:text-sm text-muted-foreground font-semibold">
                            تغطية شاملة لجميع محافظات المملكة الأردنية الهاشمية
                          </p>
                        </div>
                      </div>

                      {/* Palestine Map - نفس التحسينات */}
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-red-500/20 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                        <div className="relative p-4 sm:p-6 rounded-xl sm:rounded-2xl glass-effect border-2 border-primary/30 hover:border-primary/60 transition-all duration-300">
                          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                            </div>
                            <h4 className="text-lg sm:text-xl md:text-2xl font-bold">فلسطين 🇵🇸</h4>
                          </div>

                          <div className="relative w-full h-48 sm:h-56 md:h-64 mb-3 sm:mb-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 p-3 sm:p-4 overflow-hidden">
                            <div className="relative w-full h-full flex items-center justify-center">
                              <Image
                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-10-04%20044953-xw0I1GP0ejAp8cRqdWYar5ui0wMd6r.png"
                                alt="خريطة فلسطين"
                                width={200}
                                height={300}
                                className="object-contain drop-shadow-2xl max-w-full max-h-full"
                              />
                            </div>

                            {/* Cities as animated dots - تحسين للموبايل */}
                            <div className="absolute inset-0">
                              {/* القدس - في الوسط */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">
                                <div className="relative">
                                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold whitespace-nowrap bg-background/80 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                    القدس
                                  </span>
                                </div>
                              </div>

                              {/*رام الله - شمال القدس */}
                              <div
                                className="absolute top-[35%] sm:top-[40%] left-1/2 -translate-x-1/2 animate-pulse"
                                style={{ animationDelay: "0.2s" }}
                              >
                                <div className="relative">
                                  <div className="w-2 sm:w-2.5 h-2 sm:w-2.5 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-xs font-semibold whitespace-nowrap bg-background/80 px-1 sm:px-1.5 py-0.5 rounded">
                                    رام الله
                                  </span>
                                </div>
                              </div>

                              {/* نابلس - في الشمال */}
                              <div
                                className="absolute top-[20%] sm:top-[25%] left-1/2 -translate-x-1/2 animate-pulse"
                                style={{ animationDelay: "0.4s" }}
                              >
                                <div className="relative">
                                  <div className="w-2 sm:w-2.5 h-2 sm:w-2.5 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-xs font-semibold whitespace-nowrap bg-background/80 px-1 sm:px-1.5 py-0.5 rounded">
                                    نابلس
                                  </span>
                                </div>
                              </div>

                              {/* الخليل - جنوب القدس */}
                              <div
                                className="absolute top-[55%] sm:top-[60%] left-1/2 -translate-x-1/2 animate-pulse"
                                style={{ animationDelay: "0.6s" }}
                              >
                                <div className="relative">
                                  <div className="w-2 sm:w-2.5 h-2 sm:w-2.5 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-xs font-semibold whitespace-nowrap bg-background/80 px-1 sm:px-1.5 py-0.5 rounded">
                                    الخليل
                                  </span>
                                </div>
                              </div>

                              {/* غزة - في الجنوب */}
                              <div
                                className="absolute bottom-[10%] sm:bottom-[15%] left-[45%] animate-pulse"
                                style={{ animationDelay: "0.8s" }}
                              >
                                <div className="relative">
                                  <div className="w-2 sm:w-2.5 h-2 sm:w-2.5 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-xs font-semibold whitespace-nowrap bg-background/80 px-1 sm:px-1.5 py-0.5 rounded">
                                    غزة
                                  </span>
                                </div>
                              </div>

                              {/* بيت لحم - جنوب القدس */}
                              <div
                                className="absolute top-[48%] sm:top-[53%] left-[48%] animate-pulse"
                                style={{ animationDelay: "1s" }}
                              >
                                <div className="relative">
                                  <div className="w-1.5 sm:w-2 h-1.5 sm:w-2 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-semibold whitespace-nowrap bg-background/80 px-0.5 sm:px-1 py-0.5 rounded">
                                    بيت لحم
                                  </span>
                                </div>
                              </div>

                              {/* جنين - أقصى الشمال */}
                              <div
                                className="absolute top-[10%] sm:top-[15%] left-1/2 -translate-x-1/2 animate-pulse"
                                style={{ animationDelay: "1.2s" }}
                              >
                                <div className="relative">
                                  <div className="w-1.5 sm:w-2 h-1.5 sm:w-2 bg-red-500 rounded-full shadow-glow">
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-semibold whitespace-nowrap bg-background/80 px-0.5 sm:px-1 py-0.5 rounded">
                                    جنين
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-center text-xs sm:text-sm text-muted-foreground font-semibold">
                            خدمات شحن موثوقة لجميع المدن الفلسطينية
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile animated arrows */}
                  <div className="flex md:hidden justify-center my-4">
                    <div className="flex flex-col items-center gap-1">
                      <ArrowRight
                        className="w-8 h-8 text-primary rotate-90 animate-bounce"
                        style={{ animationDuration: "2s" }}
                      />
                      <ArrowRight
                        className="w-8 h-8 text-primary rotate-90 animate-bounce"
                        style={{ animationDuration: "2s", animationDelay: "0.2s" }}
                      />
                      <ArrowRight
                        className="w-8 h-8 text-primary rotate-90 animate-bounce"
                        style={{ animationDuration: "2s", animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gulf Countries */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-secondary to-transparent"></div>
                  <h3 className="text-xl sm:text-2xl font-bold gradient-text flex items-center gap-2">
                    <Globe className="w-6 h-6 animate-pulse" />
                    دول الخليج
                  </h3>
                  <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-secondary to-transparent"></div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  {[
                    { name: "السعودية", flag: "🇸🇦" },
                    { name: "الإمارات", flag: "🇦🇪" },
                    { name: "الكويت", flag: "🇰🇼" },
                    { name: "قطر", flag: "🇶🇦" },
                    { name: "البحرين", flag: "🇧🇭" },
                    { name: "عمان", flag: "🇴🇲" },
                  ].map((country, index) => (
                    <div key={country.name} className="relative group" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                      <div className="relative p-4 rounded-xl glass-effect border border-secondary/30 hover:border-secondary/60 text-center hover:scale-105 transition-all duration-300">
                        <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{country.flag}</div>
                        <p className="font-semibold text-xs sm:text-sm">{country.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Worldwide Coverage */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                    <Globe className="w-6 h-6 text-amber-500 animate-spin" style={{ animationDuration: "8s" }} />
                    باقي دول العالم
                  </h3>
                  <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
                </div>

                <div className="relative p-6 sm:p-8 rounded-2xl glass-effect border-2 border-accent/30 overflow-hidden group">
                  {/* Animated world map background */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse"></div>
                  </div>

                  {/* Orbiting elements */}
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: "30s" }}>
                    <MapPin className="absolute top-4 left-1/4 w-4 h-4 text-amber-500 opacity-50" />
                    <MapPin className="absolute bottom-4 right-1/4 w-4 h-4 text-orange-500 opacity-50" />
                  </div>

                  <div className="relative text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="relative w-24 h-24">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 blur-xl opacity-50 animate-pulse"></div>
                        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-glow">
                          <Globe className="w-12 h-12 text-white animate-spin" style={{ animationDuration: "10s" }} />
                        </div>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold">نصل إلى جميع أنحاء العالم</h4>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                      نقدم خدمات الشحن الدولي إلى جميع القارات والدول، مع شبكة واسعة من الشركاء العالميين لضمان وصول
                      شحناتك بأمان وسرعة
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 pt-4">
                      {["أوروبا", "آسيا", "أفريقيا", "أمريكا الشمالية", "أمريكا الجنوبية", "أستراليا"].map(
                        (continent) => (
                          <Badge
                            key={continent}
                            variant="outline"
                            className="text-xs sm:text-sm px-2 sm:px-3 py-1 border-amber-500/50 hover:bg-amber-500/10 transition-colors"
                          >
                            {continent}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-2 border-primary/20 shadow-glow">
            <CardHeader className="text-center p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl gradient-text">تواصل معنا</CardTitle>
              <CardDescription className="text-sm sm:text-base md:text-lg">نحن هنا لخدمتك في أي وقت</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg glass-effect border border-primary/20 hover:shadow-glow transition-all duration-300">
                  <div className="p-2 sm:p-3 rounded-full gradient-primary shadow-glow">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
                      الهاتف
                      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                      <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </p>
                    <div className="space-y-1 sm:space-y-2">
                      <button
                        onClick={() => handlePhoneClick("+962791083443", "https://wa.me/message/NBC72SUIIZ5PH1")}
                        className="font-bold text-xs sm:text-sm hover:text-primary transition-colors flex items-center gap-1 sm:gap-2 justify-end w-full cursor-pointer"
                        dir="ltr"
                      >
                        <span>+962 79 108 3443</span>
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      </button>
                      <button
                        onClick={() => handlePhoneClick("+972599344783", "https://wa.me/message/NBC72SUIIZ5PH1")}
                        className="font-bold text-xs sm:text-sm hover:text-primary transition-colors flex items-center gap-1 sm:gap-2 justify-end w-full cursor-pointer"
                        dir="ltr"
                      >
                        <span>+972 59 934 4783</span>
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg glass-effect border border-primary/20 hover:shadow-glow transition-all duration-300">
                  <div className="p-2 sm:p-3 rounded-full gradient-secondary shadow-glow">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <a
                      href="mailto:mz.zm@hotmail.com"
                      className="font-bold text-sm sm:text-base hover:text-primary transition-colors break-all"
                    >
                      mz.zm@hotmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg glass-effect border border-primary/20 hover:shadow-glow transition-all duration-300">
                  <div className="p-2 sm:p-3 rounded-full gradient-accent shadow-glow">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">العنوان</p>
                    <p className="font-bold text-sm sm:text-base">عمان، الأردن</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      الياسمين - بالقرب من حديقة الشورى
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg glass-effect border border-primary/20 hover:shadow-glow transition-all duration-300">
                  <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-glow">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">تابعنا وتواصل معنا على فيسبوك</p>
                    <a
                      href="https://www.facebook.com/share/g/1EFavPxvik/?mibextid=wwXIfr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-sm sm:text-base hover:text-blue-600 transition-colors"
                    >
                      صفحتنا
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-2 border-primary/20">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-center text-xl sm:text-2xl">كيف تستخدم البوابة؟</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1 sm:p-2 rounded-lg gradient-primary text-primary-foreground font-bold min-w-[1.5rem] sm:min-w-[2rem] text-center text-sm sm:text-base">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-sm sm:text-base">تتبع الشحنات</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    أدخل رقم التتبع الخاص بشحنتك لمعرفة موقعها وحالتها الحالية
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 sm:p-2 rounded-lg gradient-secondary text-primary-foreground font-bold min-w-[1.5rem] sm:min-w-[2rem] text-center text-sm sm:text-base">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-sm sm:text-base">طلب شحنة جديدة</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    املأ نموذج طلب الشحن وسنتواصل معك لتأكيد التفاصيل والسعر
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold min-w-[1.5rem] sm:min-w-[2rem] text-center text-sm sm:text-base">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-sm sm:text-base">تتبع طلبات الشحن</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    أدخل رقم طلب الشحن لمتابعة حالته والتواصل معنا عبر الدردشة
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isTrackDialogOpen} onOpenChange={setIsTrackDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">تتبع طلب الشحن</DialogTitle>
            <DialogDescription>أدخل رقم طلب الشحن لمعرفة حالته والتواصل معنا</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {!request && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="requestNumber">رقم طلب الشحن</Label>
                  <div className="flex gap-2">
                    <Input
                      id="requestNumber"
                      placeholder="مثال: REQ-001"
                      value={requestNumber}
                      onChange={(e) => setRequestNumber(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleTrackRequest()}
                      className="flex-1"
                    />
                    <Button onClick={handleTrackRequest} disabled={loading} className="gradient-primary">
                      {loading ? "جاري البحث..." : "بحث"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {request && (
              <div className="space-y-4">
                {unreadCount > 0 && (
                  <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                    <Bell className="h-5 w-5 text-amber-600 animate-pulse" />
                    <AlertTitle className="text-amber-900 dark:text-amber-100 font-bold">لديك رسائل جديدة!</AlertTitle>
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      لديك {unreadCount} {unreadCount === 1 ? "رسالة جديدة" : "رسائل جديدة"} من قسم متابعة طلبات الشحن.
                      اضغط على "تواصل معنا" لقراءة الرسائل.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-center space-y-3 p-4 rounded-lg bg-primary/5">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <Badge variant={getStatusInfo(request.status).variant} className="text-base px-3 py-1">
                      {getStatusInfo(request.status).label}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">{getStatusInfo(request.status).description}</p>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
                  <h3 className="font-semibold">معلومات الطلب</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">رقم الطلب</Label>
                      <p className="font-mono font-semibold">{request.request_number}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">تاريخ الطلب</Label>
                      <p>{formatDate(request.request_date)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">من</Label>
                      <p className="font-semibold">{request.pickup_location}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">إلى</Label>
                      <p className="font-semibold">{request.delivery_location}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsChatOpen(true)}
                    className="flex-1 gradient-accent gap-2 relative"
                    size="lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    تواصل معنا
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setRequest(null)
                      setRequestNumber("")
                      setUnreadCount(0)
                    }}
                    variant="outline"
                    size="lg"
                  >
                    بحث جديد
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">اختر طريقة الاتصال</DialogTitle>
            <DialogDescription className="text-center" dir="ltr">
              {selectedPhone?.number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Button
              onClick={() => {
                window.open(selectedPhone?.whatsapp, "_blank")
                setIsPhoneDialogOpen(false)
              }}
              className="w-full h-16 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-glow"
            >
              <svg className="w-6 h-6 ml-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              فتح واتساب
            </Button>

            <Button
              onClick={() => {
                window.location.href = `tel:${selectedPhone?.number}`
                setIsPhoneDialogOpen(false)
              }}
              className="w-full h-16 text-lg gradient-primary shadow-glow"
            >
              <Phone className="w-6 h-6 ml-2" />
              إجراء مكالمة هاتفية
            </Button>

            <Button onClick={() => setIsPhoneDialogOpen(false)} variant="outline" className="w-full">
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {request && (
        <ChatDialog
          open={isChatOpen}
          onOpenChange={setIsChatOpen}
          requestId={request.id}
          requestNumber={request.request_number}
          customerName={request.customer_name}
          isAdmin={false}
        />
      )}
    </div>
  )
}
