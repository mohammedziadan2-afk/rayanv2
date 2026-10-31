"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Plus, Minus } from "lucide-react"
import { updateWarehouseItem } from "@/app/actions/warehouse"

interface WarehouseItem {
  id: string
  shipment_name: string
  sender_name: string
  shipment_type: string
  warehouse_quantity: number
  delivered_quantity: number
  remaining_quantity: number
  tracking_number?: string
}

interface QuickQuantityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuantityUpdated: () => void
  item: WarehouseItem | null
  type: "received" | "delivered"
}

export function QuickQuantityDialog({ open, onOpenChange, onQuantityUpdated, item, type }: QuickQuantityDialogProps) {
  const [quantity, setQuantity] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || !quantity) return

    const addedQuantity = Number.parseFloat(quantity)
    if (isNaN(addedQuantity) || addedQuantity <= 0) {
      toast.error("الرجاء إدخال كمية صحيحة")
      return
    }

    setIsSubmitting(true)

    try {
      const oldQuantity = type === "received" ? item.warehouse_quantity : item.delivered_quantity
      const newQuantity = oldQuantity + addedQuantity

      const updateData = type === "received" ? { warehouse_quantity: newQuantity } : { delivered_quantity: newQuantity }

      const result = await updateWarehouseItem(item.id, updateData)

      if (!result.success) {
        throw new Error(result.error || "فشل التحديث")
      }

      toast.success(
        type === "received"
          ? `تم إضافة ${addedQuantity} إلى الكمية المستلمة`
          : `تم إضافة ${addedQuantity} إلى الكمية المسلمة`,
      )

      onQuantityUpdated()
      onOpenChange(false)
      setQuantity("")
    } catch (error: any) {
      console.error("[v0] Error updating quantity:", error)
      toast.error(error.message || "حدث خطأ أثناء تحديث الكمية")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setQuantity("")
    onOpenChange(false)
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "received" ? (
              <>
                <Plus className="w-5 h-5 text-primary" />
                إضافة كمية مستلمة
              </>
            ) : (
              <>
                <Minus className="w-5 h-5 text-accent" />
                إضافة كمية مسلمة
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm font-medium">{item.sender_name}</p>
            <p className="text-xs text-muted-foreground">{item.shipment_type}</p>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <span className="text-xs text-muted-foreground">الكمية الحالية: </span>
                <span className="font-bold">
                  {type === "received" ? item.warehouse_quantity : item.delivered_quantity}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">{type === "received" ? "الكمية المضافة للمستلم" : "الكمية المضافة للمسلم"}</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="أدخل الكمية"
              required
              autoFocus
            />
          </div>

          {quantity && Number.parseFloat(quantity) > 0 && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm">
                <span className="text-muted-foreground">الإجمالي الجديد: </span>
                <span className="font-bold text-primary">
                  {(type === "received" ? item.warehouse_quantity : item.delivered_quantity) +
                    Number.parseFloat(quantity)}
                </span>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting || !quantity}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
