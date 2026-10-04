"use client"

import { useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

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

interface PrintWarehouseItemProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: WarehouseItem | null
}

export function PrintWarehouseItem({ open, onOpenChange, item }: PrintWarehouseItemProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>طباعة شحنة - ${item?.shipment_name}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            body {
              font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              direction: rtl;
              width: 190mm;
              padding: 0;
              margin: 0;
            }
            
            .container {
              width: 190mm;
              padding: 10mm;
              min-height: 277mm;
            }
            
            .header {
              text-align: center;
              margin-bottom: 6mm;
              border-bottom: 1.5pt solid #333;
              padding-bottom: 4mm;
            }
            .header h1 {
              margin: 0;
              font-size: 16pt;
              color: #333;
            }
            .header p {
              margin: 2mm 0 0 0;
              color: #666;
              font-size: 9pt;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 3mm;
              margin-bottom: 6mm;
            }
            .info-item {
              padding: 3mm;
              background: #f5f5f5;
              border-radius: 2mm;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              font-size: 9pt;
              margin-bottom: 1mm;
            }
            .info-value {
              font-size: 11pt;
              color: #333;
            }
            .quantities {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 3mm;
              margin-top: 6mm;
              padding: 4mm;
              background: #f9f9f9;
              border-radius: 2mm;
            }
            .quantity-box {
              text-align: center;
              padding: 4mm;
              background: white;
              border-radius: 2mm;
              border: 0.5pt solid #e0e0e0;
            }
            .quantity-label {
              font-size: 9pt;
              color: #666;
              margin-bottom: 2mm;
            }
            .quantity-value {
              font-size: 14pt;
              font-weight: bold;
              color: #333;
            }
            .footer {
              margin-top: 8mm;
              padding-top: 4mm;
              border-top: 0.5pt solid #e0e0e0;
              text-align: center;
              color: #666;
              font-size: 8pt;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass-effect">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">معاينة الطباعة</DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="p-6">
          <div className="header">
            <h1>بيان شحنة من المستودع</h1>
            <p>تاريخ الطباعة: {new Date().toLocaleDateString("en-GB")}</p>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">اسم الشحنة</div>
              <div className="info-value">{item.shipment_name}</div>
            </div>

            <div className="info-item">
              <div className="info-label">اسم المرسل</div>
              <div className="info-value">{item.sender_name}</div>
            </div>

            <div className="info-item">
              <div className="info-label">نوع الشحنة</div>
              <div className="info-value">{item.shipment_type}</div>
            </div>

            {item.tracking_number && (
              <div className="info-item">
                <div className="info-label">رقم التتبع</div>
                <div className="info-value">{item.tracking_number}</div>
              </div>
            )}

            <div className="info-item">
              <div className="info-label">تاريخ الإضافة</div>
              <div className="info-value">{new Date(item.created_at).toLocaleDateString("en-GB")}</div>
            </div>
          </div>

          <div className="quantities">
            <div className="quantity-box">
              <div className="quantity-label">الكمية بالمستودع</div>
              <div className="quantity-value">{item.warehouse_quantity}</div>
            </div>

            <div className="quantity-box">
              <div className="quantity-label">الكمية المسلمة</div>
              <div className="quantity-value">{item.delivered_quantity}</div>
            </div>

            <div className="quantity-box">
              <div className="quantity-label">الكمية المتبقية</div>
              <div className="quantity-value">{item.remaining_quantity}</div>
            </div>
          </div>

          <div className="footer">
            <p>هذا المستند تم إنشاؤه تلقائياً من نظام إدارة الشحنات</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button onClick={handlePrint} className="gradient-primary">
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
