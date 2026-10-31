"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { addWarehouseItems } from "@/app/actions/warehouse"
import { toast } from "sonner"
import { getAllShipments } from "@/app/actions/shipments"

interface InventoryItem {
  itemName: string
  receivedQuantity: number
  unitType: "weight" | "liter" | "count"
  deliveredQuantity: number
}

interface AddInventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInventoryAdded: () => void
}

export function AddInventoryDialog({ open, onOpenChange, onInventoryAdded }: AddInventoryDialogProps) {
  const [inventoryName, setInventoryName] = useState("")
  const [selectedShipment, setSelectedShipment] = useState("")
  const [items, setItems] = useState<InventoryItem[]>([
    { itemName: "", receivedQuantity: 0, unitType: "count", deliveredQuantity: 0 },
  ])
  const [shipments, setShipments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchShipments()
    }
  }, [open])

  const fetchShipments = async () => {
    const result = await getAllShipments()
    if (result.success) {
      setShipments(result.data)
    }
  }

  const addItem = () => {
    setItems([...items, { itemName: "", receivedQuantity: 0, unitType: "count", deliveredQuantity: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InventoryItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateRemaining = (received: number, delivered: number) => {
    return Math.max(0, received - delivered)
  }

  const handleSubmit = async () => {
    if (!inventoryName.trim()) {
      toast.error("الرجاء إدخال اسم المخزون")
      return
    }

    if (!selectedShipment) {
      toast.error("الرجاء اختيار الشحنة")
      return
    }

    const invalidItems = items.filter(
      (item) => !item.itemName.trim() || item.receivedQuantity < 0 || item.deliveredQuantity < 0,
    )

    if (invalidItems.length > 0) {
      toast.error("الرجاء التأكد من صحة بيانات جميع الأصناف")
      return
    }

    setIsLoading(true)

    try {
      const selectedShipmentData = shipments.find((s) => s.id === selectedShipment)

      const inventoryItems = items.map((item) => ({
        item_name: item.itemName,
        quantity: item.receivedQuantity - item.deliveredQuantity, // الكمية المتبقية في المخزن
        received_quantity: item.receivedQuantity, // الكمية المستلمة
        delivered_quantity: item.deliveredQuantity, // الكمية المسلمة
        unit: item.unitType === "weight" ? "كجم" : item.unitType === "liter" ? "لتر" : "عدد",
        location: inventoryName, // اسم المخزون كموقع
        warehouse_name: inventoryName, // اسم المستودع
        notes: `شحنة: ${selectedShipmentData?.tracking_number || selectedShipmentData?.trackingNumber || ""} - مستلم: ${item.receivedQuantity} - مُسَلم: ${item.deliveredQuantity}`,
      }))

      const result = await addWarehouseItems(inventoryItems)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success(`تم حفظ المخزون بنجاح (${items.length} صنف)`)
      onInventoryAdded()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("[v0] Error adding inventory:", error)
      toast.error("حدث خطأ أثناء حفظ المخزون")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setInventoryName("")
    setSelectedShipment("")
    setItems([{ itemName: "", receivedQuantity: 0, unitType: "count", deliveredQuantity: 0 }])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">إضافة مخزون جديد</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="inventoryName">اسم المخزون</Label>
              <Input
                id="inventoryName"
                value={inventoryName}
                onChange={(e) => setInventoryName(e.target.value)}
                placeholder="أدخل اسم المخزون"
              />
            </div>

            <div>
              <Label htmlFor="shipment">الشحنة المرتبطة</Label>
              <Select value={selectedShipment} onValueChange={setSelectedShipment}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشحنة" />
                </SelectTrigger>
                <SelectContent>
                  {shipments.map((shipment) => (
                    <SelectItem key={shipment.id} value={shipment.id}>
                      {shipment.trackingNumber} - {shipment.receiverName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">الأصناف</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
                إضافة صنف
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="font-medium">الصنف {index + 1}</span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>اسم الصنف</Label>
                    <Input
                      value={item.itemName}
                      onChange={(e) => updateItem(index, "itemName", e.target.value)}
                      placeholder="مثال: أجهزة كهربائية"
                    />
                  </div>

                  <div>
                    <Label>طبيعة الصنف</Label>
                    <Select value={item.unitType} onValueChange={(value) => updateItem(index, "unitType", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight">وزن (كجم)</SelectItem>
                        <SelectItem value="liter">لتر</SelectItem>
                        <SelectItem value="count">عدد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>الكمية المستلمة</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.receivedQuantity}
                      onChange={(e) => updateItem(index, "receivedQuantity", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <Label>الكمية المسلمة</Label>
                    <Input
                      type="number"
                      min="0"
                      max={item.receivedQuantity}
                      value={item.deliveredQuantity}
                      onChange={(e) => updateItem(index, "deliveredQuantity", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">الكمية المتبقية:</span>
                    <span className="font-bold text-lg text-primary">
                      {calculateRemaining(item.receivedQuantity, item.deliveredQuantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="gradient-primary">
              {isLoading ? "جاري الحفظ..." : "حفظ المخزون"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
