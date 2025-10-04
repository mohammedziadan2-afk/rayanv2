"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Calculator, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Printer } from "lucide-react"
import { PrintBudget } from "./print-budget"
import type { Expense } from "./expenses-list"

interface Shipment {
  id: string
  amount?: number
  receivedDate: string
  [key: string]: any
}

interface Trip {
  id: string
  date: string
  tobaccoRevenue: number
  otherRevenue: number
  shipments: {
    deliveryCost: number
  }[]
  additionalCosts: {
    bridgeDelivery: number
    tickets: number
    porterFees: number
    employeeFees: number
    permitFees: number
    accommodationExpenses: number
    other: number
  }
}

interface BudgetCalculatorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BudgetCalculatorDialog({ open, onOpenChange }: BudgetCalculatorDialogProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [result, setResult] = useState<{
    revenue: number
    expenses: number
    purchases: number
    total: number
    budget: number
  } | null>(null)
  const [printOpen, setPrintOpen] = useState(false)

  const calculateBudget = () => {
    if (!startDate || !endDate) {
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // جلب الشحنات من localStorage
    const shipmentsData = localStorage.getItem("shipments")
    const shipments: Shipment[] = shipmentsData ? JSON.parse(shipmentsData) : []

    // حساب الإيرادات من الشحنات في الفترة المحددة
    const revenue = shipments
      .filter((shipment) => {
        const shipmentDate = new Date(shipment.receivedDate)
        return shipmentDate >= start && shipmentDate <= end
      })
      .reduce((sum, shipment) => sum + (shipment.amount || 0), 0)

    const tripsData = localStorage.getItem("trips")
    const trips: Trip[] = tripsData ? JSON.parse(tripsData) : []

    const tripsRevenue = trips
      .filter((trip) => {
        const tripDate = new Date(trip.date)
        return tripDate >= start && tripDate <= end
      })
      .reduce((sum, trip) => sum + (trip.tobaccoRevenue || 0) + (trip.otherRevenue || 0), 0)

    const totalRevenue = revenue + tripsRevenue

    // جلب المصروفات والمشتريات من localStorage
    const expensesData = localStorage.getItem("expenses")
    const expenses: Expense[] = expensesData ? JSON.parse(expensesData) : []

    // حساب المصروفات في الفترة المحددة
    const expensesTotal = expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date)
        return expense.type === "expense" && expenseDate >= start && expenseDate <= end
      })
      .reduce((sum, expense) => sum + expense.amount, 0)

    // حساب المشتريات في الفترة المحددة
    const purchasesTotal = expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date)
        return expense.type === "purchase" && expenseDate >= start && expenseDate <= end
      })
      .reduce((sum, expense) => sum + expense.amount, 0)

    const tripsCosts = trips
      .filter((trip) => {
        const tripDate = new Date(trip.date)
        return tripDate >= start && tripDate <= end
      })
      .reduce((sum, trip) => {
        const deliveryCosts = trip.shipments.reduce((s, shipment) => s + (shipment.deliveryCost || 0), 0)
        const additionalCosts = Object.values(trip.additionalCosts).reduce((s, cost) => s + (cost || 0), 0)
        return sum + deliveryCosts + additionalCosts
      }, 0)

    const total = expensesTotal + purchasesTotal + tripsCosts

    // حساب الميزانية (الإيرادات - المصروفات والمشتريات)
    const budget = totalRevenue - total

    setResult({
      revenue: totalRevenue,
      expenses: expensesTotal,
      purchases: purchasesTotal,
      total,
      budget,
    })
  }

  const handleReset = () => {
    setStartDate("")
    setEndDate("")
    setResult(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] glass-effect">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              حاسبة الميزانية
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* اختيار الفترة الزمنية */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">من تاريخ</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">إلى تاريخ</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={calculateBudget} disabled={!startDate || !endDate} className="flex-1 gradient-primary">
                  <Calculator className="w-4 h-4 ml-2" />
                  احسب الميزانية
                </Button>
                <Button onClick={handleReset} variant="outline">
                  إعادة تعيين
                </Button>
              </div>
            </div>

            {/* عرض النتائج */}
            {result && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* الإيرادات */}
                  <Card className="border-2 border-green-200 bg-green-50/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">الإيرادات</p>
                            <p className="text-2xl font-bold text-green-700">{result.revenue.toFixed(2)} د.أ</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* المصروفات */}
                  <Card className="border-2 border-red-200 bg-red-50/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-500">
                            <Receipt className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">المصروفات</p>
                            <p className="text-2xl font-bold text-red-700">{result.expenses.toFixed(2)} د.أ</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* المشتريات */}
                  <Card className="border-2 border-orange-200 bg-orange-50/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-500">
                            <ShoppingCart className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">المشتريات</p>
                            <p className="text-2xl font-bold text-orange-700">{result.purchases.toFixed(2)} د.أ</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* المجموع الكلي */}
                  <Card className="border-2 border-purple-200 bg-purple-50/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-500">
                            <TrendingDown className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                            <p className="text-2xl font-bold text-purple-700">{result.total.toFixed(2)} د.أ</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* الميزانية النهائية */}
                <Card
                  className={`border-4 ${result.budget >= 0 ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${result.budget >= 0 ? "bg-green-500" : "bg-red-500"}`}>
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">الميزانية النهائية</p>
                          <p className={`text-3xl font-bold ${result.budget >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {result.budget.toFixed(2)} د.أ
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.budget >= 0 ? "ربح" : "خسارة"} في الفترة المحددة
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                  <p>
                    الفترة: من {new Date(startDate).toLocaleDateString("en-GB")} إلى{" "}
                    {new Date(endDate).toLocaleDateString("en-GB")}
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button onClick={() => setPrintOpen(true)} className="gradient-primary">
                    <Printer className="w-4 h-4 ml-2" />
                    طباعة التقرير
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PrintBudget
        open={printOpen}
        onOpenChange={setPrintOpen}
        result={result}
        startDate={startDate}
        endDate={endDate}
      />
    </>
  )
}
