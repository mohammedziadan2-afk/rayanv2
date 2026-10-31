"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Link2, Plus, Trash2 } from "lucide-react"
import { SelectTrackingNumberDialog } from "./select-tracking-number-dialog"
import { Card } from "@/components/ui/card"

interface AddWarehouseItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemAdded: () => void
}

interface WarehouseLineItem {
  id: string
  item_name: string
  shipment_type: string
  warehouse_quantity: string
  delivered_quantity: string
}

export function AddWarehouseItemDialog({ open, onOpenChange, onItemAdded }: AddWarehouseItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSelectTrackingOpen, setIsSelectTrackingOpen] = useState(false)
  const [formData, setFormData] = useState({
    shipment_name: "",
    sender_name: "",
    tracking_number: "",
  })

  const [lineItems, setLineItems] = useState<WarehouseLineItem[]>([
    {
      id: crypto.randomUUID(),
      item_name: "",
      shipment_type: "",
      warehouse_quantity: "",
      delivered_quantity: "",
    },
  ])

  const supabase = createClient()

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        item_name: "",
        shipment_type: "",
        warehouse_quantity: "",
        delivered_quantity: "",
      },
    ])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) {
      toast.error("يجب أن يكون هناك بند واحد على الأقل")
      return
    }
    setLineItems(lineItems.filter((item) => item.id !== id))
  }

  const updateLineItem = (id: string, field: keyof WarehouseLineItem, value: string) => {
    setLineItems(lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const invalidItems = lineItems.filter((item) => !item.shipment_type || !item.warehouse_quantity)

      if (invalidItems.length > 0) {
        toast.error("يرجى ملء جميع الحقول المطلوبة في البنود")
        setIsLoading(false)
        return
      }

      const itemsToInsert = lineItems.map((item) => ({
        shipment_name: formData.shipment_name,
        sender_name: formData.sender_name,
        shipment_type: item.shipment_type,
        warehouse_quantity: Number.parseFloat(item.warehouse_quantity),
        delivered_quantity: Number.parseFloat(item.delivered_quantity || "0"),
        tracking_number: formData.tracking_number || null,
      }))

      const { error } = await supabase.from("warehouse_inventory").insert(itemsToInsert)

      if (error) {
        console.error("Error inserting warehouse items:", error)
        toast.error("حدث خطأ أثناء إضافة البنود")
        setIsLoading(false)
        return
      }

      toast.success(`تم حفظ المخزن بنجاح مع ${lineItems.length} بند`)

      // Reset form
      setFormData({
        shipment_name: "",
        sender_name: "",
        tracking_number: "",
      })
      setLineItems([
        {
          id: crypto.randomUUID(),
          item_name: "",
          shipment_type: "",
          warehouse_quantity: "",
          delivered_quantity: "",
        },
      ])

      onOpenChange(false)
      onItemAdded()
    } catch (error) {
      console.error("Error adding warehouse items:", error)
      toast.error("حدث خطأ أثناء إضافة البنود")
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto glass-effect">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">إضافة مخزن جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-semibold text-sm text-muted-foreground">معلومات المخزن الأساسية</h3>

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
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground">البنود</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                  className="gap-2 bg-transparent"
                >
                  <Plus className="w-4 h-4" />
                  إضافة بند
                </Button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <Card key={item.id} className="p-4 space-y-3 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">البند {index + 1}</span>
                      {lineItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>اسم البند (اختياري)</Label>
                      <Input
                        value={item.item_name}
                        onChange={(e) => updateLineItem(item.id, "item_name", e.target.value)}
                        placeholder="أدخل اسم البند"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>نوع الشحنة</Label>
                      <Select
                        value={item.shipment_type}
                        onValueChange={(value) => updateLineItem(item.id, "shipment_type", value)}
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>الكمية بالمستودع</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.warehouse_quantity}
                          onChange={(e) => updateLineItem(item.id, "warehouse_quantity", e.target.value)}
                          placeholder="0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>الكمية المسلمة</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.delivered_quantity}
                          onChange={(e) => updateLineItem(item.id, "delivered_quantity", e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading} className="gradient-primary">
                {isLoading ? "جاري الحفظ..." : "حفظ مخزن"}
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
