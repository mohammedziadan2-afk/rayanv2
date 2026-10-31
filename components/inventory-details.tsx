"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Trash2, Pencil, Printer, TrendingUp, TrendingDown, History, Plus, Minus, Eye } from "lucide-react"
import {
  getWarehouseItemsByName,
  getWarehouseEditHistory,
  deleteWarehouseItem,
  deleteWarehouseInventory,
  addWarehouseItem,
} from "@/app/actions/warehouse"
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
import { QuickQuantityDialog } from "./quick-quantity-dialog"
import { PreviewWarehouseItemDialog } from "./preview-warehouse-item-dialog"
import { AddWarehouseItemToInventoryDialog } from "./add-warehouse-item-to-inventory-dialog"

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

interface EditHistory {
  id: string
  edit_type: string
  old_quantity: number
  new_quantity: number
  edited_at: string
}

interface InventoryDetailsProps {
  inventoryName: string
  onBack: () => void
}

export function InventoryDetails({ inventoryName, onBack }: InventoryDetailsProps) {
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteInventoryDialog, setShowDeleteInventoryDialog] = useState(false)
  const [editItem, setEditItem] = useState<WarehouseItem | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [shipmentDate, setShipmentDate] = useState<string | null>(null)
  const [editHistory, setEditHistory] = useState<Record<string, EditHistory[]>>({})
  const [quickEditItem, setQuickEditItem] = useState<{ item: WarehouseItem; type: "received" | "delivered" } | null>(
    null,
  )
  const [isQuickDialogOpen, setIsQuickDialogOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<WarehouseItem | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string>("")

  const fetchItems = async () => {
    try {
      const result = await getWarehouseItemsByName(inventoryName)

      if (!result.success) {
        throw new Error(result.error)
      }

      setItems(result.data || [])

      if (result.data && result.data.length > 0) {
        const itemIds = result.data.map((item: any) => item.id)
        const historyResult = await getWarehouseEditHistory(itemIds)

        if (historyResult.success && historyResult.data) {
          const historyByItem: Record<string, EditHistory[]> = {}
          historyResult.data.forEach((history: any) => {
            if (!historyByItem[history.warehouse_item_id]) {
              historyByItem[history.warehouse_item_id] = []
            }
            historyByItem[history.warehouse_item_id].push(history)
          })
          setEditHistory(historyByItem)
        }
      }
    } catch (error) {
      console.error("Error fetching inventory items:", error)
      toast.error("حدث خطأ أثناء تحميل البيانات")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const result = await deleteWarehouseItem(deleteId, csrfToken)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("تم حذف الصنف بنجاح")
      fetchItems()
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("حدث خطأ أثناء حذف الصنف")
    } finally {
      setDeleteId(null)
    }
  }

  const handleEdit = (item: WarehouseItem) => {
    setEditItem(item)
    setIsEditDialogOpen(true)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleQuickEdit = (item: WarehouseItem, type: "received" | "delivered") => {
    setQuickEditItem({ item, type })
    setIsQuickDialogOpen(true)
  }

  const handleDeleteInventory = async () => {
    try {
      const result = await deleteWarehouseInventory(inventoryName)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("تم حذف المخزون بنجاح")
      window.location.href = "/warehouse"
    } catch (error) {
      console.error("Error deleting inventory:", error)
      toast.error("حدث خطأ أثناء حذف المخزون")
    } finally {
      setShowDeleteInventoryDialog(false)
    }
  }

  const handlePrintItem = (item: WarehouseItem) => {
    const itemHistory = editHistory[item.id] || []

    const printWindow = window.open("", "_blank", "width=800,height=600")
    if (!printWindow) {
      toast.error("لم نتمكن من فتح نافذة الطباعة")
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>سجل تعديلات الصنف - ${item.sender_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 20px;
            direction: rtl;
            font-size: 10px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
          }
          .header p {
            color: #666;
            font-size: 10px;
          }
          .info-section { 
            margin: 15px 0; 
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
          }
          .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 5px 0;
            padding: 4px 0;
            border-bottom: 1px solid #e0e0e0;
            font-size: 9px;
          }
          .info-label { 
            font-weight: bold; 
            color: #333;
          }
          .info-value { 
            color: #666;
          }
          .item-details {
            margin: 15px 0;
            padding: 10px;
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
          }
          .item-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2563eb;
          }
          .quantities {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 10px 0;
          }
          .quantity-box {
            padding: 8px;
            border-radius: 4px;
            text-align: center;
          }
          .quantity-box.received { background: #dbeafe; }
          .quantity-box.delivered { background: #fef3c7; }
          .quantity-box.remaining { background: #f3f4f6; }
          .quantity-label {
            font-size: 8px;
            color: #666;
            margin-bottom: 4px;
          }
          .quantity-value {
            font-size: 14px;
            font-weight: bold;
            color: #333;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0;
            font-size: 9px;
          }
          th, td { 
            padding: 6px; 
            text-align: right; 
            border: 1px solid #ddd;
          }
          th { 
            background: #2563eb; 
            color: white; 
            font-weight: bold;
            font-size: 9px;
          }
          tr:nth-child(even) { 
            background: #f8f9fa;
          }
          .positive { 
            color: #16a34a; 
            font-weight: bold;
          }
          .negative { 
            color: #dc2626; 
            font-weight: bold;
          }
          h2 {
            font-size: 11px;
            margin: 15px 0 10px;
            color: #333;
          }
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 8px;
          }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>شركة الريان واريان للخدمات اللوجستية</h1>
          <p>سجل تعديلات الصنف</p>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">رقم التتبع:</span>
            <span class="info-value">${item.tracking_number || "غير متوفر"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">اسم المخزون:</span>
            <span class="info-value">${inventoryName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">تاريخ الطباعة:</span>
            <span class="info-value">${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        <div class="item-details">
          <div class="item-title">${item.sender_name}</div>
          <div class="info-row">
            <span class="info-label">نوع الصنف:</span>
            <span class="info-value">${item.shipment_type}</span>
          </div>
          
          <div class="quantities">
            <div class="quantity-box received">
              <div class="quantity-label">الكمية المستلمة</div>
              <div class="quantity-value">${item.warehouse_quantity}</div>
            </div>
            <div class="quantity-box delivered">
              <div class="quantity-label">الكمية المسلمة</div>
              <div class="quantity-value">${item.delivered_quantity}</div>
            </div>
            <div class="quantity-box remaining">
              <div class="quantity-label">الكمية المتبقية</div>
              <div class="quantity-value">${item.remaining_quantity}</div>
            </div>
          </div>
        </div>

        ${
          itemHistory.length > 0
            ? `
        <h2>سجل التعديلات</h2>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>نوع التعديل</th>
              <th>الكمية المضافة</th>
              <th>الكمية قبل التعديل</th>
              <th>الكمية بعد التعديل</th>
            </tr>
          </thead>
          <tbody>
            ${itemHistory
              .map((history) => {
                const quantityChange = history.new_quantity - history.old_quantity
                const changeClass = quantityChange >= 0 ? "positive" : "negative"
                const changeSign = quantityChange >= 0 ? "+" : ""
                return `
              <tr>
                <td>${new Date(history.edited_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                <td>${history.edit_type === "received" ? "كمية مستلمة" : "كمية مسلمة"}</td>
                <td class="${changeClass}">${changeSign}${quantityChange}</td>
                <td>${history.old_quantity}</td>
                <td>${history.new_quantity}</td>
              </tr>
            `
              })
              .join("")}
          </tbody>
        </table>
        `
            : '<p style="text-align: center; color: #666; margin: 15px 0; font-size: 9px;">لا توجد تعديلات مسجلة لهذا الصنف</p>'
        }

        <div class="footer">
          <p>شركة الريان واريان للخدمات اللوجستية - هاتف: 0791083443</p>
          <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>

      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 300)

    printWindow.onafterprint = () => {
      printWindow.close()
    }
  }

  const handlePreview = () => {
    setIsPreviewOpen(true)
  }

  const handleAddItem = async (newItem: WarehouseItem) => {
    try {
      const result = await addWarehouseItem(newItem, inventoryName, csrfToken)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("تم إضافة الصنف بنجاح")
      fetchItems()
    } catch (error) {
      console.error("Error adding item:", error)
      toast.error("حدث خطأ أثناء إضافة الصنف")
    } finally {
      setIsAddItemDialogOpen(false)
    }
  }

  const totalReceived = items.reduce((sum, item) => sum + item.warehouse_quantity, 0)
  const totalDelivered = items.reduce((sum, item) => sum + item.delivered_quantity, 0)
  const totalRemaining = items.reduce((sum, item) => sum + item.remaining_quantity, 0)

  useEffect(() => {
    fetchItems()

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
    fetchCsrfToken()
  }, [inventoryName])

  if (isLoading) {
    return <div className="text-center py-12">جاري التحميل...</div>
  }

  if (items.length === 0) {
    return (
      <Card className="p-12 text-center glass-effect">
        <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">لا توجد أصناف في هذا المخزون</h3>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6 glass-effect">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">معلومات المخزون</h2>
          <div className="flex gap-2">
            <Button onClick={onBack} variant="outline" className="gap-2 bg-transparent">
              رجوع
            </Button>
            <Button
              onClick={() => setShowDeleteInventoryDialog(true)}
              variant="outline"
              className="gap-2 bg-transparent text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
              حذف المخزون
            </Button>
            <Button onClick={handlePrint} variant="outline" className="gap-2 bg-transparent">
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-primary/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>إجمالي المستلم</span>
            </div>
            <p className="text-3xl font-bold text-primary">{totalReceived}</p>
          </div>

          <div className="p-4 rounded-lg bg-accent/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingDown className="w-4 h-4" />
              <span>إجمالي المسلم</span>
            </div>
            <p className="text-3xl font-bold text-accent">{totalDelivered}</p>
          </div>

          <div className="p-4 rounded-lg bg-muted">
            <div className="text-sm text-muted-foreground mb-2">إجمالي المتبقي</div>
            <p className="text-3xl font-bold">{totalRemaining}</p>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center gap-4 flex-wrap">
            {items[0]?.tracking_number && (
              <div>
                <span className="text-sm text-muted-foreground">رقم التتبع: </span>
                <span className="font-medium">{items[0].tracking_number}</span>
              </div>
            )}
            {shipmentDate && (
              <div>
                <span className="text-sm text-muted-foreground">تاريخ الشحنة: </span>
                <span className="font-medium">{new Date(shipmentDate).toLocaleDateString("ar-EG")}</span>
              </div>
            )}
          </div>
          <div>
            <span className="text-xl font-bold">{inventoryName}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">الأصناف ({items.length})</h3>
            <Button
              onClick={() => setIsAddItemDialogOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
            >
              <Plus className="w-4 h-4" />
              إضافة صنف
            </Button>
          </div>

          <div className="grid gap-4">
            {items.map((item) => (
              <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-bold text-lg">{item.sender_name}</h4>
                      <Badge variant="secondary">{item.shipment_type}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">الكمية المستلمة</p>
                        <p className="text-2xl font-bold text-primary mb-2">{item.warehouse_quantity}</p>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 border-primary/20"
                          onClick={() => handleQuickEdit(item, "received")}
                        >
                          <Plus className="w-4 h-4 text-primary" />
                        </Button>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">الكمية المسلمة</p>
                        <p className="text-2xl font-bold text-accent mb-2">{item.delivered_quantity}</p>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-full bg-accent/10 hover:bg-accent/20 border-accent/20"
                          onClick={() => handleQuickEdit(item, "delivered")}
                        >
                          <Minus className="w-4 h-4 text-accent" />
                        </Button>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">الكمية المتبقية</p>
                        <p className="text-2xl font-bold">{item.remaining_quantity}</p>
                      </div>
                    </div>

                    {editHistory[item.id] && editHistory[item.id].length > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <History className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">سجل التعديلات</span>
                        </div>
                        <div className="space-y-2">
                          {editHistory[item.id].slice(0, 3).map((history) => {
                            const quantityChange = history.new_quantity - history.old_quantity
                            const changeSign = quantityChange >= 0 ? "+" : ""
                            const changeColor = quantityChange >= 0 ? "text-primary" : "text-accent"

                            return (
                              <div key={history.id} className="text-sm flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  {history.edit_type === "received" ? "كمية مستلمة" : "كمية مسلمة"}:{" "}
                                  <span className={`font-bold ${changeColor}`}>
                                    {changeSign}
                                    {quantityChange}
                                  </span>
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(history.edited_at).toLocaleDateString("ar-EG", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePreview()}
                      className="text-green-600 hover:text-green-600 hover:bg-green-50"
                      title="معاينة التفاصيل"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrintItem(item)}
                      className="text-blue-600 hover:text-blue-600 hover:bg-blue-50"
                      title="طباعة سجل التعديلات"
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
              </Card>
            ))}
          </div>
        </div>
      </Card>

      <EditWarehouseItemDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onItemUpdated={fetchItems}
        item={editItem}
      />

      <QuickQuantityDialog
        open={isQuickDialogOpen}
        onOpenChange={setIsQuickDialogOpen}
        onQuantityUpdated={fetchItems}
        item={quickEditItem?.item || null}
        type={quickEditItem?.type || "received"}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا الصنف من المخزون بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
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

      <AlertDialog open={showDeleteInventoryDialog} onOpenChange={setShowDeleteInventoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف المخزون بالكامل؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف جميع الأصناف (${items.length} صنف) في هذا المخزون بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInventory} className="bg-destructive text-destructive-foreground">
              حذف المخزون
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PreviewWarehouseItemDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        items={items}
        editHistory={editHistory}
        inventoryName={inventoryName}
      />

      <AddWarehouseItemToInventoryDialog
        open={isAddItemDialogOpen}
        onOpenChange={setIsAddItemDialogOpen}
        onItemAdded={fetchItems}
        inventoryName={inventoryName}
        existingTrackingNumber={items.length > 0 ? items[0].tracking_number : undefined}
        existingSenderName={items.length > 0 ? items[0].sender_name : undefined}
      />
    </>
  )
}
