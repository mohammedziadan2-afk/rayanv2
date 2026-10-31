"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { addWarehouseItem } from "@/app/actions/warehouse"

interface AddWarehouseItemToInventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemAdded: () => void
  inventoryName: string
  existingTrackingNumber?: string
  existingSenderName?: string
}

export function AddWarehouseItemToInventoryDialog({
  open,
  onOpenChange,
  onItemAdded,
  inventoryName,
  existingTrackingNumber,
  existingSenderName,
}: AddWarehouseItemToInventoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string>("")
  const [formData, setFormData] = useState({
    item_name: "",
    sender_name: "",
    shipment_type: "",
    warehouse_quantity: "",
    delivered_quantity: "0",
    tracking_number: "",
  })

  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        tracking_number: existingTrackingNumber || "",
        sender_name: existingSenderName || "",
      }))
      fetchCsrfToken()
    }
  }, [open, existingTrackingNumber, existingSenderName])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.item_name || !formData.sender_name || !formData.shipment_type || !formData.warehouse_quantity) {
        toast.error("يرجى ملء جميع الحقول المطلوبة")
        setIsLoading(false)
        return
      }

      const itemToAdd = {
        item_name: formData.item_name,
        sender_name: formData.sender_name,
        shipment_type: formData.shipment_type,
        warehouse_quantity: Number.parseFloat(formData.warehouse_quantity),
        delivered_quantity: Number.parseFloat(formData.delivered_quantity || "0"),
        tracking_number: formData.tracking_number || null,
      }

      const result = await addWarehouseItem(itemToAdd, inventoryName, csrfToken)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("تم إضافة الصنف بنجاح")

      setFormData({
        item_name: "",
        sender_name: "",
        shipment_type: "",
        warehouse_quantity: "",
        delivered_quantity: "0",
        tracking_number: existingTrackingNumber || "",
      })

      onOpenChange(false)
      onItemAdded()
    } catch (error) {
      console.error("Error adding warehouse item:", error)
      toast.error("حدث خطأ أثناء إضافة الصنف")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-effect">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">إضافة صنف جديد</DialogTitle>
          <p className="text-sm text-muted-foreground">المخزون: {inventoryName}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item_name">اسم الصنف *</Label>
            <Input
              id="item_name"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              placeholder="أدخل اسم الصنف"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender_name">اسم المرسل *</Label>
            <Input
              id="sender_name"
              value={formData.sender_name}
              onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
              placeholder="أدخل اسم المرسل"
              readOnly={!!existingSenderName}
              className={existingSenderName ? "bg-muted" : ""}
              required
            />
            {existingSenderName && (
              <p className="text-xs text-muted-foreground">اسم المرسل مأخوذ من الأصناف الموجودة في نفس المخزون</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipment_type">نوع الصنف *</Label>
            <Select
              value={formData.shipment_type}
              onValueChange={(value) => setFormData({ ...formData, shipment_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الصنف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight">وزن</SelectItem>
                <SelectItem value="count">عدد</SelectItem>
                <SelectItem value="طرود">طرود</SelectItem>
                <SelectItem value="مستندات">مستندات</SelectItem>
                <SelectItem value="بضائع">بضائع</SelectItem>
                <SelectItem value="أثاث">أثاث</SelectItem>
                <SelectItem value="إلكترونيات">إلكترونيات</SelectItem>
                <SelectItem value="أخرى">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse_quantity">الكمية المستلمة *</Label>
              <Input
                id="warehouse_quantity"
                type="number"
                step="0.01"
                min="0"
                value={formData.warehouse_quantity}
                onChange={(e) => setFormData({ ...formData, warehouse_quantity: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivered_quantity">الكمية المسلمة</Label>
              <Input
                id="delivered_quantity"
                type="number"
                step="0.01"
                min="0"
                value={formData.delivered_quantity}
                onChange={(e) => setFormData({ ...formData, delivered_quantity: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking_number">رقم التتبع</Label>
            <Input
              id="tracking_number"
              value={formData.tracking_number}
              onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
              placeholder="رقم التتبع من الأصناف الموجودة"
              readOnly={!!existingTrackingNumber}
              className={existingTrackingNumber ? "bg-muted" : ""}
            />
            {existingTrackingNumber && (
              <p className="text-xs text-muted-foreground">رقم التتبع مأخوذ من الأصناف الموجودة في نفس المخزون</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading} className="gradient-primary">
              {isLoading ? "جاري الحفظ..." : "إضافة الصنف"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
