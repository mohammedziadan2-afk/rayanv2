"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createBrowserClient } from "@supabase/ssr"

interface WarehouseItem {
  id: string
  shipment_name: string
  sender_name: string
  shipment_type: string
  warehouse_quantity: number
  delivered_quantity: number
  tracking_number?: string
}

interface EditWarehouseItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemUpdated: () => void
  item: WarehouseItem | null
}

interface Shipment {
  id: string
  customer_name: string
  received_date: string | null
  delivery_date: string | null
}

export function EditWarehouseItemDialog({ open, onOpenChange, onItemUpdated, item }: EditWarehouseItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [shipments, setShipments] = useState<Shipment[]>([])
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

  useEffect(() => {
    if (open) {
      fetchShipments()
    }
  }, [open])

  const fetchShipments = async () => {
    try {
      console.log("[v0] Fetching shipments for edit dialog...")

      const { data, error } = await supabase
        .from("shipments")
        .select("id, customer_name, received_date, delivery_date")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching shipments:", error)
        throw error
      }

      console.log("[v0] Shipments fetched for edit:", data)
      setShipments(data || [])

      if (!data || data.length === 0) {
        toast.info("لا توجد شحنات متاحة للربط")
      }
    } catch (error) {
      console.error("[v0] Error in fetchShipments:", error)
      toast.error("حدث خطأ أثناء تحميل الشحنات")
    }
  }

  useEffect(() => {
    if (item) {
      setFormData({
        shipment_name: item.shipment_name,
        sender_name: item.sender_name,
        shipment_type: item.shipment_type,
        warehouse_quantity: item.warehouse_quantity.toString(),
        delivered_quantity: item.delivered_quantity.toString(),
        tracking_number: item.tracking_number || "",
      })
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("warehouse_inventory")
        .update({
          shipment_name: formData.shipment_name,
          sender_name: formData.sender_name,
          shipment_type: formData.shipment_type,
          warehouse_quantity: Number.parseFloat(formData.warehouse_quantity),
          delivered_quantity: Number.parseFloat(formData.delivered_quantity || "0"),
          tracking_number: formData.tracking_number || null,
        })
        .eq("id", item.id)

      if (error) throw error

      toast.success("تم تحديث الشحنة بنجاح")
      onOpenChange(false)
      onItemUpdated()
    } catch (error) {
      console.error("Error updating warehouse item:", error)
      toast.error("حدث خطأ أثناء تحديث الشحنة")
    } finally {
      setIsLoading(false)
    }
  }

  const formatShipmentLabel = (shipment: Shipment) => {
    const shortId = shipment.id.substring(0, 8)
    const date = shipment.received_date || shipment.delivery_date
    const dateStr = date ? new Date(date).toLocaleDateString("en-GB") : ""
    return `#${shortId} - ${shipment.customer_name}${dateStr ? ` - ${dateStr}` : ""}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-effect">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">تعديل بيانات الشحنة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_tracking_number">ربط بشحنة موجودة (اختياري)</Label>
            <Select
              value={formData.tracking_number}
              onValueChange={(value) => setFormData({ ...formData, tracking_number: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={shipments.length > 0 ? "اختر شحنة من القائمة" : "لا توجد شحنات متاحة"} />
              </SelectTrigger>
              <SelectContent>
                {shipments.length > 0 ? (
                  shipments.map((shipment) => (
                    <SelectItem key={shipment.id} value={shipment.id}>
                      {formatShipmentLabel(shipment)}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-shipments" disabled>
                    لا توجد شحنات متاحة
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_shipment_name">اسم الشحنة</Label>
            <Input
              id="edit_shipment_name"
              value={formData.shipment_name}
              onChange={(e) => setFormData({ ...formData, shipment_name: e.target.value })}
              placeholder="أدخل اسم الشحنة"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_sender_name">اسم المرسل</Label>
            <Input
              id="edit_sender_name"
              value={formData.sender_name}
              onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
              placeholder="أدخل اسم المرسل"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_shipment_type">نوع الشحنة</Label>
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
              <Label htmlFor="edit_warehouse_quantity">الكمية بالمستودع</Label>
              <Input
                id="edit_warehouse_quantity"
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
              <Label htmlFor="edit_delivered_quantity">الكمية المسلمة</Label>
              <Input
                id="edit_delivered_quantity"
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
              {isLoading ? "جاري التحديث..." : "تحديث"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
