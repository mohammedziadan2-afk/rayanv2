"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, DollarSign, Package, Calendar, Plane, Cigarette, MoreHorizontal, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Shipment {
  id: string
  shipmentName: string
  senderName: string
  receiverName: string
  receiverPhone: string
  quantity: number
  amount: number
  date: string
  status: string
  notes?: string
}

interface Trip {
  id: string
  date: string
  tobaccoRevenue: number
  otherRevenue: number
  createdAt: string
}

export default function RevenuesPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalShipments, setTotalShipments] = useState(0)
  const [totalTripsRevenue, setTotalTripsRevenue] = useState(0)

  useEffect(() => {
    loadShipments()
    loadTrips()
  }, [])

  const loadShipments = () => {
    const stored = localStorage.getItem("shipments")
    if (stored) {
      const parsedShipments: Shipment[] = JSON.parse(stored)
      setShipments(parsedShipments)

      const total = parsedShipments.reduce((sum, shipment) => sum + (shipment.amount || 0), 0)
      setTotalRevenue(total)
      setTotalShipments(parsedShipments.length)
    } else {
      setShipments([])
      setTotalRevenue(0)
      setTotalShipments(0)
    }
  }

  const loadTrips = () => {
    const stored = localStorage.getItem("trips")
    if (stored) {
      const parsedTrips: Trip[] = JSON.parse(stored)
      setTrips(parsedTrips)

      const tripsRevenue = parsedTrips.reduce((sum, trip) => {
        return sum + (trip.tobaccoRevenue || 0) + (trip.otherRevenue || 0)
      }, 0)
      setTotalTripsRevenue(tripsRevenue)
    } else {
      setTrips([])
      setTotalTripsRevenue(0)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const grandTotalRevenue = totalRevenue + totalTripsRevenue

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
          {/* العنوان */}
          <div className="flex items-center justify-between print:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-green-500/10">
                <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">تفاصيل الإيرادات</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  إجمالي الإيرادات من جميع الشحنات والرحلات المسجلة
                </p>
              </div>
            </div>
            <Button onClick={handlePrint} className="gap-2 print:hidden">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة</span>
            </Button>
          </div>

          {/* ملخص الإيرادات */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glass-effect border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                    <p className="text-2xl font-bold text-green-500">{grandTotalRevenue.toLocaleString()} د.ع</p>
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
                    <p className="text-2xl font-bold text-blue-500">{totalRevenue.toLocaleString()} د.ع</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <Plane className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إيرادات الرحلات</p>
                    <p className="text-2xl font-bold text-purple-500">{totalTripsRevenue.toLocaleString()} د.ع</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-orange-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-orange-500/10">
                    <TrendingUp className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">عدد الشحنات</p>
                    <p className="text-2xl font-bold text-orange-500">{totalShipments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* قائمة الشحنات */}
          {shipments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" />
                تفاصيل الشحنات ({shipments.length})
              </h3>
              <div className="space-y-2">
                {shipments.map((shipment) => (
                  <Card key={shipment.id} className="glass-effect hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <p className="font-semibold">{shipment.shipmentName}</p>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <p>المرسل: {shipment.senderName}</p>
                            <p>المستلم: {shipment.receiverName}</p>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(shipment.date).toLocaleDateString("en-GB")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-muted-foreground">القيمة</p>
                          <p className="text-xl font-bold text-green-500">{shipment.amount.toLocaleString()} د.ع</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* قائمة الرحلات */}
          {trips.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Plane className="w-5 h-5 text-purple-500" />
                الإيرادات الإضافية من الرحلات ({trips.length})
              </h3>
              <div className="space-y-2">
                {trips.map((trip) => {
                  const tripRevenue = (trip.tobaccoRevenue || 0) + (trip.otherRevenue || 0)
                  if (tripRevenue === 0) return null

                  return (
                    <Card key={trip.id} className="glass-effect hover:shadow-md transition-shadow border-purple-500/20">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Plane className="w-4 h-4 text-purple-500" />
                              <p className="font-semibold">رحلة {new Date(trip.date).toLocaleDateString("en-GB")}</p>
                            </div>
                            <div className="text-sm space-y-1">
                              {trip.tobaccoRevenue > 0 && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Cigarette className="w-3 h-3" />
                                  <span>إيرادات التبغ: {trip.tobaccoRevenue.toFixed(2)} د.أ</span>
                                </div>
                              )}
                              {trip.otherRevenue > 0 && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MoreHorizontal className="w-3 h-3" />
                                  <span>إيرادات أخرى: {trip.otherRevenue.toFixed(2)} د.أ</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-muted-foreground">المجموع</p>
                            <p className="text-xl font-bold text-purple-500">{tripRevenue.toFixed(2)} د.أ</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {shipments.length === 0 && trips.length === 0 && (
            <Card className="glass-effect">
              <CardContent className="pt-6 text-center py-12">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">لا توجد شحنات أو رحلات مسجلة</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
