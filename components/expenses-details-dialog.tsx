"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Receipt, ShoppingCart, TrendingDown, Printer, Calendar, DollarSign } from "lucide-react"
import type { Expense } from "./expenses-list"
import { getAllExpenses } from "@/app/actions/expenses"

interface ExpensesDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpensesDetailsDialog({ open, onOpenChange }: ExpensesDetailsDialogProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    setLoading(true)
    try {
      const expensesData = await getAllExpenses()

      if (expensesData) {
        setExpenses(expensesData)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const expensesList = expenses.filter((e) => e.type === "expense")
  const purchasesList = expenses.filter((e) => e.type === "purchase")
  const totalExpenses = expensesList.reduce((sum, e) => sum + Number(e.amount), 0)
  const totalPurchases = purchasesList.reduce((sum, e) => sum + Number(e.amount), 0)
  const grandTotal = totalExpenses + totalPurchases

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <TrendingDown className="w-6 h-6 text-red-500" />
            تفاصيل المصروفات والمشتريات
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : (
          <div className="space-y-6 print:space-y-4">
            {/* ملخص الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-red-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-red-500/10">
                      <Receipt className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                      <p className="text-2xl font-bold text-red-500">{totalExpenses.toFixed(2)} د.أ</p>
                      <p className="text-xs text-muted-foreground mt-1">{expensesList.length} مصروف</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-orange-500/10">
                      <ShoppingCart className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي المشتريات</p>
                      <p className="text-2xl font-bold text-orange-500">{totalPurchases.toFixed(2)} د.أ</p>
                      <p className="text-xs text-muted-foreground mt-1">{purchasesList.length} مشترى</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">المجموع الكلي</p>
                      <p className="text-2xl font-bold text-primary">{grandTotal.toFixed(2)} د.أ</p>
                      <p className="text-xs text-muted-foreground mt-1">شامل جميع التكاليف</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* قائمة المصروفات */}
            {expensesList.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-red-500" />
                  المصروفات ({expensesList.length})
                </h3>
                <div className="space-y-2">
                  {expensesList.map((expense) => (
                    <Card key={expense.id} className="border-red-500/10">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{expense.description}</h4>
                              <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-500">
                                {expense.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(expense.date).toLocaleDateString("en-GB")}
                            </div>
                            {expense.notes && <p className="text-sm text-muted-foreground mt-2">{expense.notes}</p>}
                          </div>
                          <div className="text-left">
                            <p className="text-xl font-bold text-red-500">{Number(expense.amount).toFixed(2)} د.أ</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* قائمة المشتريات */}
            {purchasesList.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-orange-500" />
                  المشتريات ({purchasesList.length})
                </h3>
                <div className="space-y-2">
                  {purchasesList.map((purchase) => (
                    <Card key={purchase.id} className="border-orange-500/10">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{purchase.description}</h4>
                              <span className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-500">
                                {purchase.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(purchase.date).toLocaleDateString("en-GB")}
                            </div>
                            {purchase.notes && <p className="text-sm text-muted-foreground mt-2">{purchase.notes}</p>}
                          </div>
                          <div className="text-left">
                            <p className="text-xl font-bold text-orange-500">
                              {Number(purchase.amount).toFixed(2)} د.أ
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {expenses.length === 0 && (
              <div className="text-center py-12">
                <TrendingDown className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">لا توجد مصروفات أو مشتريات مسجلة</p>
              </div>
            )}

            {/* زر الطباعة */}
            {expenses.length > 0 && (
              <>
                <div className="flex justify-center pt-4 print:hidden">
                  <Button onClick={handlePrint} size="lg" className="gap-2">
                    <Printer className="w-5 h-5" />
                    طباعة التقرير
                  </Button>
                </div>

                <style jsx global>{`
                  @media print {
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
                      width: 190mm !important;
                      padding: 0 !important;
                      margin: 0 !important;
                    }
                    
                    .print\\:hidden {
                      display: none !important;
                    }
                    
                    .print\\:space-y-4 > * + * {
                      margin-top: 4mm !important;
                    }
                  }
                `}</style>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
