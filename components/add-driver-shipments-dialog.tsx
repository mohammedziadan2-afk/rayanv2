"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Truck, Package, MapPin, Phone, DollarSign, ArrowRight, FileText } from "lucide-react"
import { getTrips, getShipmentsByTripId } from "@/app/actions/trips"
import { assignShipmentsToDriver } from "@/app/actions/drivers"
import { useToast } from "@/hooks/use-toast"

interface AddDriverShipmentsDialogProps {
  driverId: string
  driverName: string
  onSuccess?: () => void
}

interface Shipment {
  id: string
  tracking_number: string
  receiver_name: string
  receiver_phone: string
  receiver_address: string
  amount: number
  description: string
}

export function AddDriverShipmentsDialog({ driverId, driverName, onSuccess }: AddDriverShipmentsDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [trips, setTrips] = useState<any[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("")
  const [availableShipments, setAvailableShipments] = useState<Shipment[]>([])
  const [selectedShipments, setSelectedShipments] = useState<string[]>([])
  const [deliveryTypes, setDeliveryTypes] = useState<Record<string, "included" | "not_included">>({})
  const [driverCollects, setDriverCollects] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadTrips()
    }
  }, [open])

  const loadTrips = async () => {
    setIsLoading(true)
    const allTrips = await getTrips()
    const lastThreeTrips = allTrips.slice(0, 3)
    setTrips(lastThreeTrips)
    setIsLoading(false)
  }

  const handleTripSelect = async (tripId: string) => {
    setSelectedTripId(tripId)
    setIsLoading(true)

    try {
      const data = await getShipmentsByTripId(tripId)

      if (!data || data.length === 0) {
        setAvailableShipments([])
        toast({
          title: "تنبيه",
          description: "لا توجد شحنات في هذه الرحلة",
          variant: "destructive",
        })
      } else {
        setAvailableShipments(data)
        setStep(2)
      }
    } catch (error) {
      console.error("[v0] Error fetching shipments:", error)
      toast({
        title: "خطأ",
        description: "فشل في جلب الشحنات",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShipmentToggle = (shipmentId: string) => {
    setSelectedShipments((prev) => {
      if (prev.includes(shipmentId)) {
        const newSelected = prev.filter((id) => id !== shipmentId)
        const newDeliveryTypes = { ...deliveryTypes }
        delete newDeliveryTypes[shipmentId]
        setDeliveryTypes(newDeliveryTypes)
        const newDriverCollects = { ...driverCollects }
        delete newDriverCollects[shipmentId]
        setDriverCollects(newDriverCollects)
        return newSelected
      } else {
        setDeliveryTypes((prevTypes) => ({
          ...prevTypes,
          [shipmentId]: "included",
        }))
        setDriverCollects((prev) => ({
          ...prev,
          [shipmentId]: false,
        }))
        return [...prev, shipmentId]
      }
    })
  }

  const handleDeliveryTypeChange = (shipmentId: string, type: "included" | "not_included") => {
    setDeliveryTypes((prev) => ({
      ...prev,
      [shipmentId]: type,
    }))
  }

  const handleDriverCollectsChange = (shipmentId: string, collects: boolean) => {
    setDriverCollects((prev) => ({
      ...prev,
      [shipmentId]: collects,
    }))
  }

  const handleSave = async () => {
    if (selectedShipments.length === 0) {
      toast({
        title: "تنبيه",
        description: "الرجاء اختيار شحنات أولاً",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const shipmentsData = selectedShipments.map((shipmentId) => ({
        shipmentId,
        deliveryType: deliveryTypes[shipmentId] || "included",
        driverCollects: driverCollects[shipmentId] || false,
      }))

      await assignShipmentsToDriver(driverId, selectedTripId, shipmentsData)

      toast({
        title: "نجح",
        description: `تم إضافة ${selectedShipments.length} شحنة للسائق بنجاح`,
      })

      handleClose()
      onSuccess?.()
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الشحنات للسائق",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setStep(1)
    setSelectedTripId("")
    setAvailableShipments([])
    setSelectedShipments([])
    setDeliveryTypes({})
    setDriverCollects({})
  }

  const handleBack = () => {
    setStep(1)
    setSelectedTripId("")
    setAvailableShipments([])
    setSelectedShipments([])
    setDeliveryTypes({})
    setDriverCollects({})
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-6 text-lg"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          إضافة شحنات للسائق
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 1 ? (
              <>
                <Truck className="w-5 h-5" />
                اختيار الرحلة
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                اختيار الشحنات
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "اختر رحلة من آخر 3 رحلات" : "اختر الشحنات التي يجب تسليمها"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : trips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد رحلات متاحة</div>
            ) : (
              <div className="space-y-3">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    onClick={() => handleTripSelect(trip.id)}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg">{trip.trip_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(trip.departure_date).toLocaleDateString("ar-EG")}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : availableShipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد شحنات في هذه الرحلة</div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>رقم التتبع</TableHead>
                        <TableHead>وصف الشحنة</TableHead>
                        <TableHead>اسم المستلم</TableHead>
                        <TableHead>رقم الهاتف</TableHead>
                        <TableHead>العنوان</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>نوع التوصيل</TableHead>
                        <TableHead>يحصلها السائق</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableShipments.map((shipment) => (
                        <TableRow key={shipment.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedShipments.includes(shipment.id)}
                              onCheckedChange={() => handleShipmentToggle(shipment.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{shipment.tracking_number}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="max-w-[200px] truncate" title={shipment.description}>
                                {shipment.description || "لا يوجد وصف"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{shipment.receiver_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              {shipment.receiver_phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              {shipment.receiver_address}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              {shipment.amount} دينار
                            </div>
                          </TableCell>
                          <TableCell>
                            {selectedShipments.includes(shipment.id) && (
                              <Select
                                value={deliveryTypes[shipment.id] || "included"}
                                onValueChange={(value: "included" | "not_included") =>
                                  handleDeliveryTypeChange(shipment.id, value)
                                }
                              >
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="included">شامل توصيل</SelectItem>
                                  <SelectItem value="not_included">غير شامل توصيل</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            {selectedShipments.includes(shipment.id) && (
                              <Checkbox
                                checked={driverCollects[shipment.id] || false}
                                onCheckedChange={(checked) =>
                                  handleDriverCollectsChange(shipment.id, checked as boolean)
                                }
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Button variant="outline" onClick={handleBack}>
                    رجوع
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleClose}>
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || selectedShipments.length === 0}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    >
                      {isSaving ? "جاري الحفظ..." : `حفظ (${selectedShipments.length})`}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
