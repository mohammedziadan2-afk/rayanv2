"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createBrowserClient } from "@supabase/ssr"
import { Link2 } from "lucide-react"
import { SelectTrackingNumberDialog } from "./select-tracking-number-dialog"

interface AddWarehouseItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemAdded: () => void
}

export function AddWarehouseItemDialog({ open, onOpenChange, onItemAdded }: AddWarehouseItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSelectTrackingOpen, setIsSelectTrackingOpen] = useState(false)
  const [formData, setFormData] = useState({
    shipment_name: "",
    sender_name: "",
    shipment_type: "",
    warehouse_quantity: "",
    delivered_quantity: "",
    tracking_number: "",
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("warehouse_inventory").insert([
        {
          shipment_name: formData.shipment_name,
          sender_name: formData.sender_name,
          shipment_type: formData.shipment_type,
          warehouse_quantity: Number.parseFloat(formData.warehouse_quantity),
          delivered_quantity: Number.parseFloat(formData.delivered_quantity || "0"),
          tracking_number: formData.tracking_number || null,
        },
      ])

      if (error) throw error

      toast.success("تم إضافة الشحنة للمستودع بنجاح")
      setFormData({
        shipment_name: "",
        sender_name: "",
        shipment_type: "",
        warehouse_quantity: "",
        delivered_quantity: "",
        tracking_number: "",
      })
      onOpenChange(false)
      onItemAdded()
    } catch (error) {
      console.error("Error adding warehouse item:", error)
      toast.error("حدث خطأ أثناء إضافة الشحنة")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrackingNumberSelect = (trackingNumber: string) => {
    setFormData({ ...formData, tracking_number: trackingNumber })
    setIsSelectTrackingOpen(false)
    toast.success(`تم اختيار رقم التتبع: ${trackingNumber}`)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] glass-effect">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">إضافة شحنة للمستودع</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tracking_number">رقم التتبع (اختياري)</Label>
              <div className="flex gap-2">
                <Input
                  id="tracking_number"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  placeholder="اختر رقم تتبع أو أدخله يدوياً"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSelectTrackingOpen(true)}
                  className="shrink-0"
                >
                  <Link2 className="w-4 h-4 ml-2" />
                  اختيار
                </Button>
              </div>
              {formData.tracking_number && (
                <p className="text-xs text-muted-foreground">
                  رقم التتبع المختار: <span className="font-semibold text-primary">{formData.tracking_number}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipment_name">اسم الشحنة</Label>
              <Input
                id="shipment_name"
                value={formData.shipment_name}
                onChange={(e) => setFormData({ ...formData, shipment_name: e.target.value })}
                placeholder="أدخل اسم الشحنة"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender_name">اسم المرسل</Label>
              <Input
                id="sender_name"
                value={formData.sender_name}
                onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                placeholder="أدخل اسم المرسل"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipment_type">نوع الشحنة</Label>
              <Select
                value={formData.shipment_type}
                onValueChange={(value) => setFormData({ ...formData, shipment_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الشحنة" />
                </SelectTrigger>
                <SelectContent>
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
                <Label htmlFor="warehouse_quantity">الكمية بالمستودع</Label>
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

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading} className="gradient-primary">
                {isLoading ? "جاري الإضافة..." : "إضافة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SelectTrackingNumberDialog
        open={isSelectTrackingOpen}
        onOpenChange={setIsSelectTrackingOpen}
        onSelect={handleTrackingNumberSelect}
      />
    </>
  )
}
