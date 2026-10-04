"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Package,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Search,
  Truck,
  ArrowRight,
  Clock,
  Box,
  Navigation,
  Home,
  PackageCheck,
} from "lucide-react"
import { getShipmentTrackingInfo, type ShipmentTrackingInfo } from "@/app/actions/tracking"
import { TrackingNewsBanner } from "@/components/tracking-news-banner"
import Link from "next/link"

const stageIcons = [
  Box,           // Stage 1: تم الاستلام
  Navigation,    // Stage 2: في الطريق
  Truck,         // Stage 3: وصل المستودع
  Package,       // Stage 4: خرج للتوصيل
  PackageCheck,  // Stage 5: تم التسليم
]

export default function TrackShipmentPage() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [trackingInfo, setTrackingInfo] = useState<ShipmentTrackingInfo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleTrack = async () => {
    if (!trackingNumber.trim()) return

    setLoading(true)
    setNotFound(false)
    setTrackingInfo(null)

    try {
      const result = await getShipmentTrackingInfo(trackingNumber.trim())

      if (result.success && result.data) {
        setTrackingInfo(result.data)
        setNotFound(false)

        setTimeout(() => {
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }, 100)
      } else {
        setTrackingInfo(null)
        setNotFound(true)
      }
    } catch (error) {
      console.error("Error tracking shipment:", error)
      setTrackingInfo(null)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTrack()
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getCompletedCount = () => {
    if (!trackingInfo) return 0
    return trackingInfo.stages.filter(s => s.isCompleted).length
  }

  const getProgressPercentage = () => {
    if (!trackingInfo) return 0
    return (getCompletedCount() / trackingInfo.stages.length) * 100
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">العودة</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">مؤسسة الريان واريان</div>
                <div className="text-xs text-slate-500">للخدمات اللوجستية في الشحن</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Important news ticker (managed from the news admin page) */}
      <TrackingNewsBanner />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700 py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-6">
            <Package className="w-5 h-5 text-white" />
            <span className="text-white/90 text-sm font-medium">تتبع شحناتك بسهولة</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            تتبع شحنتك
          </h1>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            أدخل رقم التتبع لمعرفة موقع شحنتك ومراحل التوصيل
          </p>

          {/* Search Box */}
          <div className="bg-white rounded-2xl p-2 shadow-2xl max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="أدخل رقم التتبع..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-14 text-lg pr-12 text-right border-0 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
              <Button
                onClick={handleTrack}
                disabled={loading || !trackingNumber.trim()}
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-lg shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري البحث...</span>
                  </div>
                ) : (
                  "تتبع"
                )}
              </Button>
            </div>
          </div>

          {notFound && (
            <div className="mt-6 p-4 bg-red-500/20 backdrop-blur border border-red-400/30 rounded-xl text-white max-w-2xl mx-auto">
              <p className="font-medium">لم يتم العثور على الشحنة. تأكد من رقم التتبع وحاول مرة أخرى.</p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {trackingInfo && (
        <div ref={resultsRef} className="container mx-auto px-4 py-8 max-w-4xl -mt-8">
          {/* Progress Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mb-6">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">رقم التتبع</p>
                    <p className="font-bold text-slate-900 font-mono">{trackingInfo.trackingNumber}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm text-slate-500">الحالة</p>
                  <p className={`font-bold ${getCompletedCount() === 5 ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {getCompletedCount() === 5 ? 'تم التسليم' : 'قيد التوصيل'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500">{getCompletedCount()} من 5 مراحل</span>
                  <span className="text-xs font-medium text-blue-600">{Math.round(getProgressPercentage())}%</span>
                </div>
              </div>
            </div>

            {/* Horizontal Timeline - Desktop */}
            <div className="hidden md:block p-6 bg-slate-50">
              <div className="relative flex justify-between items-start">
                {/* Connecting Line */}
                <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-slate-200 rounded-full" />
                <div 
                  className="absolute top-6 right-[10%] h-1 bg-gradient-to-l from-emerald-500 to-blue-500 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${Math.max(0, ((getCompletedCount() - 1) / (trackingInfo.stages.length - 1)) * 80)}%`
                  }}
                />

                {trackingInfo.stages.map((stage, index) => {
                  const Icon = stageIcons[index] || Package
                  const isCompleted = stage.isCompleted
                  const isCurrent = isCompleted && !trackingInfo.stages[index + 1]?.isCompleted

                  return (
                    <div key={stage.stage} className="relative flex flex-col items-center z-10" style={{ width: '20%' }}>
                      {/* Circle */}
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
                        ${isCompleted 
                          ? isCurrent 
                            ? 'bg-gradient-to-br from-blue-500 to-emerald-500 shadow-lg shadow-blue-500/30 ring-4 ring-blue-100' 
                            : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md'
                          : 'bg-white border-2 border-slate-300'
                        }
                      `}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        ) : (
                          <Icon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      {/* Label */}
                      <div className="mt-3 text-center">
                        <p className={`text-sm font-bold ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                          {stage.stageName}
                        </p>
                        {stage.enteredAt && isCompleted && (
                          <div className="mt-1 space-y-0.5">
                            <p className="text-xs text-slate-500">{formatDate(stage.enteredAt)}</p>
                            <p className="text-xs text-slate-400">{formatTime(stage.enteredAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Vertical Timeline - Mobile */}
            <div className="md:hidden p-6">
              <div className="space-y-0">
                {trackingInfo.stages.map((stage, index) => {
                  const Icon = stageIcons[index] || Package
                  const isCompleted = stage.isCompleted
                  const isCurrent = isCompleted && !trackingInfo.stages[index + 1]?.isCompleted
                  const isLast = index === trackingInfo.stages.length - 1
                  const nextCompleted = trackingInfo.stages[index + 1]?.isCompleted

                  return (
                    <div key={stage.stage} className="flex gap-4">
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                          ${isCompleted 
                            ? isCurrent 
                              ? 'bg-gradient-to-br from-blue-500 to-emerald-500 shadow-lg ring-4 ring-blue-100' 
                              : 'bg-emerald-500'
                            : 'bg-white border-2 border-slate-300'
                          }
                        `}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : (
                            <Icon className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 flex-1 min-h-[40px] ${
                            isCompleted && nextCompleted 
                              ? 'bg-emerald-500' 
                              : 'bg-slate-200'
                          }`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                        <div className={`
                          p-4 rounded-xl transition-all
                          ${isCompleted 
                            ? isCurrent
                              ? 'bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-200'
                              : 'bg-emerald-50 border border-emerald-200'
                            : 'bg-slate-50 border border-slate-200'
                          }
                        `}>
                          <h3 className={`font-bold ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                            {stage.stageName}
                          </h3>
                          {stage.enteredAt && isCompleted && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(stage.enteredAt)} - {formatTime(stage.enteredAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Sender Card */}
            <div className="bg-white rounded-xl shadow-md border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900">المرسل</h3>
              </div>
              <p className="text-lg font-semibold text-slate-800">{trackingInfo.senderName}</p>
            </div>

            {/* Receiver Card */}
            <div className="bg-white rounded-xl shadow-md border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Home className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900">المستلم</h3>
              </div>
              <p className="text-lg font-semibold text-slate-800 mb-3">{trackingInfo.receiverName}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span dir="ltr">{trackingInfo.receiverPhone}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <span>{trackingInfo.receiverAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {trackingInfo.description && (
            <div className="mt-4 bg-white rounded-xl shadow-md border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-bold text-slate-900">وصف الشحنة</h3>
              </div>
              <p className="text-slate-700">{trackingInfo.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-10 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            {/* Logo and Name */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-xl">مؤسسة الريان واريان</h3>
                <p className="text-slate-400 text-sm">للخدمات اللوجستية في الشحن</p>
              </div>
            </div>
            
            {/* Contact Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 text-slate-300">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                <span dir="ltr">+962 79 108 3443</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-600" />
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>عمان - الياسمين خلف حديقة الشورى</span>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-6 pt-6 border-t border-slate-800 w-full">
              <p className="text-slate-500 text-sm">جميع الحقوق محفوظة 2026</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
