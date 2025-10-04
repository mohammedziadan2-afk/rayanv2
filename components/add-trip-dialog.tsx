"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "lucide-react"
import type { Shipment } from "@/components/shipment-form"

export interface Trip {
  id: string
  serialNumber: number
  date: string
  shipments: {
    shipmentId: string
    trackingNumber: string
    senderName: string
    recipientName: string
    amount: number
    deliveryCost: number
  }[]
  numberOfPeople: number
  numberOfBags: number
  tobaccoRevenue: number
  otherRevenue: number
  additionalCosts: {
    bridgeDelivery: number
    tickets: number
    porterFees: number
    employeeFees: number
    permitFees: number
    accommodationExpenses: number
    other: number
  }
  createdAt: string
  deletedAt?: string
}

interface AddTripDialogProps {
  onTripAdded?: () => void
  tripToEdit?: Trip | null
  trigger?: React.ReactNode
}

export function AddTripDialog({ onTripAdded, tripToEdit, trigger }: AddTripDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [tripDate, setTripDate] = useState<Date | undefined>(new Date())
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
  const [serialNumber, setSerialNumber] = useState<number>(0)

  useEffect(() => {
    if (open && tripToEdit) {
      setTripDate(new Date(tripToEdit.date))
      setNumberOfPeople(tripToEdit.numberOfPeople.toString())
      setNumberOfBags(tripToEdit.numberOfBags.toString())
      setTobaccoRevenue(tripToEdit.tobaccoRevenue.toString())
      setOtherRevenue(tripToEdit.otherRevenue.toString())
      setAdditionalCosts({
        bridgeDelivery: tripToEdit.additionalCosts.bridgeDelivery.toString(),
        tickets: tripToEdit.additionalCosts.tickets.toString(),
        porterFees: tripToEdit.additionalCosts.porterFees.toString(),
        employeeFees: tripToEdit.additionalCosts.employeeFees.toString(),
        permitFees: tripToEdit.additionalCosts.permitFees.toString(),
        accommodationExpenses: tripToEdit.additionalCosts.accommodationExpenses.toString(),
        other: tripToEdit.additionalCosts.other?.toString() || "0",
      })
      setSerialNumber(tripToEdit.serialNumber)

      const stored = localStorage.getItem("shipments")
      if (stored) {
        const allShipments: Shipment[] = JSON.parse(stored)
        const selected = tripToEdit.shipments
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
      }
    }
  }, [open, tripToEdit])

  useEffect(() => {
    if (open) {
      loadShipments()
    }
  }, [open])

  const loadShipments = () => {
    const stored = localStorage.getItem("shipments")
    if (stored) {
      const shipments: Shipment[] = JSON.parse(stored)
      const pendingShipments = shipments.filter((s) => s.status !== "delivered")
      setAvailableShipments(pendingShipments)
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

    setSelectedShipments([...selectedShipments, { shipment, deliveryCost: "" }])
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

  const handleSubmit = () => {
    if (!tripDate) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار تاريخ الرحلة",
        variant: "destructive",
      })
      return
    }

    if (selectedShipments.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار شحنة واحدة على الأقل",
        variant: "destructive",
      })
      return
    }

    for (const item of selectedShipments) {
      if (!item.deliveryCost || Number.parseFloat(item.deliveryCost) < 0) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال تكلفة توصيل صحيحة لجميع الشحنات المختارة",
          variant: "destructive",
        })
        return
      }
    }

    if (!numberOfPeople || Number.parseInt(numberOfPeople) <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عدد الأشخاص",
        variant: "destructive",
      })
      return
    }

    if (!numberOfBags || Number.parseInt(numberOfBags) <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عدد الشنط",
        variant: "destructive",
      })
      return
    }

    const trip: Trip = {
      id: tripToEdit?.id || Date.now().toString(),
      serialNumber: serialNumber,
      date: tripDate.toISOString().split("T")[0],
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
      createdAt: tripToEdit?.createdAt || new Date().toISOString(),
      deletedAt: tripToEdit?.deletedAt,
    }

    const existingTrips = JSON.parse(localStorage.getItem("trips") || "[]")

    let updatedTrips
    if (tripToEdit) {
      updatedTrips = existingTrips.map((t: Trip) => (t.id === trip.id ? trip : t))
    } else {
      updatedTrips = [trip, ...existingTrips]
    }

    localStorage.setItem("trips", JSON.stringify(updatedTrips))

    window.dispatchEvent(new Event("tripsUpdated"))

    toast({
      title: "نجح",
      description: tripToEdit ? "تم تحديث الرحلة بنجاح" : "تمت إضافة الرحلة بنجاح",
    })

    setTripDate(new Date())
    setSelectedShipments([])
    setCurrentShipmentId("")
    setNumberOfPeople("")
    setNumberOfBags("")
    setTobaccoRevenue("")
    setOtherRevenue("")
    setAdditionalCosts({
      bridgeDelivery: "",
      tickets: "",
      porterFees: "",
      employeeFees: "",
      permitFees: "",
      accommodationExpenses: "",
      other: "",
    })
    setSerialNumber(0)

    setOpen(false)
    onTripAdded?.()
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="gap-2 shadow-glow">
            <Plus className="w-5 h-5" />
            رحلة جديدة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{tripToEdit ? "تعديل الرحلة" : "إضافة رحلة جديدة"}</DialogTitle>
          <DialogDescription>
            {tripToEdit ? "قم بتعديل بيانات الرحلة" : "أضف رحلة جديدة مع تحديد الشحنات والتكاليف"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>تاريخ الرحلة *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal pr-10",
                      !tripDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="absolute right-3 w-4 h-4" />
                    {tripDate ? tripDate.toLocaleDateString("en-GB") : <span>اختر التاريخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={tripDate} onSelect={setTripDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
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
                            {shipment.trackingNumber}
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
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cigarette className="w-5 h-5" />
                  الإيرادات الإضافية
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
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
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">ملخص الرحلة</CardTitle>
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
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            إلغاء
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            {tripToEdit ? "تحديث الرحلة" : "إضافة الرحلة"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
