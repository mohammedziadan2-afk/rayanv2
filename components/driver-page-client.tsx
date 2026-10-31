"use client"

import { updateDriver, deleteDriver, getDriverTasks, getDriverSessions } from "@/app/actions/drivers"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, ClipboardList, Smartphone, Pencil, Trash2, Phone, Car, FileText, MapPin, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"
import { DriverTasks } from "@/components/driver-tasks"
import { DriverViewClient } from "@/components/driver-view-client"
import { AdminFooter } from "@/components/admin-footer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface DriverPageClientProps {
  driver: any
  initialTasks: any[]
  approvedSessions: any[]
  driverId: string
}

export function DriverPageClient({
  driver: initialDriver,
  initialTasks,
  approvedSessions: initialSessions,
  driverId,
}: DriverPageClientProps) {
  const [driver, setDriver] = useState(initialDriver)
  const [tasks, setTasks] = useState(initialTasks)
  const [approvedSessions, setApprovedSessions] = useState(initialSessions)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: driver.name,
    phone: driver.phone || "",
    license_number: driver.license_number || "",
    vehicle_number: driver.vehicle_number || "",
    vehicle_type: driver.vehicle_type || "",
    status: driver.status as "active" | "inactive",
    notes: driver.notes || "",
  })
  const { toast } = useToast()
  const router = useRouter()

  const refreshData = useCallback(async () => {
    const [tasksData, sessionsData] = await Promise.all([getDriverTasks(driverId), getDriverSessions(driverId)])
    setTasks(tasksData.filter((task: any) => !task.session_id || task.status === "postponed"))
    setApprovedSessions(sessionsData.filter((s: any) => s.is_approved === true))
  }, [driverId])

  const handleUpdateDriver = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم السائق",
        variant: "destructive",
      })
      return
    }

    const result = await updateDriver(driverId, formData)

    if (result.success) {
      toast({
        title: "نجح",
        description: "تم تحديث بيانات السائق بنجاح",
      })
      setIsEditDialogOpen(false)
      setDriver({ ...driver, ...formData })
    } else {
      toast({
        title: "خطأ",
        description: result.error || "حدث خطأ",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDriver = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا السائق؟ سيتم حذف جميع البيانات المرتبطة به.")) return

    const result = await deleteDriver(driverId)
    if (result.success) {
      toast({
        title: "نجح",
        description: "تم حذف السائق بنجاح",
      })
      router.push("/drivers")
    } else {
      toast({
        title: "خطأ",
        description: result.error || "حدث خطأ",
        variant: "destructive",
      })
    }
  }

  const undeliveredCount = tasks.filter((task) => task.status !== "delivered").length
  const iconButtonColor = undeliveredCount > 0 ? "text-red-600" : "text-green-600"

  return (
    <div className="container mx-auto p-4 space-y-4 pb-24">
      <div className="bg-gradient-to-l from-blue-600 to-blue-700 rounded-xl p-4 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{driver.name}</h1>
              <div className="flex flex-wrap gap-2 mt-1 text-blue-100 text-sm">
                {driver.vehicle_type && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {driver.vehicle_type}
                  </span>
                )}
                {driver.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {driver.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              driver.status === "active" ? "bg-green-400/20 text-green-100" : "bg-gray-400/20 text-gray-200"
            }`}
          >
            {driver.status === "active" ? "نشط" : "غير نشط"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-white/20">
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Pencil className="w-4 h-4" />
            تعديل
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5 flex-1 bg-red-500/80 hover:bg-red-500"
            onClick={handleDeleteDriver}
          >
            <Trash2 className="w-4 h-4" />
            حذف
          </Button>
        </div>
      </div>

      <Tabs defaultValue="manager" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manager" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            مدير المهام
          </TabsTrigger>
          <TabsTrigger value="driver" className={`flex items-center gap-2 ${iconButtonColor}`}>
            <Smartphone className="w-4 h-4" />
            أيقونات السائق
            {undeliveredCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">{undeliveredCount}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manager" className="mt-4">
          <DriverTasks driverId={driverId} driverName={driver.name} onDataChange={refreshData} />
        </TabsContent>

        <TabsContent value="driver" className="mt-4">
          <DriverViewClient driver={driver} initialTasks={tasks} approvedSessions={approvedSessions} />
        </TabsContent>
      </Tabs>

      {/* Edit Driver Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              تعديل بيانات السائق
            </DialogTitle>
            <DialogDescription>قم بتعديل معلومات السائق {driver.name}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                <User className="w-4 h-4 inline ml-2" />
                اسم السائق *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم السائق"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">
                  <Phone className="w-4 h-4 inline ml-2" />
                  رقم الهاتف
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="أدخل رقم الهاتف"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="license_number">
                  <FileText className="w-4 h-4 inline ml-2" />
                  رقم الرخصة
                </Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="أدخل رقم الرخصة"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vehicle_number">
                  <Car className="w-4 h-4 inline ml-2" />
                  رقم المركبة
                </Label>
                <Input
                  id="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                  placeholder="أدخل رقم المركبة"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="vehicle_type">المدينة</Label>
                <Input
                  id="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  placeholder="مثال: نابلس، رام الله"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">الحالة</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أدخل أي ملاحظات إضافية"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateDriver}>تحديث</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminFooter backUrl="/drivers" backLabel="السائقون" />
    </div>
  )
}
