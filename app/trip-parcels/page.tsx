"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { getPendingShipments, type ShipmentData } from "@/app/actions/shipments"
import { createTrip, getNextTripNumber } from "@/app/actions/trips"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Trash2, Save } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { AdminFooter } from "@/components/admin-footer"

interface SelectedShipment extends ShipmentData {
  deliveryCost: number
}

export default function TripParcelsPage() {
  const [tripDate, setTripDate] = useState<Date>()
  const [numberOfPeople, setNumberOfPeople] = useState<string>("")
  const [numberOfBags, setNumberOfBags] = useState<string>("")
  const [selectedShipments, setSelectedShipments] = useState<SelectedShipment[]>([])
  const [availableShipments, setAvailableShipments] = useState<ShipmentData[]>([])
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [deliveryCosts, setDeliveryCosts] = useState<string>("")
  const [porterFees, setPorterFees] = useState<string>("")
  const [permits, setPermits] = useState<string>("")
  const [tickets, setTickets] = useState<string>("")
  const [employeeDailyWages, setEmployeeDailyWages] = useState<string>("")
  const [accommodation, setAccommodation] = useState<string>("")
  const [otherCosts, setOtherCosts] = useState<string>("")

  const [tobaccoRevenue, setTobaccoRevenue] = useState<string>("")
  const [otherRevenue, setOtherRevenue] = useState<string>("")

  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string>("")

  useEffect(() => {
    loadShipments()

    const fetchCsrfToken = async () => {
      try {
        const response = await fetch("/api/csrf-token")
        const data = await response.json()
        if (data.token) {
          setCsrfToken(data.token)
        }
      } catch (error) {
        console.error("[v0] Error fetching CSRF token:", error)
      }
    }
    fetchCsrfToken()
  }, [])

  const loadShipments = async () => {
    setIsLoading(true)
    const result = await getPendingShipments()
    if (result.success && result.data) {
      setAvailableShipments(result.data)
    }
    setIsLoading(false)
  }

  const handleToggleShipment = (shipmentId: string) => {
    const newSet = new Set(tempSelectedIds)
    if (newSet.has(shipmentId)) {
      newSet.delete(shipmentId)
    } else {
      newSet.add(shipmentId)
    }
    setTempSelectedIds(newSet)
  }

  const handleAddShipments = () => {
    const shipmentsToAdd = availableShipments
      .filter((s) => tempSelectedIds.has(s.id))
      .map((s) => ({ ...s, deliveryCost: 0 }))

    setSelectedShipments([...selectedShipments, ...shipmentsToAdd])
    setTempSelectedIds(new Set())
    setIsDialogOpen(false)
  }

  const handleRemoveShipment = (shipmentId: string) => {
    setSelectedShipments(selectedShipments.filter((s) => s.id !== shipmentId))
  }

  const handleDeliveryCostChange = (shipmentId: string, cost: string) => {
    setSelectedShipments(
      selectedShipments.map((s) => (s.id === shipmentId ? { ...s, deliveryCost: Number.parseFloat(cost) || 0 } : s)),
    )
  }

  const calculateBudget = () => {
    const totalShipmentRevenue = selectedShipments.reduce((sum, s) => sum + s.deliveryCost, 0)

    const totalCosts =
      (Number.parseFloat(deliveryCosts) || 0) +
      (Number.parseFloat(porterFees) || 0) +
      (Number.parseFloat(permits) || 0) +
      (Number.parseFloat(tickets) || 0) +
      (Number.parseFloat(employeeDailyWages) || 0) +
      (Number.parseFloat(accommodation) || 0) +
      (Number.parseFloat(otherCosts) || 0)

    const totalRevenues =
      totalShipmentRevenue + (Number.parseFloat(tobaccoRevenue) || 0) + (Number.parseFloat(otherRevenue) || 0)

    const netProfit = totalRevenues - totalCosts

    alert(`
      إيرادات الشحنات: ${totalShipmentRevenue.toFixed(2)}
      إجمالي التكاليف: ${totalCosts.toFixed(2)}
      إجمالي الإيرادات: ${totalRevenues.toFixed(2)}
      صافي الربح: ${netProfit.toFixed(2)}
    `)
  }

  const handleSaveTrip = async () => {
    if (!tripDate) {
      alert("الرجاء اختيار تاريخ الرحلة")
      return
    }

    if (selectedShipments.length === 0) {
      alert("الرجاء إضافة شحنات للرحلة")
      return
    }

    setIsSaving(true)

    try {
      const tripNumber = await getNextTripNumber()

      const result = await createTrip(
        {
          trip_number: tripNumber,
          departure_date: format(tripDate, "yyyy-MM-dd"),
          shipment_ids: selectedShipments.map((s) => Number.parseInt(s.id)),
          people_count: Number.parseInt(numberOfPeople) || 0,
          bags_count: Number.parseInt(numberOfBags) || 0,
          delivery_costs: Number.parseFloat(deliveryCosts) || 0,
          porter_fees: Number.parseFloat(porterFees) || 0,
          permit_fees: Number.parseFloat(permits) || 0,
          tickets: Number.parseFloat(tickets) || 0,
          employee_daily_wages: Number.parseFloat(employeeDailyWages) || 0,
          accommodation: Number.parseFloat(accommodation) || 0,
          other_costs: Number.parseFloat(otherCosts) || 0,
          tobacco_revenue: Number.parseFloat(tobaccoRevenue) || 0,
          other_revenue: Number.parseFloat(otherRevenue) || 0,
        },
        csrfToken,
      )

      if (result.success) {
        alert(`تم حفظ الرحلة بنجاح! رقم الرحلة: ${tripNumber}`)
        router.push("/trips-table")
      } else {
        alert(`فشل حفظ الرحلة: ${result.message || "حدث خطأ غير متوقع"}`)
      }
    } catch (error) {
      console.error("[v0] Error saving trip:", error)
      alert(`حدث خطأ أثناء حفظ الرحلة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`)
    } finally {
      setIsSaving(false)
    }
  }

  const unselectedShipments = availableShipments.filter(
    (s) => !selectedShipments.some((selected) => selected.id === s.id),
  )

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">طرود الرحلات</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>معلومات الرحلة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>تاريخ الرحلة</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !tripDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {tripDate ? format(tripDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={tripDate} onSelect={setTripDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="people">عدد الأشخاص</Label>
                <Input
                  id="people"
                  type="number"
                  min="0"
                  value={numberOfPeople}
                  onChange={(e) => setNumberOfPeople(e.target.value)}
                  placeholder="أدخل عدد الأشخاص"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bags">عدد الحقائب</Label>
                <Input
                  id="bags"
                  type="number"
                  min="0"
                  value={numberOfBags}
                  onChange={(e) => setNumberOfBags(e.target.value)}
                  placeholder="أدخل عدد الحقائب"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>الشحنات المضافة</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة شحنات
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>اختر الشحنات</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {isLoading ? (
                    <p className="text-center text-muted-foreground">جاري التحميل...</p>
                  ) : unselectedShipments.length === 0 ? (
                    <p className="text-center text-muted-foreground">لا توجد شحنات متاحة</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">اختيار</TableHead>
                          <TableHead className="text-right">رقم التتبع</TableHead>
                          <TableHead className="text-right">اسم المستلم</TableHead>
                          <TableHead className="text-right">وصف الشحنة</TableHead>
                          <TableHead className="text-right">العنوان</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unselectedShipments.map((shipment) => (
                          <TableRow key={shipment.id}>
                            <TableCell>
                              <Checkbox
                                checked={tempSelectedIds.has(shipment.id)}
                                onCheckedChange={() => handleToggleShipment(shipment.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{shipment.trackingNumber}</TableCell>
                            <TableCell>{shipment.receiverName}</TableCell>
                            <TableCell>{shipment.description || "-"}</TableCell>
                            <TableCell>{shipment.receiverAddress}</TableCell>
                            <TableCell>{shipment.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleAddShipments} disabled={tempSelectedIds.size === 0}>
                      إضافة ({tempSelectedIds.size})
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {selectedShipments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لم يتم إضافة أي شحنات بعد</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم التتبع</TableHead>
                    <TableHead className="text-right">اسم المستلم</TableHead>
                    <TableHead className="text-right">وصف الشحنة</TableHead>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">تكلفة التوصيل</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">{shipment.trackingNumber}</TableCell>
                      <TableCell>{shipment.receiverName}</TableCell>
                      <TableCell>{shipment.description || "-"}</TableCell>
                      <TableCell>{shipment.receiverAddress}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={shipment.deliveryCost}
                          onChange={(e) => handleDeliveryCostChange(shipment.id, e.target.value)}
                          className="w-32"
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveShipment(shipment.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>التكاليف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="deliveryCosts">تكاليف توصيل</Label>
                <Input
                  id="deliveryCosts"
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryCosts}
                  onChange={(e) => setDeliveryCosts(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="porterFees">أجور عتالة</Label>
                <Input
                  id="porterFees"
                  type="number"
                  min="0"
                  step="0.01"
                  value={porterFees}
                  onChange={(e) => setPorterFees(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="permits">تصاريح</Label>
                <Input
                  id="permits"
                  type="number"
                  min="0"
                  step="0.01"
                  value={permits}
                  onChange={(e) => setPermits(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tickets">تكتات</Label>
                <Input
                  id="tickets"
                  type="number"
                  min="0"
                  step="0.01"
                  value={tickets}
                  onChange={(e) => setTickets(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeDailyWages">يوميات موظفين</Label>
                <Input
                  id="employeeDailyWages"
                  type="number"
                  min="0"
                  step="0.01"
                  value={employeeDailyWages}
                  onChange={(e) => setEmployeeDailyWages(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accommodation">مبيت</Label>
                <Input
                  id="accommodation"
                  type="number"
                  min="0"
                  step="0.01"
                  value={accommodation}
                  onChange={(e) => setAccommodation(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherCosts">تكاليف أخرى</Label>
                <Input
                  id="otherCosts"
                  type="number"
                  min="0"
                  step="0.01"
                  value={otherCosts}
                  onChange={(e) => setOtherCosts(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tobaccoRevenue">إيرادات تبغ</Label>
                <Input
                  id="tobaccoRevenue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={tobaccoRevenue}
                  onChange={(e) => setTobaccoRevenue(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherRevenue">إيرادات أخرى</Label>
                <Input
                  id="otherRevenue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={otherRevenue}
                  onChange={(e) => setOtherRevenue(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={handleSaveTrip} disabled={isSaving} className="gap-2">
            <Save className="h-5 w-5" />
            {isSaving ? "جاري الحفظ..." : "حفظ الرحلة"}
          </Button>
        </div>
      </div>
      <AdminFooter backUrl="/trips-table" backLabel="جدول الرحلات" />
    </div>
  )
}
