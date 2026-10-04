"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Users,
  ArrowRight,
  Package,
  Plane,
  Truck,
  MapPin,
  Search,
  Phone,
  Mail,
  MessageCircle,
  Smartphone,
} from "lucide-react"
import { NewsFloatingBubbles } from "@/components/news-floating-bubbles"
import { ServicesSlider } from "@/components/services-slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
  const [selectedPhone, setSelectedPhone] = useState<{ number: string; whatsapp: string } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePhoneClick = (number: string, whatsapp: string) => {
    setSelectedPhone({ number, whatsapp })
    setIsPhoneDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-50 overflow-hidden relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-15">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] animate-spin-slow">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-sky-600"
                />
              </pattern>
            </defs>
            <circle cx="100" cy="100" r="90" fill="url(#grid)" opacity="0.3" />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-sky-600"
            />
            <ellipse
              cx="100"
              cy="100"
              rx="90"
              ry="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-cyan-600"
            />
            <ellipse
              cx="100"
              cy="100"
              rx="30"
              ry="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-emerald-600"
            />
            <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="1" className="text-sky-600" />
          </svg>
        </div>
      </div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 animate-plane-1">
          <Plane className="w-8 h-8 text-sky-500/40 rotate-45" />
        </div>

        <div className="absolute top-40 animate-plane-2">
          <Plane className="w-6 h-6 text-cyan-500/40 -rotate-12" />
        </div>

        <div className="absolute bottom-32 animate-truck-1">
          <Truck className="w-10 h-10 text-emerald-500/35" />
        </div>

        <div className="absolute bottom-48 animate-truck-2">
          <Truck className="w-7 h-7 text-teal-500/35" />
        </div>

        <div className="absolute top-1/4 left-1/4 animate-float-1">
          <Package className="w-6 h-6 text-cyan-500/30" />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-float-2">
          <Package className="w-5 h-5 text-emerald-500/30" />
        </div>
        <div className="absolute bottom-1/3 left-1/3 animate-float-3">
          <Package className="w-7 h-7 text-sky-500/25" />
        </div>
      </div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-400/25 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/25 rounded-full blur-3xl animate-pulse-slow animation-delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/20 rounded-full blur-3xl animate-pulse-slower" />
      </div>

      <main className="relative z-10">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div
            className={`flex justify-center mb-12 md:mb-16 transition-all duration-1000 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
            }`}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 rounded-3xl blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-500 animate-pulse-slow" />
              <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-sky-500/30 group-hover:ring-sky-500/50 transition-all duration-500 group-hover:scale-105 group-hover:rotate-3">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-3 md:p-4" priority sizes="(max-width: 768px) 128px, 192px" />
              </div>
            </div>
          </div>

          <div
            className={`text-center mb-16 md:mb-24 transition-all duration-1000 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 md:mb-8 leading-tight">
              <span className="block text-gray-900 animate-fade-in">مؤسسة الريان واريان</span>
              <span className="block bg-gradient-to-l from-sky-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent mt-2 animate-gradient">
                للشحن والتوصيل
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
              خدمة توصيل الطرود والشحنات من فلسطين إلى الأردن بأسعار منافسة وسرعة عالية
            </p>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mt-4 leading-relaxed">
              نوفر خدمات شحن موثوقة وآمنة لجميع المدن الأردنية مع تتبع مباشر للشحنات
            </p>

          </div>

          <div className="text-center py-1 mt-6 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto px-4">
            <Link href="/track-shipment" className="inline-block">
              <div className="group relative h-16 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 shadow-lg hover:shadow-xl hover:shadow-sky-500/40 transition-all duration-300 cursor-pointer hover:scale-105 flex items-center justify-center">
                <div className="flex items-center gap-2 justify-center">
                  <Search className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
                  <p className="text-sm font-bold text-white">
                    تتبع شحنتك
                  </p>
                </div>
              </div>
            </Link>
            
            <Link href="/subscriber-login" className="inline-block">
              <div className="group relative h-16 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 cursor-pointer hover:scale-105 flex items-center justify-center">
                <div className="flex items-center gap-2 justify-center">
                  <Users className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
                  <p className="text-sm font-bold text-white">
                    أصحاب الطلبات
                  </p>
                </div>
              </div>
            </Link>
            
            <Link href="/request-shipping" className="inline-block">
              <div className="group relative h-16 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 cursor-pointer hover:scale-105 flex items-center justify-center">
                <div className="flex items-center gap-2 justify-center">
                  <Package className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
                  <p className="text-sm font-bold text-white">
                    لنقل شحنة
                  </p>
                </div>
              </div>
            </Link>
            
            <div className="inline-block">
              <NewsFloatingBubbles />
            </div>
          </div>

          <div className="mb-12 md:mb-16">
            <ServicesSlider />
          </div>

          <div className="grid md:grid-cols-1 gap-6 md:gap-8 max-w-3xl mx-auto">
            <Link href="/customers">
              <div
                className={`group relative overflow-hidden rounded-3xl transition-all duration-1000 delay-300 hover:scale-105 ${
                  mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-600 via-cyan-500 to-teal-600 transition-all duration-500 group-hover:scale-110" />

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>

                <div className="relative p-8 md:p-12 lg:p-16 min-h-[400px] md:min-h-[500px] flex flex-col justify-between">
                  <div className="mb-8">
                    <div className="inline-flex p-4 md:p-6 rounded-2xl bg-white/20 backdrop-blur-sm shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 animate-bounce-slow">
                      <Users className="w-12 h-12 md:w-16 md:h-16 text-white" />
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                      بوابة العملاء
                    </h2>
                    <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                      تتبع شحناتك واطلب خدمات الشحن والتوصيل بسهولة
                    </p>

                    <div className="flex items-center gap-3 text-white font-semibold text-lg group-hover:gap-5 transition-all duration-300">
                      <span>الدخول إلى البوابة</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300 animate-pulse" />
                    </div>
                  </div>

                  <div className="absolute top-8 right-8 w-24 h-24 border-4 border-white/20 rounded-full group-hover:scale-150 group-hover:opacity-0 transition-all duration-500 animate-ping-slow" />
                  <div className="absolute bottom-8 left-8 w-32 h-32 border-4 border-white/10 rounded-full group-hover:scale-150 group-hover:opacity-0 transition-all duration-700 animate-ping-slower" />
                </div>
              </div>
            </Link>
          </div>

          <div className="max-w-5xl mx-auto mt-16">
            <Card className="glass-card border-primary/20 overflow-hidden">
              <CardHeader className="text-center p-4 sm:p-6 bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-emerald-500/10">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                  تواصل معنا
                </CardTitle>
                <CardDescription className="text-sm sm:text-base md:text-lg">نحن هنا لخدمتك في أي وقت</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-sky-200 hover:shadow-lg hover:border-sky-400 transition-all duration-300">
                    <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 shadow-lg">
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2">
                        الهاتف
                        <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                        <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500" />
                      </p>
                      <div className="space-y-1 sm:space-y-2">
                        <button
                          onClick={() => handlePhoneClick("+962791083443", "https://wa.me/message/NBC72SUIIZ5PH1")}
                          className="font-bold text-xs sm:text-sm hover:text-sky-600 transition-colors flex items-center gap-1 sm:gap-2 justify-end w-full cursor-pointer"
                          dir="ltr"
                        >
                          <span>+962 79 108 3443</span>
                          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500" />
                        </button>
                        <button
                          onClick={() => handlePhoneClick("+972599344783", "https://wa.me/message/NBC72SUIIZ5PH1")}
                          className="font-bold text-xs sm:text-sm hover:text-sky-600 transition-colors flex items-center gap-1 sm:gap-2 justify-end w-full cursor-pointer"
                          dir="ltr"
                        >
                          <span>+972 59 934 4783</span>
                          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-cyan-200 hover:shadow-lg hover:border-cyan-400 transition-all duration-300">
                    <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg">
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">البريد الإلكتروني</p>
                      <a
                        href="mailto:mz.zm@hotmail.com"
                        className="font-bold text-sm sm:text-base hover:text-cyan-600 transition-colors break-all"
                      >
                        mz.zm@hotmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-emerald-200 hover:shadow-lg hover:border-emerald-400 transition-all duration-300">
                    <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">العنوان</p>
                      <p className="font-bold text-sm sm:text-base">عمان، الأردن</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">الياسمين - بالقرب من حديقة الشورى</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-blue-200 hover:shadow-lg hover:border-blue-400 transition-all duration-300">
                    <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">تابعنا وتواصل معنا على فيسبوك</p>
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
          </div>

          {/* قسم خدماتنا */}
          <div className="max-w-5xl mx-auto mt-12">
            <Card className="glass-card border-primary/20 overflow-hidden">
              <CardHeader className="text-center p-4 sm:p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
                  <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                  خدماتنا
                </CardTitle>
                <CardDescription className="text-sm sm:text-base md:text-lg">نقدم مجموعة متكاملة من خدمات الشحن والتوصيل</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="group p-4 sm:p-6 rounded-xl bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-200 hover:shadow-lg hover:border-sky-400 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 shadow-lg group-hover:scale-110 transition-transform">
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-sky-800">شحن الطرود</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">نقل جميع أنواع الطرود والبضائع من فلسطين إلى الأردن بأمان تام</p>
                  </div>

                  <div className="group p-4 sm:p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 hover:shadow-lg hover:border-emerald-400 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg group-hover:scale-110 transition-transform">
                        <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-emerald-800">نقل الزيت</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">خدمة متخصصة لنقل زيت الزيتون بعناية فائقة مع ضمان الجودة</p>
                  </div>

                  <div className="group p-4 sm:p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 hover:shadow-lg hover:border-amber-400 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg group-hover:scale-110 transition-transform">
                        <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-amber-800">توصيل سريع</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">خدمة التوصيل السريع لجميع المدن الأردنية خلال أيام معدودة</p>
                  </div>

                  <div className="group p-4 sm:p-6 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 hover:shadow-lg hover:border-purple-400 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 shadow-lg group-hover:scale-110 transition-transform">
                        <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-purple-800">تتبع الشحنات</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">نظام تتبع متطور لمتابعة شحنتك لحظة بلحظة حتى وصولها</p>
                  </div>

                  <div className="group p-4 sm:p-6 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 hover:shadow-lg hover:border-rose-400 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-rose-800">خدمة التجار</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">باقات خاصة للتجار وأصحاب المتاجر مع أسعار تنافسية</p>
                  </div>

                  <div className="group p-4 sm:p-6 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 hover:shadow-lg hover:border-teal-400 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg group-hover:scale-110 transition-transform">
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-teal-800">تغليف آمن</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">تغليف احترافي للبضائع الحساسة لضمان وصولها بحالة ممتازة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* قسم لماذا نحن */}
          <div className="max-w-5xl mx-auto mt-12">
            <Card className="glass-card border-primary/20 overflow-hidden">
              <CardHeader className="text-center p-4 sm:p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                  لماذا تختار الريان واريان؟
                </CardTitle>
                <CardDescription className="text-sm sm:text-base md:text-lg">مميزات تجعلنا الخيار الأول لعملائنا</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-sky-200 hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-800 mb-2">أسعار منافسة</h4>
                      <p className="text-sm text-gray-600">نقدم أفضل الأسعار في السوق مع الحفاظ على جودة الخدمة العالية</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-emerald-200 hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-800 mb-2">سرعة التوصيل</h4>
                      <p className="text-sm text-gray-600">التزام تام بمواعيد التسليم المحددة مع إمكانية التوصيل السريع</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-amber-200 hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-800 mb-2">أمان الشحنات</h4>
                      <p className="text-sm text-gray-600">ضمان سلامة شحنتك من لحظة الاستلام حتى التسليم النهائي</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-purple-200 hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      4
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-800 mb-2">دعم فني متواصل</h4>
                      <p className="text-sm text-gray-600">فريق خدمة عملاء متاح للرد على استفساراتكم في أي وقت</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-rose-200 hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      5
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-800 mb-2">خبرة طويلة</h4>
                      <p className="text-sm text-gray-600">سنوات من الخبرة في مجال الشحن الدولي والتوصيل المحلي</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-teal-200 hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      6
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-800 mb-2">تغطية واسعة</h4>
                      <p className="text-sm text-gray-600">نصل إلى جميع المدن والمناطق في الأردن بدون استثناء</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 md:mt-24 text-center">
            <Link href="/login" className="cursor-default">
              <p className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                جميع الحقوق محفوظة © 2025 مؤسسة الريان واريان
              </p>
            </Link>
          </div>
        </div>
      </main>

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
              className="w-full h-16 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
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
              className="w-full h-16 text-lg bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-lg"
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
    </div>
  )
}
