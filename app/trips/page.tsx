"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Truck,
  Package,
  Calendar,
  DollarSign,
  Users,
  Briefcase,
  Cigarette,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Edit,
  Printer,
  Plus,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Trip } from "@/components/add-trip-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set())
  const [tripToDelete, setTripToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadTrips()

    const handleUpdate = () => loadTrips()
    window.addEventListener("tripsUpdated", handleUpdate)

    return () => window.removeEventListener("tripsUpdated", handleUpdate)
  }, [])

  const loadTrips = () => {
    const stored = localStorage.getItem("trips")
    if (stored) {
      setTrips(JSON.parse(stored))
    }
  }

  const toggleTripDetails = (tripId: string) => {
    setExpandedTrips((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(tripId)) {
        newSet.delete(tripId)
      } else {
        newSet.add(tripId)
      }
      return newSet
    })
  }

  const handlePrintTrip = (trip: Trip) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const totalRevenue = getTotalRevenue(trip)
    const totalCosts = getTotalCosts(trip)
    const netProfit = getNetProfit(trip)

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تفاصيل الرحلة - ${new Date(trip.date).toLocaleDateString("en-GB")}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            direction: rtl;
          }
          h1, h2, h3 { color: #333; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: right;
          }
          th {
            background-color: #f4f4f4;
            font-weight: bold;
          }
          .summary {
            background-color: #f9f9f9;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .total {
            font-size: 1.2em;
            font-weight: bold;
            margin-top: 10px;
          }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>مؤسسة الريان واريان للشحن</h1>
        <h2>تفاصيل رحلة ${new Date(trip.date).toLocaleDateString("en-GB")}</h2>
        
        <div class="summary">
          <p><strong>عدد الأشخاص:</strong> ${trip.numberOfPeople}</p>
          <p><strong>عدد الشنط:</strong> ${trip.numberOfBags}</p>
        </div>

        <h3>الشحنات (${trip.shipments.length})</h3>
        <table>
          <thead>
            <tr>
              <th>رقم التتبع</th>
              <th>المرسل</th>
              <th>المستلم</th>
              <th>المبلغ</th>
              <th>تكلفة التوصيل</th>
              <th>مكان الدفع</th>
            </tr>
          </thead>
          <tbody>
            ${trip.shipments
              .map(
                (s) => `
              <tr>
                <td>${s.trackingNumber}</td>
                <td>${s.senderName}</td>
                <td>${s.recipientName}</td>
                <td>${s.amount.toFixed(2)} د.أ</td>
                <td>${s.deliveryCost.toFixed(2)} د.أ</td>
                <td>${s.paymentLocation === "at-sender" ? "عند المرسل" : "عند المستلم"}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <h3>التكاليف الإضافية</h3>
        <table>
          <tbody>
            ${trip.additionalCosts.bridgeDelivery > 0 ? `<tr><td>توصيل للجسر</td><td>${trip.additionalCosts.bridgeDelivery.toFixed(2)} د.أ</td></tr>` : ""}
            ${trip.additionalCosts.tickets > 0 ? `<tr><td>التكتات</td><td>${trip.additionalCosts.tickets.toFixed(2)} د.أ</td></tr>` : ""}
            ${trip.additionalCosts.porterFees > 0 ? `<tr><td>أجور العتالة</td><td>${trip.additionalCosts.porterFees.toFixed(2)} د.أ</td></tr>` : ""}
            ${trip.additionalCosts.employeeFees > 0 ? `<tr><td>أجور الموظفين</td><td>${trip.additionalCosts.employeeFees.toFixed(2)} د.أ</td></tr>` : ""}
            ${trip.additionalCosts.permitFees > 0 ? `<tr><td>أجور التصريح</td><td>${trip.additionalCosts.permitFees.toFixed(2)} د.أ</td></tr>` : ""}
            ${trip.additionalCosts.accommodationExpenses > 0 ? `<tr><td>مصاريف مبيت</td><td>${trip.additionalCosts.accommodationExpenses.toFixed(2)} د.أ</td></tr>` : ""}
            ${trip.additionalCosts.other > 0 ? `<tr><td>أخرى</td><td>${trip.additionalCosts.other.toFixed(2)} د.أ</td></tr>` : ""}
          </tbody>
        </table>

        ${
          trip.tobaccoRevenue > 0
            ? `
          <h3>الإيرادات الإضافية</h3>
          <p><strong>إيرادات التبغ:</strong> ${trip.tobaccoRevenue.toFixed(2)} د.أ</p>
        `
            : ""
        }

        ${
          trip.otherRevenue > 0
            ? `
          <p><strong>إيرادات أخرى:</strong> ${trip.otherRevenue.toFixed(2)} د.أ</p>
        `
            : ""
        }

        <button onclick="window.print()" style="padding: 10px 20px; margin-top: 20px; cursor: pointer;">طباعة</button>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  const getTotalRevenue = (trip: Trip) => {
    const shipmentsRevenue = trip.shipments.reduce((sum, s) => sum + s.amount, 0)
    const tobaccoRevenue = trip.tobaccoRevenue || 0
    const otherRevenue = trip.otherRevenue || 0
    return shipmentsRevenue + tobaccoRevenue + otherRevenue
  }

  const getTotalCosts = (trip: Trip) => {
    const deliveryCosts = trip.shipments.reduce((sum, s) => sum + s.deliveryCost, 0)
    const additionalCosts = Object.values(trip.additionalCosts).reduce((sum, cost) => sum + cost, 0)
    return deliveryCosts + additionalCosts
  }

  const getNetProfit = (trip: Trip) => {
    return getTotalRevenue(trip) - getTotalCosts(trip)
  }

  const handleDeleteTrip = (tripId: string) => {
    const tripToMove = trips.find((trip) => trip.id === tripId)
    if (!tripToMove) return

    // إزالة الرحلة من القائمة الرئيسية
    const updatedTrips = trips.filter((trip) => trip.id !== tripId)
    localStorage.setItem("trips", JSON.stringify(updatedTrips))

    // إضافة الرحلة إلى سلة المحذوفات مع تاريخ الحذف
    const deletedTrips = JSON.parse(localStorage.getItem("deletedTrips") || "[]")
    const tripWithDeleteDate = {
      ...tripToMove,
      deletedAt: new Date().toISOString(),
    }
    deletedTrips.push(tripWithDeleteDate)
    localStorage.setItem("deletedTrips", JSON.stringify(deletedTrips))

    setTrips(updatedTrips)
    setTripToDelete(null)

    toast({
      title: "تم النقل إلى سلة المحذوفات",
      description: "تم نقل الرحلة إلى سلة المحذوفات. يمكنك استرجاعها خلال شهر.",
    })

    window.dispatchEvent(new Event("tripsUpdated"))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden shadow-glow ring-2 ring-primary/20 flex-shrink-0">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-1 sm:p-2" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent leading-tight">
                  مؤسسة الريان واريان للشحن
                </h1>
                <p className="text-[10px] sm:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1 hidden sm:block">
                  رحلات الشحنات والتوصيل
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">العودة للرئيسية</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10 pb-24">
        <div className="space-y-4 sm:space-y-8">
          <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl gradient-primary shadow-glow">
                <Truck className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">رحلات الشحنات</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">إدارة وتتبع رحلات التوصيل</p>
              </div>
            </div>
            <Link href="/trips/new">
              <Button size="lg" className="gap-2 shadow-glow">
                <Plus className="w-5 h-5" />
                رحلة جديدة
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-4">
            <Card className="glass-effect">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  عدد الرحلات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{trips.length}</p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  إجمالي الشحنات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {trips.reduce((sum, trip) => sum + trip.shipments.length, 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  إجمالي الإيرادات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-accent">
                  {trips.reduce((sum, trip) => sum + getTotalRevenue(trip), 0).toFixed(2)} د.أ
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  صافي الربح
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {trips.reduce((sum, trip) => sum + getNetProfit(trip), 0).toFixed(2)} د.أ
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-bold text-foreground">جميع الرحلات</h3>

            {trips.length === 0 ? (
              <Card className="glass-effect">
                <CardContent className="py-12 text-center">
                  <Truck className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">لا توجد رحلات مسجلة حالياً</p>
                  <p className="text-sm text-muted-foreground mt-2">ابدأ بإضافة رحلة جديدة</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {trips.map((trip) => {
                  const isExpanded = expandedTrips.has(trip.id)

                  return (
                    <Card key={trip.id} className="glass-effect hover:shadow-glow transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-3 rounded-xl bg-primary/10">
                              <Calendar className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-bold text-sm">
                                  رحلة {trip.serialNumber}
                                </span>
                              </div>
                              <CardTitle className="text-lg">
                                {new Date(trip.date).toLocaleDateString("en-GB")}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {trip.shipments.length} شحنة
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {trip.numberOfPeople} أشخاص
                                </span>
                                <span className="flex items-center gap-1">
                                  <Briefcase className="w-3 h-3" />
                                  {trip.numberOfBags} شنطة
                                </span>
                              </CardDescription>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handlePrintTrip(trip)} className="gap-2">
                              <Printer className="w-4 h-4" />
                              <span className="hidden sm:inline">طباعة</span>
                            </Button>
                            <Link href={`/trips/new?edit=${trip.id}`}>
                              <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                                <Edit className="w-4 h-4" />
                                <span className="hidden sm:inline">تعديل</span>
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setTripToDelete(trip.id)}
                              className="gap-2 bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline">حذف</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleTripDetails(trip.id)}
                              className="gap-2"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  <span className="hidden sm:inline">إخفاء</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  <span className="hidden sm:inline">عرض</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-sm mb-2">الشحنات:</h4>
                            <div className="space-y-2">
                              {trip.shipments.map((shipment) => (
                                <div
                                  key={shipment.shipmentId}
                                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{shipment.trackingNumber}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {shipment.senderName} ← {shipment.recipientName}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      مكان الدفع:{" "}
                                      {shipment.paymentLocation === "at-sender" ? "عند المرسل" : "عند المستلم"}
                                    </p>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-sm font-semibold text-accent">
                                      {shipment.amount.toFixed(2)} د.أ
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      توصيل: {shipment.deliveryCost.toFixed(2)} د.أ
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-sm mb-2">التكاليف الإضافية:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                              {trip.additionalCosts.bridgeDelivery > 0 && (
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span>توصيل للجسر:</span>
                                  <span className="font-semibold">
                                    {trip.additionalCosts.bridgeDelivery.toFixed(2)} د.أ
                                  </span>
                                </div>
                              )}
                              {trip.additionalCosts.tickets > 0 && (
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span>التكتات:</span>
                                  <span className="font-semibold">{trip.additionalCosts.tickets.toFixed(2)} د.أ</span>
                                </div>
                              )}
                              {trip.additionalCosts.porterFees > 0 && (
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span>أجور العتالة:</span>
                                  <span className="font-semibold">
                                    {trip.additionalCosts.porterFees.toFixed(2)} د.أ
                                  </span>
                                </div>
                              )}
                              {trip.additionalCosts.employeeFees > 0 && (
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span>أجور الموظفين:</span>
                                  <span className="font-semibold">
                                    {trip.additionalCosts.employeeFees.toFixed(2)} د.أ
                                  </span>
                                </div>
                              )}
                              {trip.additionalCosts.permitFees > 0 && (
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span>أجور التصريح:</span>
                                  <span className="font-semibold">
                                    {trip.additionalCosts.permitFees.toFixed(2)} د.أ
                                  </span>
                                </div>
                              )}
                              {trip.additionalCosts.accommodationExpenses > 0 && (
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span>مصاريف مبيت:</span>
                                  <span className="font-semibold">
                                    {trip.additionalCosts.accommodationExpenses.toFixed(2)} د.أ
                                  </span>
                                </div>
                              )}
                              {trip.additionalCosts.other > 0 && (
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span>أخرى:</span>
                                  <span className="font-semibold">{trip.additionalCosts.other.toFixed(2)} د.أ</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {trip.tobaccoRevenue > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">الإيرادات الإضافية:</h4>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center gap-2">
                                  <Cigarette className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium">إيرادات التبغ</span>
                                </div>
                                <span className="text-sm font-bold text-green-600">
                                  {trip.tobaccoRevenue.toFixed(2)} د.أ
                                </span>
                              </div>
                            </div>
                          )}

                          {trip.otherRevenue > 0 && (
                            <div>
                              {!trip.tobaccoRevenue && (
                                <h4 className="font-semibold text-sm mb-2">الإيرادات الإضافية:</h4>
                              )}
                              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center gap-2">
                                  <MoreHorizontal className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium">إيرادات أخرى</span>
                                </div>
                                <span className="text-sm font-bold text-green-600">
                                  {trip.otherRevenue.toFixed(2)} د.أ
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="border-t pt-3 space-y-2">
                            <div className="space-y-1 pb-2 border-b">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">الإيرادات:</p>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">إيرادات الشحنات:</span>
                                <span className="font-semibold">
                                  {trip.shipments.reduce((sum, s) => sum + s.amount, 0).toFixed(2)} د.أ
                                </span>
                              </div>
                              {trip.tobaccoRevenue > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">إيرادات التبغ:</span>
                                  <span className="font-semibold">{trip.tobaccoRevenue.toFixed(2)} د.أ</span>
                                </div>
                              )}
                              {trip.otherRevenue > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">إيرادات أخرى:</span>
                                  <span className="font-semibold">{trip.otherRevenue.toFixed(2)} د.أ</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-semibold pt-1">
                                <span>إجمالي الإيرادات:</span>
                                <span className="text-green-600">{getTotalRevenue(trip).toFixed(2)} د.أ</span>
                              </div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>إجمالي التكاليف:</span>
                              <span className="font-semibold text-red-600">{getTotalCosts(trip).toFixed(2)} د.أ</span>
                            </div>
                            <div className="flex justify-between text-base font-bold border-t pt-2">
                              <span>صافي الربح:</span>
                              <span className="text-green-600">{getNetProfit(trip).toFixed(2)} د.أ</span>
                            </div>
                          </div>
                        </CardContent>
                      )}

                      {!isExpanded && (
                        <CardContent>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">صافي الربح:</span>
                            <span className="text-lg font-bold text-green-600">
                              {getNetProfit(trip).toFixed(2)} د.أ
                            </span>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Link href="/trash">
          <Button
            size="lg"
            variant="outline"
            className="gap-2 shadow-2xl bg-background/95 backdrop-blur-sm border-2 hover:shadow-glow transition-all duration-300"
          >
            <Trash2 className="w-5 h-5" />
            سلة المحذوفات
          </Button>
        </Link>
      </div>

      <AlertDialog open={!!tripToDelete} onOpenChange={() => setTripToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>نقل إلى سلة المحذوفات</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من نقل هذه الرحلة إلى سلة المحذوفات؟ يمكنك استرجاعها خلال شهر من تاريخ الحذف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => tripToDelete && handleDeleteTrip(tripToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              نقل إلى السلة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
