"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Plus, Trash2 } from "lucide-react"
import {
  getWarehouseItems,
  updateInventoryQuantity,
  deleteWarehouseItem,
  getWarehouseMovements,
} from "@/app/actions/warehouse"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { AdminFooter } from "@/components/admin-footer"

interface WarehouseItem {
  id: number
  item_name: string
  quantity: number
  unit: string
  location: string
  notes: string
  warehouse_name: string
  received_quantity: number
  delivered_quantity: number
  created_at: string
}

interface WarehouseMovement {
  id: number
  warehouse_name: string
  item_name: string
  movement_type: string
  quantity: number
  previous_quantity: number
  new_quantity: number
  notes: string
  created_at: string
}

interface WarehouseDetailsClientProps {
  warehouseName: string
}

export function WarehouseDetailsClient({ warehouseName }: WarehouseDetailsClientProps) {
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null)
  const [movements, setMovements] = useState<WarehouseMovement[]>([])
  const [showMovements, setShowMovements] = useState(false)
  const [quantityDialog, setQuantityDialog] = useState<{
    open: boolean
    itemId: number | null
    type: "received" | "delivered" | null
    itemName: string
  }>({
    open: false,
    itemId: null,
    type: null,
    itemName: "",
  })
  const [quantityInput, setQuantityInput] = useState("")
  const router = useRouter()

  const fetchItems = async () => {
    try {
      console.log("[v0] Fetching items for warehouse:", warehouseName)
      const result = await getWarehouseItems(warehouseName)

      if (!result.success) {
        throw new Error(result.error)
      }

      console.log("[v0] Fetched warehouse items:", result.data)
      setItems(result.data || [])
    } catch (error) {
      console.error("[v0] Error fetching warehouse items:", error)
      toast.error("حدث خطأ أثناء تحميل الأصناف")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMovements = async () => {
    try {
      const result = await getWarehouseMovements(warehouseName)
      if (result.success) {
        setMovements(result.data || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching movements:", error)
    }
  }

  const handleQuantityChange = async () => {
    if (!quantityDialog.itemId || !quantityDialog.type || !quantityInput) {
      toast.error("الرجاء إدخال الكمية")
      return
    }

    const quantity = Number.parseFloat(quantityInput)
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("الرجاء إدخال كمية صحيحة")
      return
    }

    try {
      const result = await updateInventoryQuantity(quantityDialog.itemId, quantityDialog.type, quantity)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("تم تحديث الكمية بنجاح")
      await fetchItems()
      await fetchMovements()
      setQuantityDialog({ open: false, itemId: null, type: null, itemName: "" })
      setQuantityInput("")
    } catch (error) {
      console.error("[v0] Error updating quantity:", error)
      toast.error("حدث خطأ أثناء تحديث الكمية")
    }
  }

  const openQuantityDialog = (itemId: number, type: "received" | "delivered", itemName: string) => {
    setQuantityDialog({ open: true, itemId, type, itemName })
    setQuantityInput("")
  }

  const handleDeleteItem = async (itemId: number) => {
    try {
      const result = await deleteWarehouseItem(itemId)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("تم حذف الصنف بنجاح")
      await fetchItems()
    } catch (error) {
      console.error("[v0] Error deleting item:", error)
      toast.error("حدث خطأ أثناء حذف الصنف")
    } finally {
      setDeleteItemId(null)
    }
  }

  useEffect(() => {
    fetchItems()
    fetchMovements()
  }, [warehouseName])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="glass-effect">
          <CardHeader className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3" />
          </CardHeader>
        </Card>
      </div>
    )
  }

  const totalReceived = items.reduce((sum, item) => sum + Number(item.received_quantity || 0), 0)
  const totalDelivered = items.reduce((sum, item) => sum + Number(item.delivered_quantity || 0), 0)
  const totalRemaining = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="glass-effect p-4 sm:p-6 rounded-xl border-2 border-primary/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 sm:p-3 rounded-xl gradient-primary shadow-glow">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">تفاصيل المخزون</h1>
              <p className="text-sm sm:text-base text-muted-foreground truncate">{warehouseName}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full sm:w-auto bg-transparent"
            onClick={() => setShowMovements(!showMovements)}
          >
            {showMovements ? "إخفاء الحركات" : "عرض الحركات"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="glass-effect border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">إجمالي المستلم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary">{totalReceived.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">إجمالي المسلم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-accent">{totalDelivered.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-2 border-foreground/20 bg-gradient-to-br from-muted/50 to-muted">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">إجمالي المتبقي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{totalRemaining.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {showMovements && (
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>تفاصيل حركات المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد حركات مسجلة</p>
              ) : (
                <div className="space-y-3">
                  {movements.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{movement.item_name}</div>
                        <div className="text-sm text-muted-foreground">{movement.notes}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(movement.created_at).toLocaleString("ar-EG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge variant={movement.movement_type === "received" ? "default" : "secondary"}>
                          {movement.movement_type === "received" ? "مستلم" : "مسلم"}
                        </Badge>
                        <div className="text-sm mt-2">
                          <span className="text-muted-foreground">الكمية: </span>
                          <span className="font-semibold">{Number(movement.quantity).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Number(movement.previous_quantity).toFixed(2)} ← {Number(movement.new_quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {items.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center glass-effect">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">لا توجد أصناف في هذا المخزون</h3>
            <p className="text-sm sm:text-base text-muted-foreground">ابدأ بإضافة أصناف جديدة</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {items.map((item) => (
              <Card key={item.id} className="glass-effect hover:shadow-glow transition-all border-2 border-primary/10">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl mb-2 truncate">{item.item_name}</CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {item.unit}
                        </Badge>
                        {item.location && (
                          <Badge variant="secondary" className="text-xs">
                            {item.location}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive flex-shrink-0"
                      onClick={() => setDeleteItemId(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {item.notes && <p className="text-xs sm:text-sm text-muted-foreground mt-2">{item.notes}</p>}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground text-center">
                        الكمية المستلمة
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-2xl sm:text-3xl font-bold text-primary">
                          {Number(item.received_quantity || 0).toFixed(2)}
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          className="bg-primary/10 hover:bg-primary/20 border-primary/30"
                          onClick={() => openQuantityDialog(item.id, "received", item.item_name)}
                        >
                          <Plus className="w-4 h-4 text-primary" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground text-center">
                        الكمية المسلمة
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-2xl sm:text-3xl font-bold text-accent">
                          {Number(item.delivered_quantity || 0).toFixed(2)}
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          className="bg-accent/10 hover:bg-accent/20 border-accent/30"
                          onClick={() => openQuantityDialog(item.id, "delivered", item.item_name)}
                        >
                          <Plus className="w-4 h-4 text-accent" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 p-3 rounded-lg bg-muted border border-foreground/10">
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground text-center">
                        الكمية المتبقية
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-center">
                        {Number(item.quantity || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog
          open={quantityDialog.open}
          onOpenChange={(open) => !open && setQuantityDialog({ open: false, itemId: null, type: null, itemName: "" })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{quantityDialog.type === "received" ? "إضافة كمية مستلمة" : "إضافة كمية مسلمة"}</DialogTitle>
              <DialogDescription>{quantityDialog.itemName}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">الكمية</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="أدخل الكمية"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleQuantityChange()
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setQuantityDialog({ open: false, itemId: null, type: null, itemName: "" })}
              >
                إلغاء
              </Button>
              <Button onClick={handleQuantityChange}>{quantityDialog.type === "received" ? "إضافة" : "تسليم"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteItemId !== null} onOpenChange={() => setDeleteItemId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteItemId && handleDeleteItem(deleteItemId)}>حذف</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <AdminFooter backUrl="/warehouse" backLabel="المستودع" />
    </div>
  )
}

export default WarehouseDetailsClient
