"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  CalendarIcon,
  Plus,
  Package,
  Users,
  Briefcase,
  DollarSign,
  Truck,
  Ticket,
  HardHat,
  UserCheck,
  FileCheck,
  Hotel,
  X,
  Cigarette,
  MoreHorizontal,
  ArrowLeft,
  Save,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Shipment } from "@/components/shipment-form"
import type { Trip } from "@/components/add-trip-dialog"

export default function NewTripPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tripDate, setTripDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [availableShipments, setAvailableShipments] = useState<Shipment[]>([])
  const [selectedShipments, setSelectedShipments] = useState<
    Array<{
      shipment: Shipment
      deliveryCost: string
    }>
  >([])
  const [currentShipmentId, setCurrentShipmentId] = useState<string>("")
  const [numberOfPeople, setNumberOfPeople] = useState("")
  const [numberOfBags, setNumberOfBags] = useState("")
  const [tobaccoRevenue, setTobaccoRevenue] = useState("")
  const [otherRevenue, setOtherRevenue] = useState("")
  const [additionalCosts, setAdditionalCosts] = useState({
    bridgeDelivery: "",
    tickets: "",
    porterFees: "",
    employeeFees: "",
    permitFees: "",
    accommodationExpenses: "",
    other: "",
  })
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)

  useEffect(() => {
    try {
      console.log("[v0] Loading trip data, editId:", editId)
      loadShipments()

      if (editId) {
        const stored = localStorage.getItem("trips")
        console.log("[v0] Trips from localStorage:", stored)

        if (stored) {
          const trips: Trip[] = JSON.parse(stored)
          const trip = trips.find((t) => t.id === editId)
          console.log("[v0] Found trip for editing:", trip)

          if (trip) {
            setEditingTrip(trip)
            setTripDate(trip.date)
            setNumberOfPeople(trip.numberOfPeople.toString())
            setNumberOfBags(trip.numberOfBags.toString())
            setTobaccoRevenue(trip.tobaccoRevenue?.toString() || "0")
            setOtherRevenue(trip.otherRevenue?.toString() || "0")
            setAdditionalCosts({
              bridgeDelivery: trip.additionalCosts.bridgeDelivery.toString(),
              tickets: trip.additionalCosts.tickets.toString(),
              porterFees: trip.additionalCosts.porterFees.toString(),
              employeeFees: trip.additionalCosts.employeeFees.toString(),
              permitFees: trip.additionalCosts.permitFees.toString(),
              accommodationExpenses: trip.additionalCosts.accommodationExpenses.toString(),
              other: trip.additionalCosts.other?.toString() || "0",
            })

            const shipmentsStored = localStorage.getItem("shipments")
            if (shipmentsStored) {
              const allShipments: Shipment[] = JSON.parse(shipmentsStored)
              const selected = trip.shipments
                .map((ts) => {
                  const shipment = allShipments.find((s) => s.id === ts.shipmentId)
                  return shipment
                    ? {
                        shipment,
                        deliveryCost: ts.deliveryCost.toString(),
                      }
                    : null
                })
                .filter(Boolean) as Array<{ shipment: Shipment; deliveryCost: string }>

              setSelectedShipments(selected)
              console.log("[v0] Loaded selected shipments:", selected.length)
            }
          } else {
            console.log("[v0] Trip not found with id:", editId)
            toast({
              title: "خطأ",
              description: "لم يتم العثور على الرحلة",
              variant: "destructive",
            })
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error loading trip data:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل البيانات",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [editId, toast])

  const loadShipments = () => {
    try {
      const stored = localStorage.getItem("shipments")
      console.log("[v0] Loading shipments from localStorage")

      if (stored) {
        const shipments: Shipment[] = JSON.parse(stored)
        const pendingShipments = shipments.filter((s) => s.status !== "delivered")
        setAvailableShipments(pendingShipments)
        console.log("[v0] Loaded shipments:", pendingShipments.length)
      } else {
        console.log("[v0] No shipments found in localStorage")
        setAvailableShipments([])
      }
    } catch (error) {
      console.error("[v0] Error loading shipments:", error)
      setAvailableShipments([])
    }
  }

  const handleAddShipment = () => {
    if (!currentShipmentId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار شحنة",
        variant: "destructive",
      })
      return
    }

    const shipment = availableShipments.find((s) => s.id === currentShipmentId)
    if (!shipment) return

    if (selectedShipments.some((s) => s.shipment.id === currentShipmentId)) {
      toast({
        title: "خطأ",
        description: "هذه الشحنة مضافة بالفعل",
        variant: "destructive",
      })
      return
    }

    setSelectedShipments([...selectedShipments, { shipment, deliveryCost: "0" }])
    setCurrentShipmentId("")
  }

  const handleRemoveShipment = (shipmentId: string) => {
    setSelectedShipments(selectedShipments.filter((s) => s.shipment.id !== shipmentId))
  }

  const handleDeliveryCostChange = (shipmentId: string, value: string) => {
    setSelectedShipments(
      selectedShipments.map((s) => (s.shipment.id === shipmentId ? { ...s, deliveryCost: value } : s)),
    )
  }

  const handleAdditionalCostChange = (field: string, value: string) => {
    setAdditionalCosts((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Validation
      if (!tripDate) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار تاريخ الرحلة",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (selectedShipments.length === 0) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار شحنة واحدة على الأقل",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Validate delivery costs
      for (const item of selectedShipments) {
        const cost = Number.parseFloat(item.deliveryCost)
        if (isNaN(cost) || cost < 0) {
          toast({
            title: "خطأ",
            description: `يرجى إدخال تكلفة توصيل صحيحة للشحنة رقم ${item.shipment.trackingNumber}`,
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      if (!numberOfPeople || Number.parseInt(numberOfPeople) <= 0) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال عدد الأشخاص",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (!numberOfBags || Number.parseInt(numberOfBags) <= 0) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال عدد الشنط",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      const existingTrips = JSON.parse(localStorage.getItem("trips") || "[]")
      let serialNumber: number

      if (editingTrip) {
        // إذا كنا نعدل رحلة موجودة، نحتفظ بالرقم التسلسلي الأصلي
        serialNumber = editingTrip.serialNumber
      } else {
        // إذا كانت رحلة جديدة، نحسب أعلى رقم تسلسلي ونضيف 1
        const maxSerialNumber = existingTrips.reduce((max: number, trip: Trip) => {
          return trip.serialNumber > max ? trip.serialNumber : max
        }, 0)
        serialNumber = maxSerialNumber + 1
      }

      // Create trip object
      const trip: Trip = {
        id: editingTrip?.id || Date.now().toString(),
        serialNumber, // إضافة الرقم التسلسلي
        date: tripDate,
        shipments: selectedShipments.map((item) => ({
          shipmentId: item.shipment.id,
          trackingNumber: item.shipment.trackingNumber,
          senderName: item.shipment.senderName,
          recipientName: item.shipment.receiverName,
          amount: item.shipment.amount,
          deliveryCost: Number.parseFloat(item.deliveryCost),
        })),
        numberOfPeople: Number.parseInt(numberOfPeople),
        numberOfBags: Number.parseInt(numberOfBags),
        tobaccoRevenue: Number.parseFloat(tobaccoRevenue || "0"),
        otherRevenue: Number.parseFloat(otherRevenue || "0"),
        additionalCosts: {
          bridgeDelivery: Number.parseFloat(additionalCosts.bridgeDelivery || "0"),
          tickets: Number.parseFloat(additionalCosts.tickets || "0"),
          porterFees: Number.parseFloat(additionalCosts.porterFees || "0"),
          employeeFees: Number.parseFloat(additionalCosts.employeeFees || "0"),
          permitFees: Number.parseFloat(additionalCosts.permitFees || "0"),
          accommodationExpenses: Number.parseFloat(additionalCosts.accommodationExpenses || "0"),
          other: Number.parseFloat(additionalCosts.other || "0"),
        },
        createdAt: editingTrip?.createdAt || new Date().toISOString(),
      }

      // Save to localStorage
      let updatedTrips
      if (editingTrip) {
        updatedTrips = existingTrips.map((t: Trip) => (t.id === trip.id ? trip : t))
      } else {
        updatedTrips = [trip, ...existingTrips]
      }

      localStorage.setItem("trips", JSON.stringify(updatedTrips))

      // Dispatch event
      window.dispatchEvent(new Event("tripsUpdated"))

      toast({
        title: "نجح",
        description: editingTrip ? "تم تحديث الرحلة بنجاح" : "تمت إضافة الرحلة بنجاح",
      })

      // Navigate after a short delay to ensure state updates
      setTimeout(() => {
        router.push("/trips")
      }, 100)
    } catch (error) {
      console.error("Error saving trip:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الرحلة",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const totalDeliveryCosts = selectedShipments.reduce((sum, item) => {
    return sum + (Number.parseFloat(item.deliveryCost) || 0)
  }, 0)

  const totalAdditionalCosts = Object.values(additionalCosts).reduce((sum, cost) => {
    return sum + (Number.parseFloat(cost) || 0)
  }, 0)

  const totalTripCost = totalDeliveryCosts + totalAdditionalCosts

  const totalRevenue =
    selectedShipments.reduce((sum, item) => sum + item.shipment.amount, 0) +
    (Number.parseFloat(tobaccoRevenue) || 0) +
    (Number.parseFloat(otherRevenue) || 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
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
                <p className="text-[10px] sm:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1 hidden sm:block">
                  {editingTrip ? "تعديل رحلة" : "إضافة رحلة جديدة"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/trips">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">العودة للرحلات</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10 max-w-6xl">
        <div className="space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-xl">المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tripDate">تاريخ الرحلة *</Label>
                <div className="relative">
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="tripDate"
                    type="date"
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfPeople">عدد الأشخاص *</Label>
                  <div className="relative">
                    <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="numberOfPeople"
                      type="number"
                      min="1"
                      value={numberOfPeople}
                      onChange={(e) => setNumberOfPeople(e.target.value)}
                      placeholder="0"
                      className="pr-10"
                      dir="ltr"
                      style={{ textAlign: "right" }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfBags">عدد الشنط *</Label>
                  <div className="relative">
                    <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="numberOfBags"
                      type="number"
                      min="1"
                      value={numberOfBags}
                      onChange={(e) => setNumberOfBags(e.target.value)}
                      placeholder="0"
                      className="pr-10"
                      dir="ltr"
                      style={{ textAlign: "right" }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Package className="w-5 h-5" />
                اختيار الشحنات ({selectedShipments.length} مختارة)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={currentShipmentId} onValueChange={setCurrentShipmentId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="اختر شحنة لإضافتها" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableShipments.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">لا توجد شحنات متاحة</div>
                    ) : (
                      availableShipments.map((shipment) => (
                        <SelectItem key={shipment.id} value={shipment.id}>
                          <div className="flex flex-col gap-1 py-1">
                            <span className="font-medium">{shipment.trackingNumber}</span>
                            <span className="text-xs text-muted-foreground">
                              {shipment.receiverName} - {shipment.receiverAddress}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={handleAddShipment} disabled={!currentShipmentId} className="gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة
                </Button>
              </div>

              {selectedShipments.length > 0 && (
                <div className="space-y-3">
                  {selectedShipments.map((item) => (
                    <div key={item.shipment.id} className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{item.shipment.trackingNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.shipment.senderName} ← {item.shipment.receiverName}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                                <span className="font-semibold">العنوان:</span>
                                <span>{item.shipment.receiverAddress}</span>
                              </p>
                              <p className="text-sm font-semibold text-accent mt-1">
                                {item.shipment.amount.toFixed(2)} د.أ
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveShipment(item.shipment.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`delivery-${item.shipment.id}`} className="text-xs">
                              تكلفة التوصيل *
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id={`delivery-${item.shipment.id}`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.deliveryCost}
                                onChange={(e) => handleDeliveryCostChange(item.shipment.id, e.target.value)}
                                placeholder="0.00"
                                className="pr-10 h-9"
                                dir="ltr"
                                style={{ textAlign: "right" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Cigarette className="w-5 h-5" />
                الإيرادات الإضافية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tobaccoRevenue" className="flex items-center gap-2">
                    <Cigarette className="w-4 h-4" />
                    إيرادات التبغ
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="tobaccoRevenue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={tobaccoRevenue}
                      onChange={(e) => setTobaccoRevenue(e.target.value)}
                      placeholder="0.00"
                      className="pr-10"
                      dir="ltr"
                      style={{ textAlign: "right" }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherRevenue" className="flex items-center gap-2">
                    <MoreHorizontal className="w-4 h-4" />
                    إيرادات أخرى
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="otherRevenue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={otherRevenue}
                      onChange={(e) => setOtherRevenue(e.target.value)}
                      placeholder="0.00"
                      className="pr-10"
                      dir="ltr"
                      style={{ textAlign: "right" }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                التكاليف الإضافية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bridgeDelivery" className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    توصيل للجسر
                  </Label>
                  <Input
                    id="bridgeDelivery"
                    type="number"
                    step="0.01"
                    min="0"
                    value={additionalCosts.bridgeDelivery}
                    onChange={(e) => handleAdditionalCostChange("bridgeDelivery", e.target.value)}
                    placeholder="0.00"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tickets" className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    التكتات (التذاكر)
                  </Label>
                  <Input
                    id="tickets"
                    type="number"
                    step="0.01"
                    min="0"
                    value={additionalCosts.tickets}
                    onChange={(e) => handleAdditionalCostChange("tickets", e.target.value)}
                    placeholder="0.00"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="porterFees" className="flex items-center gap-2">
                    <HardHat className="w-4 h-4" />
                    أجور العتالة
                  </Label>
                  <Input
                    id="porterFees"
                    type="number"
                    step="0.01"
                    min="0"
                    value={additionalCosts.porterFees}
                    onChange={(e) => handleAdditionalCostChange("porterFees", e.target.value)}
                    placeholder="0.00"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeFees" className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    أجور الموظفين
                  </Label>
                  <Input
                    id="employeeFees"
                    type="number"
                    step="0.01"
                    min="0"
                    value={additionalCosts.employeeFees}
                    onChange={(e) => handleAdditionalCostChange("employeeFees", e.target.value)}
                    placeholder="0.00"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permitFees" className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    أجور التصريح
                  </Label>
                  <Input
                    id="permitFees"
                    type="number"
                    step="0.01"
                    min="0"
                    value={additionalCosts.permitFees}
                    onChange={(e) => handleAdditionalCostChange("permitFees", e.target.value)}
                    placeholder="0.00"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accommodationExpenses" className="flex items-center gap-2">
                    <Hotel className="w-4 h-4" />
                    مصاريف مبيت
                  </Label>
                  <Input
                    id="accommodationExpenses"
                    type="number"
                    step="0.01"
                    min="0"
                    value={additionalCosts.accommodationExpenses}
                    onChange={(e) => handleAdditionalCostChange("accommodationExpenses", e.target.value)}
                    placeholder="0.00"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="other" className="flex items-center gap-2">
                    <MoreHorizontal className="w-4 h-4" />
                    أخرى
                  </Label>
                  <Input
                    id="other"
                    type="number"
                    step="0.01"
                    min="0"
                    value={additionalCosts.other}
                    onChange={(e) => handleAdditionalCostChange("other", e.target.value)}
                    placeholder="0.00"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedShipments.length > 0 && (
            <Card className="glass-effect bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl">ملخص الرحلة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 pb-2 border-b">
                  <p className="font-semibold text-sm text-muted-foreground">الإيرادات</p>
                  <div className="flex justify-between text-sm">
                    <span>إيرادات الشحنات:</span>
                    <span className="font-semibold">
                      {selectedShipments.reduce((sum, item) => sum + item.shipment.amount, 0).toFixed(2)} د.أ
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>إيرادات التبغ:</span>
                    <span className="font-semibold">{(Number.parseFloat(tobaccoRevenue) || 0).toFixed(2)} د.أ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>إيرادات أخرى:</span>
                    <span className="font-semibold">{(Number.parseFloat(otherRevenue) || 0).toFixed(2)} د.أ</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>إجمالي الإيرادات:</span>
                    <span className="text-green-600">{totalRevenue.toFixed(2)} د.أ</span>
                  </div>
                </div>

                <div className="space-y-2 pb-2 border-b">
                  <p className="font-semibold text-sm text-muted-foreground">التكاليف</p>
                  <div className="flex justify-between text-sm">
                    <span>تكاليف التوصيل:</span>
                    <span className="font-semibold">{totalDeliveryCosts.toFixed(2)} د.أ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>التكاليف الإضافية:</span>
                    <span className="font-semibold">{totalAdditionalCosts.toFixed(2)} د.أ</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>إجمالي التكاليف:</span>
                    <span className="text-red-600">{totalTripCost.toFixed(2)} د.أ</span>
                  </div>
                </div>

                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>صافي الربح:</span>
                  <span
                    className={cn("text-xl", totalRevenue - totalTripCost >= 0 ? "text-green-600" : "text-red-600")}
                  >
                    {(totalRevenue - totalTripCost).toFixed(2)} د.أ
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
            <Link href="/trips" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent" disabled={isSubmitting}>
                إلغاء
              </Button>
            </Link>
            <Button type="button" onClick={handleSubmit} className="flex-1 gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingTrip ? "تحديث الرحلة" : "حفظ الرحلة"}
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
