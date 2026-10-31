"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingDown, Plus, Trash2, Edit } from "lucide-react"
import Image from "next/image"
import {
  getExpenses,
  getDriverSessionExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  type Expense,
  type DriverSessionExpense,
} from "@/app/actions/expenses"
import { useToast } from "@/hooks/use-toast"
import { AdminFooter } from "@/components/admin-footer"
import { getCSRFToken } from "@/app/actions/csrf"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [driverExpenses, setDriverExpenses] = useState<DriverSessionExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showDriverTable, setShowDriverTable] = useState(false)
  const [showExpensesTable, setShowExpensesTable] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [newExpense, setNewExpense] = useState({
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [csrfToken, setCsrfToken] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    getCSRFToken().then((token) => {
      setCsrfToken(token)
    })
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [expensesData, driverSessionsData] = await Promise.all([getExpenses(), getDriverSessionExpenses()])
      setExpenses(expensesData)
      setDriverExpenses(driverSessionsData)
    } catch (error) {
      console.error("Error loading expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  const manualExpensesTotal = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
  const driverExpensesTotal = driverExpenses.reduce((sum, exp) => sum + Number(exp.total_driver_fee_included || 0), 0)
  const totalExpenses = manualExpensesTotal + driverExpensesTotal

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.description || !newExpense.amount) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" })
      return
    }

    const expenseData = {
      ...newExpense,
      amount: Number.parseFloat(newExpense.amount),
    }

    const result = editingExpense
      ? await updateExpense(editingExpense.id, expenseData, csrfToken)
      : await createExpense(expenseData, csrfToken)

    if (result.success) {
      toast({
        title: "تم بنجاح",
        description: editingExpense ? "تم تعديل المصروف" : "تم إضافة المصروف",
      })
      const newToken = await getCSRFToken()
      setCsrfToken(newToken)
      setDialogOpen(false)
      setEditingExpense(null)
      setNewExpense({ category: "", description: "", amount: "", date: new Date().toISOString().split("T")[0] })
      loadData()
    } else {
      toast({ title: "خطأ", description: result.error || "فشل في حفظ المصروف", variant: "destructive" })
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setNewExpense({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
    })
    setDialogOpen(true)
  }

  const handleDeleteExpense = async (id: string) => {
    const result = await deleteExpense(id, csrfToken)
    if (result.success) {
      toast({ title: "تم بنجاح", description: "تم حذف المصروف" })
      const newToken = await getCSRFToken()
      setCsrfToken(newToken)
      loadData()
    } else {
      toast({ title: "خطأ", description: result.error || "فشل في حذف المصروف", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 pb-24">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden shadow-glow ring-2 ring-primary/20 flex-shrink-0">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-1 sm:p-2" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-sky-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent leading-tight">
                  مؤسسة الريان واريان للشحن
                </h1>
                <p className="text-[10px] sm:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1">المصروفات</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="border-2 border-red-400 bg-gradient-to-br from-red-50 to-red-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-red-500 shadow-lg">
                    <TrendingDown className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                    <p className="text-4xl font-bold text-red-700">{totalExpenses.toFixed(2)} د.أ</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>أجرة السائقين (جلسات معتمدة)</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDriverTable(!showDriverTable)}
                  className="glass-effect"
                >
                  {showDriverTable ? "إخفاء" : "إظهار"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-4">جاري التحميل...</p>
              ) : driverExpenses.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">لا توجد جلسات معتمدة</p>
              ) : (
                <>
                  {showDriverTable && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>النوع</TableHead>
                          <TableHead>الوصف</TableHead>
                          <TableHead>التاريخ</TableHead>
                          <TableHead className="text-right">المبلغ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {driverExpenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.driver_name}</TableCell>
                            <TableCell>جلسة رقم {expense.session_number}</TableCell>
                            <TableCell>{new Date(expense.session_date).toLocaleDateString("ar-EG")}</TableCell>
                            <TableCell className="text-right font-bold text-red-700">
                              {Number(expense.total_driver_fee_included).toFixed(2)} د.أ
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  <div className="mt-4 p-4 bg-red-100 rounded-lg">
                    <p className="text-lg font-bold text-red-800">المجموع: {driverExpensesTotal.toFixed(2)} د.أ</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>مصروفات أخرى</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExpensesTable(!showExpensesTable)}
                    className="glass-effect"
                  >
                    {showExpensesTable ? "إخفاء" : "إظهار"}
                  </Button>
                  <Dialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                      setDialogOpen(open)
                      if (!open) {
                        setEditingExpense(null)
                        setNewExpense({
                          category: "",
                          description: "",
                          amount: "",
                          date: new Date().toISOString().split("T")[0],
                        })
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500">
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة مصروف
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingExpense ? "تعديل مصروف" : "إضافة مصروف جديد"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">نوع المصروف</Label>
                          <Select
                            value={newExpense.category}
                            onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع المصروف" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rent">إيجار</SelectItem>
                              <SelectItem value="salaries">رواتب</SelectItem>
                              <SelectItem value="utilities">مرافق (كهرباء، ماء، إنترنت)</SelectItem>
                              <SelectItem value="maintenance">صيانة</SelectItem>
                              <SelectItem value="fuel">وقود</SelectItem>
                              <SelectItem value="supplies">مستلزمات</SelectItem>
                              <SelectItem value="marketing">تسويق</SelectItem>
                              <SelectItem value="other">أخرى</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">الوصف</Label>
                          <Input
                            id="description"
                            value={newExpense.description}
                            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                            placeholder="وصف المصروف"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">المبلغ</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date">التاريخ</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newExpense.date}
                            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                          />
                        </div>
                        <Button
                          onClick={handleAddExpense}
                          className="w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500"
                        >
                          {editingExpense ? "تحديث" : "حفظ"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-4">جاري التحميل...</p>
              ) : expenses.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">لا توجد مصروفات</p>
              ) : (
                <>
                  {showExpensesTable && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>النوع</TableHead>
                          <TableHead>الوصف</TableHead>
                          <TableHead>التاريخ</TableHead>
                          <TableHead className="text-right">المبلغ</TableHead>
                          <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.category}</TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>
                              {expense.date
                                ? new Date(expense.date).toLocaleDateString("en-GB", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                  })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right font-bold text-red-700">
                              {Number(expense.amount).toFixed(2)} د.أ
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditExpense(expense)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  <div className="mt-4 p-4 bg-red-100 rounded-lg">
                    <p className="text-lg font-bold text-red-800">المجموع: {manualExpensesTotal.toFixed(2)} د.أ</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <AdminFooter backUrl="/finance" backLabel="المالية" />
    </div>
  )
}
