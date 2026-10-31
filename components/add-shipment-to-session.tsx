"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PackagePlus, Loader2, Search, Truck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getTrips, getShipmentsByTripId } from "@/app/actions/trips"
import { addShipmentsToSession } from "@/app/actions/drivers"

interface Trip {
  id: string
  trip_number: string
  departure_date: string
  driver_name: string
}

interface Shipment {
  id: string
  tracking_number: string
  receiver_name: string
  receiver_phone: string
  description: string
  amount: number
  status: string
}

interface AddShipmentToSessionProps {
  driverId: string
  sessionId: string
  onSuccess: () => void
}

export function AddShipmentToSession({ driverId, sessionId, onSuccess }: AddShipmentToSessionProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tripsLoading, setTripsLoading] = useState(false)
  const [shipmentsLoading, setShipmentsLoading] = useState(false)
  
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<string>("")
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [selectedShipments, setSelectedShipments] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  
  const { toast } = useToast()

  // Fetch trips when dialog opens
  useEffect(() => {
    if (open) {
      fetchTrips()
    }
  }, [open])

  // Fetch shipments when trip is selected
  useEffect(() => {
    if (selectedTrip) {
      fetchShipments(selectedTrip)
    } else {
      setShipments([])
    }
  }, [selectedTrip])

  const fetchTrips = async () => {
    setTripsLoading(true)
    try {
      const allTrips = await getTrips()
      // Get last 10 trips
      setTrips(allTrips.slice(0, 10))
    } catch (error) {
      console.error("Error fetching trips:", error)
      toast({ title: "خطأ", description: "فشل في جلب الرحلات", variant: "destructive" })
    } finally {
      setTripsLoading(false)
    }
  }

  const fetchShipments = async (tripId: string) => {
    setShipmentsLoading(true)
    try {
      const data = await getShipmentsByTripId(tripId)
      setShipments(data || [])
    } catch (error) {
      console.error("Error fetching shipments:", error)
      toast({ title: "خطأ", description: "فشل في جلب الشحنات", variant: "destructive" })
    } finally {
      setShipmentsLoading(false)
    }
  }

  const toggleShipment = (shipmentId: string) => {
    const newSelected = new Set(selectedShipments)
    if (newSelected.has(shipmentId)) {
      newSelected.delete(shipmentId)
    } else {
      newSelected.add(shipmentId)
    }
    setSelectedShipments(newSelected)
  }

  const selectAll = () => {
    if (selectedShipments.size === filteredShipments.length) {
      setSelectedShipments(new Set())
    } else {
      setSelectedShipments(new Set(filteredShipments.map(s => s.id)))
    }
  }

  const handleSubmit = async () => {
    if (selectedShipments.size === 0) {
      toast({ title: "تنبيه", description: "يرجى اختيار شحنة واحدة على الأقل", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const result = await addShipmentsToSession(
        driverId,
        sessionId,
        selectedTrip,
        Array.from(selectedShipments)
      )

      if (result.success) {
        toast({ title: "نجح", description: `تم إضافة ${selectedShipments.size} شحنة إلى الجلسة` })
        setOpen(false)
        setSelectedShipments(new Set())
        setSelectedTrip("")
        onSuccess()
      } else {
        toast({ title: "خطأ", description: result.error || "فشل في إضافة الشحنات", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error adding shipments:", error)
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة الشحنات", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filteredShipments = shipments.filter(s => 
    s.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.receiver_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg"
      >
        <PackagePlus className="w-4 h-4 ml-2" />
        إضافة شحنة
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-primary" />
              إضافة شحنات من الرحلات
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Trip Selection */}
            <div className="space-y-2">
              <Label>اختر الرحلة</Label>
              <Select value={selectedTrip} onValueChange={setSelectedTrip} disabled={tripsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={tripsLoading ? "جاري التحميل..." : "اختر رحلة"} />
                </SelectTrigger>
                <SelectContent>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span>رحلة #{trip.trip_number}</span>
                        <span className="text-muted-foreground text-sm">
                          - {new Date(trip.departure_date).toLocaleDateString("ar-EG")}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search & Select All */}
            {selectedTrip && (
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث في الشحنات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedShipments.size === filteredShipments.length && filteredShipments.length > 0 ? "إلغاء الكل" : "تحديد الكل"}
                </Button>
              </div>
            )}

            {/* Shipments List */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {shipmentsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !selectedTrip ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  اختر رحلة لعرض الشحنات المتاحة
                </div>
              ) : filteredShipments.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  لا توجد شحنات متاحة في هذه الرحلة
                </div>
              ) : (
                <div className="divide-y">
                  {filteredShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedShipments.has(shipment.id) ? "bg-primary/10" : ""
                      }`}
                      onClick={() => toggleShipment(shipment.id)}
                    >
                      <Checkbox
                        checked={selectedShipments.has(shipment.id)}
                        onCheckedChange={() => toggleShipment(shipment.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-primary">
                            {shipment.tracking_number}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {Number(shipment.amount || 0).toFixed(2)} د.أ
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {shipment.receiver_name} - {shipment.description || "بدون وصف"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Count */}
            {selectedShipments.size > 0 && (
              <div className="text-sm text-muted-foreground text-center">
                تم اختيار <span className="font-bold text-primary">{selectedShipments.size}</span> شحنة
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || selectedShipments.size === 0}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {loading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <PackagePlus className="w-4 h-4 ml-2" />}
              إضافة ({selectedShipments.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
