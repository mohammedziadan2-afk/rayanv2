"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { updateWarehouseItem } from "@/app/actions/warehouse"

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
  const [csrfToken, setCsrfToken] = useState<string>("")
  const [formData, setFormData] = useState({
    shipment_name: "",
    sender_name: "",
    shipment_type: "",
    add_received_quantity: "0",
    add_delivered_quantity: "0",
    tracking_number: "",
  })

  const supabase = createClient()

  useEffect(() => {
    if (open) {
      fetchShipments()
      fetchCsrfToken()
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

  useEffect(() => {
    if (item) {
      setFormData({
        shipment_name: item.shipment_name,
        sender_name: item.sender_name,
        shipment_type: item.shipment_type,
        add_received_quantity: "0",
        add_delivered_quantity: "0",
        tracking_number: item.tracking_number || "",
      })
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return

    setIsLoading(true)

    try {
      const addedReceivedQty = Number.parseFloat(formData.add_received_quantity || "0")
      const addedDeliveredQty = Number.parseFloat(formData.add_delivered_quantity || "0")

      const newReceivedQty = item.warehouse_quantity + addedReceivedQty
      const newDeliveredQty = item.delivered_quantity + addedDeliveredQty

      const result = await updateWarehouseItem(
        item.id,
        {
          shipment_name: formData.shipment_name,
          sender_name: formData.sender_name,
          shipment_type: formData.shipment_type,
          warehouse_quantity: newReceivedQty,
          delivered_quantity: newDeliveredQty,
          tracking_number: formData.tracking_number || null,
        },
        csrfToken,
      )

      if (!result.success) {
        throw new Error(result.error || "فشل التحديث")
      }

      toast.success("تم تحديث الشحنة بنجاح")
      onOpenChange(false)
      onItemUpdated()
    } catch (error: any) {
      console.error("[v0] Error updating warehouse item:", error)
      toast.error(error.message || "حدث خطأ أثناء تحديث الشحنة")
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
          <DialogTitle className="text-xl font-bold">تعديل بيانات الصنف</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {item && (
            <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">الكمية المستلمة الحالية:</span>
                <span className="font-semibold">{item.warehouse_quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الكمية المسلمة الحالية:</span>
                <span className="font-semibold">{item.delivered_quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الكمية المتبقية:</span>
                <span className="font-semibold">{item.warehouse_quantity - item.delivered_quantity}</span>
              </div>
            </div>
          )}

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
            <Label htmlFor="edit_sender_name">اسم الصنف</Label>
            <Input
              id="edit_sender_name"
              value={formData.sender_name}
              onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
              placeholder="أدخل اسم الصنف"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_shipment_type">طبيعة الصنف</Label>
            <Select
              value={formData.shipment_type}
              onValueChange={(value) => setFormData({ ...formData, shipment_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر طبيعة الصنف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="وزن">وزن (كجم)</SelectItem>
                <SelectItem value="لتر">لتر</SelectItem>
                <SelectItem value="عدد">عدد</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add_received_quantity">إضافة كمية مستلمة</Label>
              <Input
                id="add_received_quantity"
                type="number"
                step="0.01"
                value={formData.add_received_quantity}
                onChange={(e) => setFormData({ ...formData, add_received_quantity: e.target.value })}
                placeholder="0"
              />
              {item && Number.parseFloat(formData.add_received_quantity || "0") !== 0 && (
                <p className="text-xs text-muted-foreground">
                  الإجمالي الجديد: {item.warehouse_quantity + Number.parseFloat(formData.add_received_quantity || "0")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add_delivered_quantity">إضافة كمية مسلمة</Label>
              <Input
                id="add_delivered_quantity"
                type="number"
                step="0.01"
                value={formData.add_delivered_quantity}
                onChange={(e) => setFormData({ ...formData, add_delivered_quantity: e.target.value })}
                placeholder="0"
              />
              {item && Number.parseFloat(formData.add_delivered_quantity || "0") !== 0 && (
                <p className="text-xs text-muted-foreground">
                  الإجمالي الجديد: {item.delivered_quantity + Number.parseFloat(formData.add_delivered_quantity || "0")}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading} className="gradient-primary">
              {isLoading ? "جاري التحديث..." : "حفظ التعديلات"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
