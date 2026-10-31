"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, User, Phone, Car, FileText, Package, Wallet } from "lucide-react"
import { getDrivers, addDriver, updateDriver, type Driver } from "@/app/actions/drivers"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface DriversListClientProps {
  initialDrivers: Driver[]
}

export function DriversListClient({ initialDrivers }: DriversListClientProps) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    license_number: "",
    vehicle_number: "",
    vehicle_type: "",
    status: "active" as "active" | "inactive",
    notes: "",
  })
  const { toast } = useToast()

  const loadDrivers = async () => {
    const data = await getDrivers()
    setDrivers(data)
  }

  const handleOpenDialog = (driver?: Driver) => {
    if (driver) {
      setEditingDriver(driver)
      setFormData({
        name: driver.name,
        phone: driver.phone || "",
        license_number: driver.license_number || "",
        vehicle_number: driver.vehicle_number || "",
        vehicle_type: driver.vehicle_type || "",
        status: driver.status,
        notes: driver.notes || "",
      })
    } else {
      setEditingDriver(null)
      setFormData({
        name: "",
        phone: "",
        license_number: "",
        vehicle_number: "",
        vehicle_type: "",
        status: "active",
        notes: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم السائق",
        variant: "destructive",
      })
      return
    }

    const result = editingDriver ? await updateDriver(editingDriver.id, formData) : await addDriver(formData)

    if (result.success) {
      toast({
        title: "نجح",
        description: result.message || (editingDriver ? "تم تحديث السائق بنجاح" : "تم إضافة السائق بنجاح"),
      })
      setIsDialogOpen(false)
      loadDrivers()
    } else {
      toast({
        title: "خطأ",
        description: result.error || "حدث خطأ",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">قائمة السائقين</h2>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة سائق جديد
        </Button>
      </div>

      {drivers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">لا يوجد سائقين</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {drivers.map((driver) => {
            const hasUndelivered = driver.undelivered_tasks_count && driver.undelivered_tasks_count > 0
            const hasUncollected = driver.uncollected_sessions_count && driver.uncollected_sessions_count > 0

            return (
              <Link key={driver.id} href={`/drivers/${driver.id}`} className="block">
                <div
                  className={`
                  relative p-3 rounded-xl border-2 transition-all duration-200
                  hover:shadow-lg hover:scale-[1.02] cursor-pointer
                  aspect-square flex flex-col
                  ${
                    hasUndelivered || hasUncollected
                      ? "border-red-200 bg-red-50/50 hover:border-red-300"
                      : "border-green-200 bg-green-50/50 hover:border-green-300"
                  }
                `}
                >
                  {/* Status badge - top right */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                        driver.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {driver.status === "active" ? "نشط" : "غير نشط"}
                    </span>
                  </div>

                  {/* Center content - Icon and Name */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div
                      className={`
                      w-14 h-14 rounded-full flex items-center justify-center mb-2
                      ${hasUndelivered || hasUncollected ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}
                    `}
                    >
                      <User className="w-7 h-7" />
                    </div>
                    <h3
                      className={`
                      font-bold text-sm leading-tight
                      ${hasUndelivered || hasUncollected ? "text-red-700" : "text-green-700"}
                    `}
                    >
                      {driver.name}
                    </h3>
                    {driver.vehicle_type && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{driver.vehicle_type}</p>
                    )}
                  </div>

                  {/* Bottom badges */}
                  <div className="flex flex-col gap-1 mt-auto">
                    {hasUndelivered && (
                      <div className="flex items-center justify-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-medium">
                        <Package className="w-3 h-3" />
                        <span>{driver.undelivered_tasks_count} غير مسلمة</span>
                      </div>
                    )}
                    {hasUncollected && (
                      <div className="flex items-center justify-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-medium">
                        <Wallet className="w-3 h-3" />
                        <span>{driver.uncollected_sessions_count} غير مقبوضة</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Dialog for adding/editing driver */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDriver ? "تعديل السائق" : "إضافة سائق جديد"}</DialogTitle>
            <DialogDescription>
              {editingDriver ? "قم بتعديل معلومات السائق" : "أدخل معلومات السائق الجديد"}
            </DialogDescription>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>{editingDriver ? "تحديث" : "إضافة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
