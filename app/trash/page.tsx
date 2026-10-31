"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Calendar, Package, RotateCcw, X, AlertTriangle, Truck, Sparkles } from "lucide-react"
import Image from "next/image"
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
import { getDeletedTrips, restoreTrip, permanentlyDeleteTrip, cleanupOldDeletedTrips } from "@/app/actions/trips"
import {
  getDeletedShipments,
  restoreShipment,
  permanentlyDeleteShipment,
  cleanupOldDeletedShipments,
} from "@/app/actions/shipments"
import type { Trip } from "@/app/actions/trips"
import type { ShipmentData } from "@/app/actions/shipments"
import { AdminFooter } from "@/components/admin-footer"

export default function TrashPage() {
  const [deletedTrips, setDeletedTrips] = useState<Trip[]>([])
  const [deletedShipments, setDeletedShipments] = useState<ShipmentData[]>([])
  const [itemToRestore, setItemToRestore] = useState<{ type: "trip" | "shipment"; id: string } | null>(null)
  const [itemToDelete, setItemToDelete] = useState<{ type: "trip" | "shipment"; id: string } | null>(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    performAutomaticCleanup()
    fetchCsrfToken()
  }, [])

  const fetchCsrfToken = async () => {
    try {
      const response = await fetch("/api/csrf-token")
      const data = await response.json()
      if (data.token) {
        setCsrfToken(data.token)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch CSRF token:", error)
    }
  }

  const loadData = async () => {
    const [trips, shipmentsResult] = await Promise.all([getDeletedTrips(), getDeletedShipments()])

    setDeletedTrips(trips)
    setDeletedShipments(shipmentsResult.data || [])
  }

  const performAutomaticCleanup = async () => {
    try {
      await Promise.all([cleanupOldDeletedTrips(), cleanupOldDeletedShipments()])
    } catch (error) {
      // Silent error handling
    }
  }

  const handleManualCleanup = async () => {
    setIsCleaningUp(true)
    try {
      const [tripsResult, shipmentsResult] = await Promise.all([cleanupOldDeletedTrips(), cleanupOldDeletedShipments()])

      const totalCleaned = (tripsResult.count || 0) + (shipmentsResult.count || 0)

      if (totalCleaned > 0) {
        toast({
          title: "تم التنظيف",
          description: `تم حذف ${totalCleaned} عنصر قديم بشكل نهائي`,
        })
        await loadData()
      } else {
        toast({
          title: "لا توجد عناصر قديمة",
          description: "لا توجد عناصر محذوفة منذ أكثر من 30 يوماً",
        })
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تنظيف العناصر القديمة",
        variant: "destructive",
      })
    } finally {
      setIsCleaningUp(false)
    }
  }

  const handleRestore = async () => {
    if (!itemToRestore) return

    try {
      if (itemToRestore.type === "trip") {
        const result = await restoreTrip(itemToRestore.id, csrfToken)
        if (!result.success) {
          throw new Error(result.error || "فشل الاسترجاع")
        }
        toast({ title: "تم الاسترجاع", description: "تم استرجاع الرحلة بنجاح" })
      } else {
        const result = await restoreShipment(itemToRestore.id, csrfToken)
        if (!result.success) {
          throw new Error(result.error || "فشل الاسترجاع")
        }
        toast({ title: "تم الاسترجاع", description: "تم استرجاع الشحنة بنجاح" })
      }

      await loadData()
      setItemToRestore(null)
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل استرجاع العنصر",
        variant: "destructive",
      })
    }
  }

  const handlePermanentDelete = async () => {
    if (!itemToDelete) return

    try {
      if (itemToDelete.type === "trip") {
        const result = await permanentlyDeleteTrip(itemToDelete.id, csrfToken)
        if (!result.success) {
          throw new Error(result.error || "فشل الحذف")
        }
        toast({ title: "تم الحذف النهائي", description: "تم حذف الرحلة نهائياً", variant: "destructive" })
      } else {
        const result = await permanentlyDeleteShipment(itemToDelete.id, csrfToken)
        if (!result.success) {
          throw new Error(result.error || "فشل الحذف")
        }
        toast({ title: "تم الحذف النهائي", description: "تم حذف الشحنة نهائياً", variant: "destructive" })
      }

      await loadData()
      setItemToDelete(null)
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل الحذف النهائي",
        variant: "destructive",
      })
    }
  }

  const getDaysRemaining = (deletedAt: string | null) => {
    if (!deletedAt) return 30

    const deletedDate = new Date(deletedAt)
    const expiryDate = new Date(deletedDate)
    expiryDate.setDate(expiryDate.getDate() + 30)

    const now = new Date()
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return Math.max(0, daysRemaining)
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="space-y-4 sm:space-y-8">
          <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-red-500/10 border-2 border-red-500/20">
                <Trash2 className="w-5 h-5 sm:w-7 sm:h-7 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">سلة المحذوفات</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  الرحلات والشحنات المحذوفة - يتم الحذف التلقائي بعد 30 يوم
                </p>
              </div>
            </div>

            <Button
              onClick={handleManualCleanup}
              disabled={isCleaningUp}
              variant="outline"
              className="gap-2 bg-transparent text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">{isCleaningUp ? "جاري التنظيف..." : "تنظيف تلقائي"}</span>
            </Button>
          </div>

          {(deletedTrips.length > 0 || deletedShipments.length > 0) && (
            <Card className="glass-effect border-amber-500/30 bg-amber-500/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900 dark:text-amber-200">
                    <p className="font-semibold mb-1">تنبيه هام:</p>
                    <p>سيتم حذف العناصر تلقائياً بعد مرور 30 يوم من تاريخ النقل إلى سلة المحذوفات.</p>
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
                    const daysRemaining = getDaysRemaining(trip.deleted_at)

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
                                    {trip.trip_number}
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
                                  {new Date(trip.departure_date).toLocaleDateString("ar-EG")}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-4 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    {trip.shipments.length} شحنة
                                  </span>
                                </CardDescription>
                                {trip.deleted_at && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    تاريخ الحذف: {new Date(trip.deleted_at).toLocaleDateString("ar-EG")}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setItemToRestore({ type: "trip", id: trip.id })}
                                className="gap-2 bg-transparent text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <RotateCcw className="w-4 h-4" />
                                <span className="hidden sm:inline">استرجاع</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setItemToDelete({ type: "trip", id: trip.id })}
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
                    const daysRemaining = getDaysRemaining(shipment.deletedAt)
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
                                  <span>القيمة: {Number(shipment.amount || 0).toFixed(2)} د.أ</span>
                                  <span>الوزن: {shipment.weight} كجم</span>
                                </CardDescription>
                                {shipment.deletedAt && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    تاريخ الحذف: {new Date(shipment.deletedAt).toLocaleDateString("ar-EG")}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setItemToRestore({ type: "shipment", id: shipment.id })}
                                className="gap-2 bg-transparent text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <RotateCcw className="w-4 h-4" />
                                <span className="hidden sm:inline">استرجاع</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setItemToDelete({ type: "shipment", id: shipment.id })}
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

      <AlertDialog open={!!itemToRestore} onOpenChange={() => setItemToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>استرجاع {itemToRestore?.type === "trip" ? "الرحلة" : "الشحنة"}</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من استرجاع هذا العنصر؟ سيتم نقله إلى الصفحة الرئيسية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} className="bg-green-600 hover:bg-green-700">
              استرجاع
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف نهائي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء ولن تتمكن من استرجاع العنصر.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-red-600 hover:bg-red-700">
              حذف نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminFooter backUrl="/admin" backLabel="الإدارة" />
    </div>
  )
}
