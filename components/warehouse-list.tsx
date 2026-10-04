"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Trash2 } from "lucide-react"
import { getGroupedWarehouses, deleteWarehouseInventory } from "@/app/actions/warehouse"
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

interface GroupedWarehouse {
  warehouse_name: string
  item_count: number
  total_received: number
  total_delivered: number
  total_remaining: number
}

export function WarehouseList() {
  const [warehouses, setWarehouses] = useState<GroupedWarehouse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; warehouseName: string | null }>({
    open: false,
    warehouseName: null,
  })
  const router = useRouter()

  const fetchWarehouses = async () => {
    try {
      const result = await getGroupedWarehouses()

      if (!result.success) {
        throw new Error(result.error)
      }

      console.log("[v0] Fetched grouped warehouses:", result.data)
      setWarehouses(result.data || [])
    } catch (error) {
      console.error("[v0] Error fetching warehouse items:", error)
      toast.error("حدث خطأ أثناء تحميل البيانات")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWarehouse = async () => {
    if (!deleteDialog.warehouseName) return

    try {
      const result = await deleteWarehouseInventory(deleteDialog.warehouseName)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("تم حذف المخزون بنجاح")
      setDeleteDialog({ open: false, warehouseName: null })
      fetchWarehouses() // Refresh the list
    } catch (error) {
      console.error("Error deleting warehouse:", error)
      toast.error("حدث خطأ أثناء حذف المخزون")
    }
  }

  const handleWarehouseClick = (warehouseName: string, e: React.MouseEvent) => {
    // Don't navigate if clicking on the delete button or its parent
    if ((e.target as HTMLElement).closest("button[data-delete-btn]")) {
      return
    }
    router.push(`/warehouse/${encodeURIComponent(warehouseName)}`)
  }

  useEffect(() => {
    fetchWarehouses()
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

  if (warehouses.length === 0) {
    return (
      <Card className="p-12 text-center glass-effect">
        <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">لا توجد مخزونات</h3>
        <p className="text-muted-foreground">ابدأ بإضافة مخزون جديد</p>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((warehouse) => (
          <Card
            key={warehouse.warehouse_name}
            className="p-6 glass-effect hover:shadow-glow transition-all duration-300 cursor-pointer"
            onClick={(e) => handleWarehouseClick(warehouse.warehouse_name, e)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg gradient-primary">
                  <Package className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{warehouse.warehouse_name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {warehouse.item_count} {warehouse.item_count === 1 ? "صنف" : "أصناف"}
                  </Badge>
                </div>
              </div>
              <Button
                data-delete-btn
                variant="destructive"
                size="icon"
                onClick={() => setDeleteDialog({ open: true, warehouseName: warehouse.warehouse_name })}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">المستلم</div>
                  <p className="text-lg font-bold text-primary">{Number(warehouse.total_received || 0).toFixed(2)}</p>
                </div>

                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">المسلم</div>
                  <p className="text-lg font-bold text-accent">{Number(warehouse.total_delivered || 0).toFixed(2)}</p>
                </div>

                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">المتبقي</div>
                  <p className="text-lg font-bold text-foreground">
                    {Number(warehouse.total_remaining || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, warehouseName: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من أنك تريد حذف المخزون {deleteDialog.warehouseName}؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWarehouse}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
