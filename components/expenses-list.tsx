"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Receipt, ShoppingCart, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ExpenseForm } from "./expense-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export interface Expense {
  id: string
  type: "expense" | "purchase"
  description: string
  amount: number
  date: string
  category: string
  notes?: string
  createdAt: string
}

export function ExpensesList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false)
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const loadExpenses = () => {
    const stored = localStorage.getItem("expenses")
    if (stored) {
      setExpenses(JSON.parse(stored))
    }
  }

  useEffect(() => {
    loadExpenses()

    const handleUpdate = () => loadExpenses()
    window.addEventListener("expensesUpdated", handleUpdate)

    return () => window.removeEventListener("expensesUpdated", handleUpdate)
  }, [])

  const deleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id)
    localStorage.setItem("expenses", JSON.stringify(updated))
    setExpenses(updated)
    toast({
      title: "تم الحذف",
      description: "تم حذف العنصر بنجاح",
    })
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const expensesList = expenses.filter((e) => e.type === "expense")
  const purchasesList = expenses.filter((e) => e.type === "purchase")
  const totalExpenses = expensesList.reduce((sum, e) => sum + e.amount, 0)
  const totalPurchases = purchasesList.reduce((sum, e) => sum + e.amount, 0)
  const grandTotal = totalExpenses + totalPurchases

  return (
    <div className="space-y-6">
      {/* أزرار الإضافة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Receipt className="w-5 h-5" />
              المصروفات
            </CardTitle>
            <CardDescription>إضافة مصروف جديد</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsExpenseFormOpen(true)} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              إضافة مصروف
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-accent/20 hover:border-accent/40 transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <ShoppingCart className="w-5 h-5" />
              المشتريات
            </CardTitle>
            <CardDescription>إضافة مشترى جديد</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsPurchaseFormOpen(true)} variant="secondary" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              إضافة مشترى
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* قائمة المصروفات */}
      <Card className="shadow-lg">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>المصروفات</CardTitle>
                <CardDescription>عرض جميع المصروفات المسجلة ({expensesList.length})</CardDescription>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">الإجمالي</p>
              <p className="text-2xl font-bold text-primary">{totalExpenses.toFixed(2)} د.أ</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {expensesList.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">لا توجد مصروفات مسجلة بعد</p>
              </div>
            ) : (
              expensesList.map((expense) => (
                <div key={expense.id} className="border border-border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 bg-card hover:bg-accent/5 cursor-pointer transition-colors"
                    onClick={() => toggleExpanded(expense.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">{expense.description}</h3>
                        <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                          {expense.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(expense.date).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary">{expense.amount.toFixed(2)} د.أ</span>
                      {expandedItems.has(expense.id) ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {expandedItems.has(expense.id) && (
                    <div className="p-4 bg-muted/30 border-t border-border">
                      {expense.notes && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-muted-foreground mb-1">ملاحظات:</p>
                          <p className="text-sm text-foreground">{expense.notes}</p>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="gap-2">
                              <Trash2 className="w-4 h-4" />
                              حذف
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيتم حذف هذا المصروف نهائياً ولا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteExpense(expense.id)}>حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* قائمة المشتريات */}
      <Card className="shadow-lg">
        <CardHeader className="bg-accent/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-accent" />
              <div>
                <CardTitle>المشتريات</CardTitle>
                <CardDescription>عرض جميع المشتريات المسجلة ({purchasesList.length})</CardDescription>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">الإجمالي</p>
              <p className="text-2xl font-bold text-accent">{totalPurchases.toFixed(2)} د.أ</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {purchasesList.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">لا توجد مشتريات مسجلة بعد</p>
              </div>
            ) : (
              purchasesList.map((purchase) => (
                <div key={purchase.id} className="border border-border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 bg-card hover:bg-accent/5 cursor-pointer transition-colors"
                    onClick={() => toggleExpanded(purchase.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">{purchase.description}</h3>
                        <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent font-medium">
                          {purchase.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(purchase.date).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-accent">{purchase.amount.toFixed(2)} د.أ</span>
                      {expandedItems.has(purchase.id) ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {expandedItems.has(purchase.id) && (
                    <div className="p-4 bg-muted/30 border-t border-border">
                      {purchase.notes && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-muted-foreground mb-1">ملاحظات:</p>
                          <p className="text-sm text-foreground">{purchase.notes}</p>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="gap-2">
                              <Trash2 className="w-4 h-4" />
                              حذف
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيتم حذف هذا المشترى نهائياً ولا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteExpense(purchase.id)}>حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* المجموع الإجمالي */}
      <Card className="shadow-lg border-2 border-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">المجموع الإجمالي</p>
              <div className="flex gap-4 text-sm">
                <span className="text-primary">مصروفات: {totalExpenses.toFixed(2)} د.أ</span>
                <span className="text-accent">مشتريات: {totalPurchases.toFixed(2)} د.أ</span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-foreground">{grandTotal.toFixed(2)} د.أ</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نوافذ الإضافة */}
      <ExpenseForm
        type="expense"
        isOpen={isExpenseFormOpen}
        onClose={() => setIsExpenseFormOpen(false)}
        onSuccess={() => {
          setIsExpenseFormOpen(false)
          loadExpenses()
        }}
      />
      <ExpenseForm
        type="purchase"
        isOpen={isPurchaseFormOpen}
        onClose={() => setIsPurchaseFormOpen(false)}
        onSuccess={() => {
          setIsPurchaseFormOpen(false)
          loadExpenses()
        }}
      />
    </div>
  )
}
