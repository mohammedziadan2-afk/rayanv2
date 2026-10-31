"use client"

import { useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface BudgetResult {
  revenue: number
  expenses: number
  purchases: number
  total: number
  budget: number
}

interface PrintBudgetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: BudgetResult | null
  startDate: string
  endDate: string
}

export function PrintBudget({ open, onOpenChange, result, startDate, endDate }: PrintBudgetProps) {
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
          <title>تقرير الميزانية</title>
          <style>
            @page {
              size: A4 landscape;
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
              width: 277mm;
              padding: 0;
              margin: 0;
            }
            
            .container {
              width: 277mm;
              padding: 10mm;
              min-height: 190mm;
            }
            
            .header {
              text-align: center;
              margin-bottom: 5mm;
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
            .period {
              text-align: center;
              padding: 3mm;
              background: #f5f5f5;
              border-radius: 2mm;
              margin-bottom: 5mm;
              font-size: 10pt;
              color: #333;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 3mm;
              margin-bottom: 5mm;
            }
            .summary-item {
              padding: 4mm;
              border-radius: 2mm;
              border: 0.5pt solid #e0e0e0;
            }
            .summary-item.revenue {
              background: #f0fdf4;
              border-color: #86efac;
            }
            .summary-item.expense {
              background: #fef2f2;
              border-color: #fca5a5;
            }
            .summary-item.purchase {
              background: #fff7ed;
              border-color: #fdba74;
            }
            .summary-item.total {
              background: #faf5ff;
              border-color: #d8b4fe;
            }
            .summary-label {
              font-size: 9pt;
              color: #666;
              margin-bottom: 2mm;
            }
            .summary-value {
              font-size: 14pt;
              font-weight: bold;
              color: #333;
            }
            .budget-final {
              padding: 5mm;
              border-radius: 3mm;
              text-align: center;
              margin-top: 5mm;
              border: 1.5pt solid;
            }
            .budget-final.positive {
              background: #f0fdf4;
              border-color: #22c55e;
            }
            .budget-final.negative {
              background: #fef2f2;
              border-color: #ef4444;
            }
            .budget-label {
              font-size: 11pt;
              color: #666;
              margin-bottom: 2mm;
            }
            .budget-value {
              font-size: 22pt;
              font-weight: bold;
              margin-bottom: 2mm;
            }
            .budget-value.positive {
              color: #16a34a;
            }
            .budget-value.negative {
              color: #dc2626;
            }
            .budget-status {
              font-size: 9pt;
              color: #666;
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

  if (!result) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] glass-effect">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">معاينة طباعة الميزانية</DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="p-6">
          <div className="header">
            <h1>تقرير الميزانية</h1>
            <p>تاريخ الطباعة: {new Date().toLocaleDateString("en-GB")}</p>
          </div>

          <div className="period">
            الفترة: من {new Date(startDate).toLocaleDateString("en-GB")} إلى{" "}
            {new Date(endDate).toLocaleDateString("en-GB")}
          </div>

          <div className="summary-grid">
            <div className="summary-item revenue">
              <div className="summary-label">إجمالي الإيرادات</div>
              <div className="summary-value">{result.revenue.toFixed(2)} د.أ</div>
            </div>

            <div className="summary-item expense">
              <div className="summary-label">إجمالي المصروفات</div>
              <div className="summary-value">{result.expenses.toFixed(2)} د.أ</div>
            </div>

            <div className="summary-item purchase">
              <div className="summary-label">إجمالي المشتريات</div>
              <div className="summary-value">{result.purchases.toFixed(2)} د.أ</div>
            </div>

            <div className="summary-item total">
              <div className="summary-label">إجمالي المصروفات والمشتريات</div>
              <div className="summary-value">{result.total.toFixed(2)} د.أ</div>
            </div>
          </div>

          <div className={`budget-final ${result.budget >= 0 ? "positive" : "negative"}`}>
            <div className="budget-label">الميزانية النهائية</div>
            <div className={`budget-value ${result.budget >= 0 ? "positive" : "negative"}`}>
              {result.budget.toFixed(2)} د.أ
            </div>
            <div className="budget-status">{result.budget >= 0 ? "ربح" : "خسارة"} في الفترة المحددة</div>
          </div>

          <div className="footer">
            <p>هذا التقرير تم إنشاؤه تلقائياً من نظام إدارة الشحنات</p>
            <p>جميع المبالغ بالدينار الأردني (د.أ)</p>
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
