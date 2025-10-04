"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, User, TrendingUp, TrendingDown, Trash2, Pencil, Printer, Eye } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "sonner"
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
import { EditWarehouseItemDialog } from "./edit-warehouse-item-dialog"
import { PrintWarehouseItem } from "./print-warehouse-item"
import { PreviewWarehouseItemDialog } from "./preview-warehouse-item-dialog"

interface WarehouseItem {
  id: string
  shipment_name: string
  sender_name: string
  shipment_type: string
  warehouse_quantity: number
  delivered_quantity: number
  remaining_quantity: number
  tracking_number?: string
  created_at: string
}

export function WarehouseList() {
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<WarehouseItem | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [printItem, setPrintItem] = useState<WarehouseItem | null>(null)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<WarehouseItem | null>(null)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("warehouse_inventory")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error("Error fetching warehouse items:", error)
      toast.error("حدث خطأ أثناء تحميل البيانات")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const { error } = await supabase.from("warehouse_inventory").delete().eq("id", deleteId)

      if (error) throw error

      toast.success("تم حذف الشحنة بنجاح")
      fetchItems()
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("حدث خطأ أثناء حذف الشحنة")
    } finally {
      setDeleteId(null)
    }
  }

  const handleEdit = (item: WarehouseItem) => {
    setEditItem(item)
    setIsEditDialogOpen(true)
  }

  const handlePrint = (item: WarehouseItem) => {
    setPrintItem(item)
    setIsPrintDialogOpen(true)
  }

  const handlePreview = (item: WarehouseItem) => {
    setPreviewItem(item)
    setIsPreviewDialogOpen(true)
  }

  useEffect(() => {
    fetchItems()
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 glass-effect animate-pulse">
            <div className="h-6 bg-muted rounded mb-4" />
            <div className="h-4 bg-muted rounded mb-2" />
            <div className="h-4 bg-muted rounded" />
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="p-12 text-center glass-effect">
        <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">لا توجد شحنات في المستودع</h3>
        <p className="text-muted-foreground">ابدأ بإضافة شحنة جديدة للمستودع</p>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="p-6 glass-effect hover:shadow-glow transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg gradient-primary">
                  <Package className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{item.shipment_name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {item.shipment_type}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePreview(item)}
                  className="text-blue-600 hover:text-blue-600 hover:bg-blue-600/10"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePrint(item)}
                  className="text-green-600 hover:text-green-600 hover:bg-green-600/10"
                >
                  <Printer className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(item)}
                  className="text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(item.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">المرسل:</span>
                <span className="font-medium">{item.sender_name}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>المستودع</span>
                  </div>
                  <p className="text-lg font-bold text-primary">{item.warehouse_quantity}</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                    <TrendingDown className="w-3 h-3" />
                    <span>المسلم</span>
                  </div>
                  <p className="text-lg font-bold text-accent">{item.delivered_quantity}</p>
                </div>

                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">المتبقي</div>
                  <p className="text-lg font-bold text-foreground">{item.remaining_quantity}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PreviewWarehouseItemDialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen} item={previewItem} />

      <EditWarehouseItemDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onItemUpdated={fetchItems}
        item={editItem}
      />

      <PrintWarehouseItem open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen} item={printItem} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذه الشحنة من المستودع بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
