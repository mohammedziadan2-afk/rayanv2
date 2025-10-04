"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Package,
  Users,
  Briefcase,
  RotateCcw,
  X,
  AlertTriangle,
  Truck,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Trip } from "@/components/add-trip-dialog"
import type { Shipment } from "@/components/shipment-form"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TrashPage() {
  const [deletedTrips, setDeletedTrips] = useState<Trip[]>([])
  const [deletedShipments, setDeletedShipments] = useState<Shipment[]>([])
  const [tripToRestore, setTripToRestore] = useState<string | null>(null)
  const [tripToDeletePermanently, setTripToDeletePermanently] = useState<string | null>(null)
  const [shipmentToRestore, setShipmentToRestore] = useState<string | null>(null)
  const [shipmentToDeletePermanently, setShipmentToDeletePermanently] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadDeletedTrips()
    loadDeletedShipments()
  }, [])

  const loadDeletedTrips = () => {
    const stored = localStorage.getItem("deletedTrips")
    if (stored) {
      const trips: Trip[] = JSON.parse(stored)

      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      const validTrips = trips.filter((trip) => {
        if (!trip.deletedAt) return true
        const deletedDate = new Date(trip.deletedAt)
        return deletedDate > oneMonthAgo
      })

      if (validTrips.length !== trips.length) {
        localStorage.setItem("deletedTrips", JSON.stringify(validTrips))
        toast({
          title: "تنظيف تلقائي",
          description: `تم حذف ${trips.length - validTrips.length} رحلة تلقائياً (أقدم من شهر)`,
        })
      }

      setDeletedTrips(validTrips)
    }
  }

  const loadDeletedShipments = () => {
    const stored = localStorage.getItem("deletedShipments")
    if (stored) {
      const shipments: Shipment[] = JSON.parse(stored)

      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      const validShipments = shipments.filter((shipment) => {
        if (!shipment.deletedAt) return true
        const deletedDate = new Date(shipment.deletedAt)
        return deletedDate > oneMonthAgo
      })

      if (validShipments.length !== shipments.length) {
        localStorage.setItem("deletedShipments", JSON.stringify(validShipments))
        toast({
          title: "تنظيف تلقائي",
          description: `تم حذف ${shipments.length - validShipments.length} شحنة تلقائياً (أقدم من شهر)`,
        })
      }

      setDeletedShipments(validShipments)
    }
  }

  const handleRestoreTrip = (tripId: string) => {
    const tripToMove = deletedTrips.find((trip) => trip.id === tripId)
    if (!tripToMove) return

    const updatedDeletedTrips = deletedTrips.filter((trip) => trip.id !== tripId)
    localStorage.setItem("deletedTrips", JSON.stringify(updatedDeletedTrips))

    const trips = JSON.parse(localStorage.getItem("trips") || "[]")
    const { deletedAt, ...tripWithoutDeletedAt } = tripToMove
    trips.push(tripWithoutDeletedAt)
    localStorage.setItem("trips", JSON.stringify(trips))

    setDeletedTrips(updatedDeletedTrips)
    setTripToRestore(null)

    toast({
      title: "تم الاسترجاع",
      description: "تم استرجاع الرحلة بنجاح إلى صفحة إدارة الرحلات",
    })

    window.dispatchEvent(new Event("tripsUpdated"))
  }

  const handleDeleteTripPermanently = (tripId: string) => {
    const updatedDeletedTrips = deletedTrips.filter((trip) => trip.id !== tripId)
    localStorage.setItem("deletedTrips", JSON.stringify(updatedDeletedTrips))

    setDeletedTrips(updatedDeletedTrips)
    setTripToDeletePermanently(null)

    toast({
      title: "تم الحذف النهائي",
      description: "تم حذف الرحلة نهائياً ولا يمكن استرجاعها",
      variant: "destructive",
    })
  }

  const handleRestoreShipment = (shipmentId: string) => {
    const shipmentToMove = deletedShipments.find((shipment) => shipment.id === shipmentId)
    if (!shipmentToMove) return

    const updatedDeletedShipments = deletedShipments.filter((shipment) => shipment.id !== shipmentId)
    localStorage.setItem("deletedShipments", JSON.stringify(updatedDeletedShipments))

    const shipments = JSON.parse(localStorage.getItem("shipments") || "[]")
    const { deletedAt, ...shipmentWithoutDeletedAt } = shipmentToMove
    shipments.push(shipmentWithoutDeletedAt)
    localStorage.setItem("shipments", JSON.stringify(shipments))

    setDeletedShipments(updatedDeletedShipments)
    setShipmentToRestore(null)

    toast({
      title: "تم الاسترجاع",
      description: "تم استرجاع الشحنة بنجاح إلى صفحة إدارة الشحنات",
    })

    window.dispatchEvent(new Event("shipmentsUpdated"))
  }

  const handleDeleteShipmentPermanently = (shipmentId: string) => {
    const updatedDeletedShipments = deletedShipments.filter((shipment) => shipment.id !== shipmentId)
    localStorage.setItem("deletedShipments", JSON.stringify(updatedDeletedShipments))

    setDeletedShipments(updatedDeletedShipments)
    setShipmentToDeletePermanently(null)

    toast({
      title: "تم الحذف النهائي",
      description: "تم حذف الشحنة نهائياً ولا يمكن استرجاعها",
      variant: "destructive",
    })
  }

  const getDaysRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt)
    const expiryDate = new Date(deletedDate)
    expiryDate.setMonth(expiryDate.getMonth() + 1)

    const now = new Date()
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return daysRemaining
  }

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: "قيد الانتظار", color: "text-yellow-700" },
      processing: { label: "قيد المعالجة", color: "text-blue-700" },
      "in-transit": { label: "في الطريق", color: "text-purple-700" },
      "out-for-delivery": { label: "خارج للتوصيل", color: "text-indigo-700" },
      delivered: { label: "تم التوصيل", color: "text-green-700" },
      cancelled: { label: "ملغي", color: "text-red-700" },
      returned: { label: "مرتجع", color: "text-orange-700" },
    }

    return statusMap[status] || { label: status, color: "text-gray-700" }
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
                  سلة المحذوفات
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
                  <span className="hidden sm:inline">العودة</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="space-y-4 sm:space-y-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-red-500/10 border-2 border-red-500/20">
              <Trash2 className="w-5 h-5 sm:w-7 sm:h-7 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">سلة المحذوفات</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                الرحلات والشحنات المحذوفة - يتم الحذف التلقائي بعد شهر
              </p>
            </div>
          </div>

          {(deletedTrips.length > 0 || deletedShipments.length > 0) && (
            <Card className="glass-effect border-amber-500/30 bg-amber-500/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900 dark:text-amber-200">
                    <p className="font-semibold mb-1">تنبيه هام:</p>
                    <p>سيتم حذف الرحلات والشحنات تلقائياً بعد مرور شهر من تاريخ النقل إلى سلة المحذوفات.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="trips" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="trips" className="gap-2">
                <Truck className="w-4 h-4" />
                الرحلات ({deletedTrips.length})
              </TabsTrigger>
              <TabsTrigger value="shipments" className="gap-2">
                <Package className="w-4 h-4" />
                الشحنات ({deletedShipments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trips" className="space-y-4 mt-6">
              {deletedTrips.length === 0 ? (
                <Card className="glass-effect">
                  <CardContent className="py-12 text-center">
                    <Trash2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">لا توجد رحلات محذوفة</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:gap-6">
                  {deletedTrips.map((trip) => {
                    const daysRemaining = trip.deletedAt ? getDaysRemaining(trip.deletedAt) : 30

                    return (
                      <Card
                        key={trip.id}
                        className="glass-effect hover:shadow-glow transition-all duration-300 border-red-500/20"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-3 rounded-xl bg-red-500/10">
                                <Calendar className="w-6 h-6 text-red-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-600 font-bold text-sm">
                                    رحلة {trip.serialNumber}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      daysRemaining <= 7
                                        ? "bg-red-500/20 text-red-600"
                                        : "bg-amber-500/20 text-amber-600"
                                    }`}
                                  >
                                    {daysRemaining} يوم متبقي
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
                                {trip.deletedAt && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    تاريخ الحذف: {new Date(trip.deletedAt).toLocaleDateString("en-GB")}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setTripToRestore(trip.id)}
                                className="gap-2 bg-transparent text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <RotateCcw className="w-4 h-4" />
                                <span className="hidden sm:inline">استرجاع</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setTripToDeletePermanently(trip.id)}
                                className="gap-2 bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                                <span className="hidden sm:inline">حذف نهائي</span>
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shipments" className="space-y-4 mt-6">
              {deletedShipments.length === 0 ? (
                <Card className="glass-effect">
                  <CardContent className="py-12 text-center">
                    <Trash2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">لا توجد شحنات محذوفة</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:gap-6">
                  {deletedShipments.map((shipment) => {
                    const daysRemaining = shipment.deletedAt ? getDaysRemaining(shipment.deletedAt) : 30
                    const statusInfo = getStatusInfo(shipment.status)

                    return (
                      <Card
                        key={shipment.id}
                        className="glass-effect hover:shadow-glow transition-all duration-300 border-red-500/20"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-3 rounded-xl bg-red-500/10">
                                <Package className="w-6 h-6 text-red-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-600 font-bold text-sm font-mono">
                                    {shipment.trackingNumber}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      daysRemaining <= 7
                                        ? "bg-red-500/20 text-red-600"
                                        : "bg-amber-500/20 text-amber-600"
                                    }`}
                                  >
                                    {daysRemaining} يوم متبقي
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}
                                  >
                                    {statusInfo.label}
                                  </span>
                                </div>
                                <CardTitle className="text-base">
                                  {shipment.senderName} ← {shipment.receiverName}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-4 mt-1 flex-wrap">
                                  <span>القيمة: {shipment.amount?.toFixed(2)} د.أ</span>
                                  <span>الوزن: {shipment.weight} كجم</span>
                                  <span>
                                    {shipment.paymentMethod === "cash" ? "نقداً" : "عند التسليم"} -{" "}
                                    {shipment.paymentLocation === "sender" ? "عند المرسل" : "عند المستلم"}
                                  </span>
                                </CardDescription>
                                {shipment.deletedAt && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    تاريخ الحذف: {new Date(shipment.deletedAt).toLocaleDateString("en-GB")}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShipmentToRestore(shipment.id)}
                                className="gap-2 bg-transparent text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <RotateCcw className="w-4 h-4" />
                                <span className="hidden sm:inline">استرجاع</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShipmentToDeletePermanently(shipment.id)}
                                className="gap-2 bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                                <span className="hidden sm:inline">حذف نهائي</span>
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* استرجاع الرحلة */}
      <AlertDialog open={!!tripToRestore} onOpenChange={() => setTripToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>استرجاع الرحلة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من استرجاع هذه الرحلة؟ سيتم نقلها إلى صفحة إدارة الرحلات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => tripToRestore && handleRestoreTrip(tripToRestore)}
              className="bg-green-600 hover:bg-green-700"
            >
              استرجاع
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* حذف رحلة نهائي */}
      <AlertDialog open={!!tripToDeletePermanently} onOpenChange={() => setTripToDeletePermanently(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف نهائي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من الحذف النهائي لهذه الرحلة؟ لا يمكن التراجع عن هذا الإجراء ولن تتمكن من استرجاعها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => tripToDeletePermanently && handleDeleteTripPermanently(tripToDeletePermanently)}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* استرجاع الشحنة */}
      <AlertDialog open={!!shipmentToRestore} onOpenChange={() => setShipmentToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>استرجاع الشحنة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من استرجاع هذه الشحنة؟ سيتم نقلها إلى صفحة إدارة الشحنات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => shipmentToRestore && handleRestoreShipment(shipmentToRestore)}
              className="bg-green-600 hover:bg-green-700"
            >
              استرجاع
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* حذف شحنة نهائي */}
      <AlertDialog open={!!shipmentToDeletePermanently} onOpenChange={() => setShipmentToDeletePermanently(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف نهائي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من الحذف النهائي لهذه الشحنة؟ لا يمكن التراجع عن هذا الإجراء ولن تتمكن من استرجاعها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                shipmentToDeletePermanently && handleDeleteShipmentPermanently(shipmentToDeletePermanently)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              حذف نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
