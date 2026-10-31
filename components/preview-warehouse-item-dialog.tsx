"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, Calendar, Hash, TrendingUp, TrendingDown, History, Printer, Save, Pencil } from "lucide-react"
import { updateWarehouseEditHistory } from "@/app/actions/warehouse"
import { toast } from "sonner"

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

interface PreviewWarehouseItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: WarehouseItem[]
  editHistory: Record<string, EditHistory[]>
  inventoryName: string
}

export function PreviewWarehouseItemDialog({
  open,
  onOpenChange,
  items,
  editHistory,
  inventoryName,
}: PreviewWarehouseItemDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedHistory, setEditedHistory] = useState<Record<string, EditHistory[]>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (editHistory) {
      setEditedHistory(JSON.parse(JSON.stringify(editHistory)))
    }
  }, [editHistory])

  if (!items || items.length === 0) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleQuantityChange = (
    itemId: string,
    historyId: string,
    field: "old_quantity" | "new_quantity",
    value: string,
  ) => {
    setEditedHistory((prev) => ({
      ...prev,
      [itemId]:
        prev[itemId]?.map((h) => (h.id === historyId ? { ...h, [field]: Number.parseInt(value) || 0 } : h)) || [],
    }))
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      // Flatten all edited history into one array
      const allEditedHistory = Object.values(editedHistory).flat()
      const result = await updateWarehouseEditHistory(allEditedHistory)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("تم حفظ التعديلات بنجاح")
      setIsEditing(false)
    } catch (error) {
      console.error("[v0] Error saving edit history:", error)
      toast.error("حدث خطأ أثناء حفظ التعديلات")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) {
      toast.error("لم نتمكن من فتح نافذة الطباعة")
      return
    }

    const totalReceived = items.reduce((sum, item) => sum + item.warehouse_quantity, 0)
    const totalDelivered = items.reduce((sum, item) => sum + item.delivered_quantity, 0)
    const totalRemaining = items.reduce((sum, item) => sum + item.remaining_quantity, 0)

    const itemsHtml = items
      .map((item) => {
        const itemHistory = editedHistory[item.id] || []
        const historyHtml = itemHistory
          .map((history) => {
            const quantityChange = history.new_quantity - history.old_quantity
            const changeClass = quantityChange >= 0 ? "positive" : "negative"
            const changeSign = quantityChange >= 0 ? "+" : ""
            const badgeClass = history.edit_type === "received" ? "badge-received" : "badge-delivered"
            return `
              <tr>
                <td>${formatDate(history.edited_at)}</td>
                <td><span class="${badgeClass}">${history.edit_type === "received" ? "كمية مستلمة" : "كمية مسلمة"}</span></td>
                <td class="${changeClass}">${changeSign}${quantityChange}</td>
                <td>${history.old_quantity}</td>
                <td>${history.new_quantity}</td>
              </tr>
            `
          })
          .join("")

        return `
          <div class="item-card" style="page-break-inside: avoid;">
            <div class="item-header">
              <div class="item-title">
                ${item.sender_name}
                <span class="item-badge">${item.shipment_type}</span>
              </div>
              ${item.tracking_number ? `<div class="tracking-number">رقم التتبع: ${item.tracking_number}</div>` : ""}
            </div>
            
            <div class="quantities-grid">
              <div class="quantity-box received">
                <div class="quantity-label">المستلمة</div>
                <div class="quantity-value">${item.warehouse_quantity}</div>
              </div>
              <div class="quantity-box delivered">
                <div class="quantity-label">المسلمة</div>
                <div class="quantity-value">${item.delivered_quantity}</div>
              </div>
              <div class="quantity-box remaining">
                <div class="quantity-label">المتبقية</div>
                <div class="quantity-value">${item.remaining_quantity}</div>
              </div>
            </div>

            ${
              itemHistory.length > 0
                ? `
            <div class="history-section">
              <div class="history-title">سجل التعديلات (${itemHistory.length})</div>
              <table class="history-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>المضافة</th>
                    <th>قبل</th>
                    <th>بعد</th>
                  </tr>
                </thead>
                <tbody>
                  ${historyHtml}
                </tbody>
              </table>
            </div>
            `
                : '<div class="no-history">لا توجد تعديلات</div>'
            }
          </div>
        `
      })
      .join("")

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير المخزون - ${inventoryName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { 
            size: A4; 
            margin: 15mm;
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            direction: rtl;
            font-size: 10px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
          }
          .header h1 {
            font-size: 18px;
            color: #2563eb;
            margin-bottom: 5px;
          }
          .header p {
            color: #666;
            font-size: 10px;
          }
          .inventory-title {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 15px;
            text-align: center;
            border: 2px solid #e0e0e0;
          }
          .inventory-title h2 {
            font-size: 16px;
            color: #333;
            margin-bottom: 8px;
          }
          .totals-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .total-box {
            padding: 10px;
            border-radius: 6px;
            text-align: center;
            border: 2px solid;
          }
          .total-box.received { 
            background: #dbeafe; 
            border-color: #2563eb;
          }
          .total-box.delivered { 
            background: #fef3c7; 
            border-color: #f59e0b;
          }
          .total-box.remaining { 
            background: #f3f4f6; 
            border-color: #9ca3af;
          }
          .total-label {
            font-size: 9px;
            color: #666;
            margin-bottom: 5px;
          }
          .total-value {
            font-size: 18px;
            font-weight: bold;
            color: #333;
          }
          .item-card {
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 15px;
          }
          .item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e0e0e0;
          }
          .item-title {
            font-size: 13px;
            font-weight: bold;
            color: #2563eb;
          }
          .item-badge {
            display: inline-block;
            padding: 3px 10px;
            background: #e0e0e0;
            border-radius: 10px;
            font-size: 8px;
            margin-right: 8px;
          }
          .tracking-number {
            font-size: 9px;
            color: #666;
            font-family: monospace;
          }
          .quantities-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 10px;
          }
          .quantity-box {
            padding: 8px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid;
          }
          .quantity-box.received { 
            background: #dbeafe; 
            border-color: #2563eb;
          }
          .quantity-box.delivered { 
            background: #fef3c7; 
            border-color: #f59e0b;
          }
          .quantity-box.remaining { 
            background: #f3f4f6; 
            border-color: #9ca3af;
          }
          .quantity-label {
            font-size: 8px;
            color: #666;
            margin-bottom: 3px;
          }
          .quantity-value {
            font-size: 14px;
            font-weight: bold;
            color: #333;
          }
          .history-section {
            margin-top: 10px;
          }
          .history-title {
            font-size: 10px;
            font-weight: bold;
            color: #333;
            margin-bottom: 6px;
            padding: 4px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .history-table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 8px;
          }
          .history-table th, 
          .history-table td { 
            padding: 5px; 
            text-align: right; 
            border: 1px solid #ddd;
          }
          .history-table th { 
            background: #2563eb; 
            color: white; 
            font-weight: bold;
          }
          .history-table tr:nth-child(even) { 
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
          .badge-received {
            background: #2563eb;
            color: white;
            padding: 2px 6px;
            border-radius: 6px;
            font-size: 7px;
            white-space: nowrap;
          }
          .badge-delivered {
            background: #f59e0b;
            color: white;
            padding: 2px 6px;
            border-radius: 6px;
            font-size: 7px;
            white-space: nowrap;
          }
          .no-history {
            text-align: center;
            padding: 8px;
            color: #999;
            font-size: 9px;
            font-style: italic;
          }
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 8px;
          }
          @media print {
            .item-card {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>شركة الريان واريان للخدمات اللوجستية</h1>
          <p>تقرير شامل لحالة المخزون</p>
        </div>

        <div class="inventory-title">
          <h2>${inventoryName}</h2>
          <div style="font-size: 9px; color: #666;">
            تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        <div class="totals-grid">
          <div class="total-box received">
            <div class="total-label">إجمالي المستلم</div>
            <div class="total-value">${totalReceived}</div>
          </div>
          <div class="total-box delivered">
            <div class="total-label">إجمالي المسلم</div>
            <div class="total-value">${totalDelivered}</div>
          </div>
          <div class="total-box remaining">
            <div class="total-label">إجمالي المتبقي</div>
            <div class="total-value">${totalRemaining}</div>
          </div>
        </div>

        <div style="margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 6px; text-align: center;">
          <strong>عدد الأصناف: ${items.length}</strong>
        </div>

        ${itemsHtml}

        <div class="footer">
          <p><strong>شركة الريان واريان للخدمات اللوجستية</strong></p>
          <p>هاتف: 0791083443 | جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>

      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const totalReceived = items.reduce((sum, item) => sum + item.warehouse_quantity, 0)
  const totalDelivered = items.reduce((sum, item) => sum + item.delivered_quantity, 0)
  const totalRemaining = items.reduce((sum, item) => sum + item.remaining_quantity, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <span>معاينة تفاصيل المخزون - {inventoryName}</span>
            <div className="flex gap-2">
              <Button onClick={handlePrint} size="sm" variant="outline" className="gap-2 bg-transparent">
                <Printer className="w-4 h-4" />
                طباعة الكل
              </Button>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="gap-2">
                  <Pencil className="w-4 h-4" />
                  تعديل السجلات
                </Button>
              ) : (
                <Button onClick={handleSaveChanges} size="sm" className="gap-2 gradient-primary" disabled={isSaving}>
                  <Save className="w-4 h-4" />
                  {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Section */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>إجمالي المستلم</span>
              </div>
              <p className="text-3xl font-bold text-primary text-center">{totalReceived}</p>
            </div>

            <div className="p-4 rounded-lg border-2 border-accent/20 bg-accent/5">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <TrendingDown className="w-4 h-4 text-accent" />
                <span>إجمالي المسلم</span>
              </div>
              <p className="text-3xl font-bold text-accent text-center">{totalDelivered}</p>
            </div>

            <div className="p-4 rounded-lg border-2 border-foreground/20 bg-muted/30">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <Package className="w-4 h-4" />
                <span>إجمالي المتبقي</span>
              </div>
              <p className="text-3xl font-bold text-foreground text-center">{totalRemaining}</p>
            </div>
          </div>

          <Separator />

          {/* Items List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">الأصناف ({items.length})</h3>

            {items.map((item) => {
              const itemHistory = editedHistory[item.id] || []

              return (
                <div key={item.id} className="p-4 rounded-lg border bg-card">
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-lg">{item.sender_name}</h4>
                        <Badge variant="secondary">{item.shipment_type}</Badge>
                      </div>
                      {item.tracking_number && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Hash className="w-3 h-3" />
                          <span className="font-mono">{item.tracking_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantities */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <p className="text-xs text-muted-foreground mb-1">المستلمة</p>
                      <p className="text-xl font-bold text-primary">{item.warehouse_quantity}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-accent/20 bg-accent/5">
                      <p className="text-xs text-muted-foreground mb-1">المسلمة</p>
                      <p className="text-xl font-bold text-accent">{item.delivered_quantity}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-foreground/20 bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">المتبقية</p>
                      <p className="text-xl font-bold">{item.remaining_quantity}</p>
                    </div>
                  </div>

                  {/* Edit History */}
                  {itemHistory.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <History className="w-4 h-4 text-primary" />
                        <span>سجل التعديلات ({itemHistory.length})</span>
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {itemHistory.map((history) => {
                          const quantityChange = history.new_quantity - history.old_quantity
                          const changeSign = quantityChange >= 0 ? "+" : ""
                          const changeColor = quantityChange >= 0 ? "text-primary" : "text-accent"
                          const bgColor = quantityChange >= 0 ? "bg-primary/5" : "bg-accent/5"

                          return (
                            <div key={history.id} className={`p-3 rounded-lg border ${bgColor}`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={history.edit_type === "received" ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {history.edit_type === "received" ? "مستلمة" : "مسلمة"}
                                  </Badge>
                                  {!isEditing && (
                                    <span className={`text-sm font-bold ${changeColor}`}>
                                      {changeSign}
                                      {quantityChange}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(history.edited_at)}</span>
                                </div>
                              </div>

                              {isEditing ? (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">قبل</label>
                                    <Input
                                      type="number"
                                      value={history.old_quantity}
                                      onChange={(e) =>
                                        handleQuantityChange(item.id, history.id, "old_quantity", e.target.value)
                                      }
                                      className="text-center h-8"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">بعد</label>
                                    <Input
                                      type="number"
                                      value={history.new_quantity}
                                      onChange={(e) =>
                                        handleQuantityChange(item.id, history.id, "new_quantity", e.target.value)
                                      }
                                      className="text-center h-8"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-muted-foreground">
                                    قبل: <span className="font-medium text-foreground">{history.old_quantity}</span>
                                  </span>
                                  <span className="text-muted-foreground">→</span>
                                  <span className="text-muted-foreground">
                                    بعد: <span className="font-medium text-foreground">{history.new_quantity}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
