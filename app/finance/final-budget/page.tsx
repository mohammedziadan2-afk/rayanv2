"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calculator, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Printer } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getTripsForBudget } from "@/app/actions/trips"
import { getExpensesForBudget, getDriverSessionExpensesForBudget } from "@/app/actions/expenses"
import { getAdditionalRevenuesForBudget } from "@/app/actions/revenues"

export default function FinalBudgetPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    totalRevenue: number
    totalExpenses: number
    finalBudget: number
  } | null>(null)

  const calculateBudget = async () => {
    setLoading(true)
    try {
      const [trips, expenses, driverSessionExpenses, additionalRevenuesResult] = await Promise.all([
        getTripsForBudget(startDate || undefined, endDate || undefined),
        getExpensesForBudget(startDate || undefined, endDate || undefined),
        getDriverSessionExpensesForBudget(startDate || undefined, endDate || undefined),
        getAdditionalRevenuesForBudget(startDate || undefined, endDate || undefined),
      ])

      const tripsProfit = (trips || []).reduce((sum, trip) => {
        const shipmentsRevenue = (trip.shipments || []).reduce(
          (s: number, shipment: any) => s + (Number(shipment.amount) || 0),
          0,
        )

        let notes = {
          tobacco_revenue: 0,
          other_revenue: 0,
          delivery_costs: 0,
          porter_fees: 0,
          permit_fees: 0,
          tickets: 0,
          employee_daily_wages: 0,
          accommodation: 0,
          other_costs: 0,
        }

        try {
          if (trip.notes && typeof trip.notes === "string") {
            notes = JSON.parse(trip.notes)
          } else if (trip.notes && typeof trip.notes === "object") {
            notes = trip.notes as any
          }
        } catch (e) {
          console.error("Error parsing notes for trip:", trip.trip_number, e)
        }

        const tobacco = Number(notes.tobacco_revenue) || Number(trip.tobacco_revenue) || 0
        const other = Number(notes.other_revenue) || Number(trip.other_revenue) || 0
        const totalRevenue = shipmentsRevenue + tobacco + other

        const totalCosts =
          (Number(notes.delivery_costs) || Number(trip.delivery_costs) || 0) +
          (Number(notes.porter_fees) || Number(trip.porter_fees) || 0) +
          (Number(notes.permit_fees) || Number(trip.permit_fees) || 0) +
          (Number(notes.tickets) || Number(trip.tickets) || 0) +
          (Number(notes.employee_daily_wages) || Number(trip.employee_daily_wages) || 0) +
          (Number(notes.accommodation) || Number(trip.accommodation) || 0) +
          (Number(notes.other_costs) || Number(trip.other_costs) || 0)

        const netProfit = totalRevenue - totalCosts
        return sum + netProfit
      }, 0)

      const secondaryRevenue = (additionalRevenuesResult?.data || []).reduce(
        (sum: number, rev: any) => sum + (Number(rev.amount) || 0),
        0,
      )

      const totalRevenue = tripsProfit + secondaryRevenue

      const otherExpenses = (expenses || []).reduce(
        (sum: number, expense: any) => sum + (Number(expense.amount) || 0),
        0,
      )

      const driverExpenses = (driverSessionExpenses || []).reduce(
        (sum: number, session: any) => sum + (Number(session.total_driver_fee_included) || 0),
        0,
      )

      const totalExpenses = otherExpenses + driverExpenses

      const finalBudget = totalRevenue - totalExpenses

      setResult({ totalRevenue, totalExpenses, finalBudget })
    } catch (error) {
      console.error("Error calculating budget:", error)
      alert("حدث خطأ أثناء حساب الميزانية")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10 print:hidden">
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
                <p className="text-[10px] sm:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1">
                  الميزانية النهائية
                </p>
              </div>
            </div>

            <Link href="/finance">
              <Button
                size="sm"
                variant="outline"
                className="gap-1 sm:gap-2 glass-effect hover:shadow-glow bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">العودة</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                حساب الميزانية للفترة المحددة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
                <div className="space-y-2">
                  <Label htmlFor="start-date">من تاريخ (اختياري)</Label>
                  <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">إلى تاريخ (اختياري)</Label>
                  <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-3 print:hidden">
                <Button
                  onClick={calculateBudget}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500"
                >
                  <Calculator className="w-4 h-4 ml-2" />
                  {loading ? "جاري الحساب..." : "احسب الميزانية"}
                </Button>
              </div>

              {result && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="text-center text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                    <p>
                      {startDate && endDate
                        ? `الفترة: من ${new Date(startDate).toLocaleDateString("ar-EG")} إلى ${new Date(endDate).toLocaleDateString("ar-EG")}`
                        : "الفترة: كامل الفترة"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-2 border-green-200 bg-green-50/50">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-green-500">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                            <p className="text-2xl font-bold text-green-700">{result.totalRevenue.toFixed(2)} د.أ</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-red-200 bg-red-50/50">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-red-500">
                            <TrendingDown className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                            <p className="text-2xl font-bold text-red-700">{result.totalExpenses.toFixed(2)} د.أ</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className={`border-4 ${result.finalBudget >= 0 ? "border-purple-400 bg-purple-50" : "border-orange-400 bg-orange-50"}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-3 rounded-lg ${result.finalBudget >= 0 ? "bg-purple-500" : "bg-orange-500"}`}
                          >
                            <DollarSign className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">الميزانية النهائية</p>
                            <p
                              className={`text-2xl font-bold ${result.finalBudget >= 0 ? "text-purple-700" : "text-orange-700"}`}
                            >
                              {result.finalBudget.toFixed(2)} د.أ
                            </p>
                            <p className="text-xs text-muted-foreground">{result.finalBudget >= 0 ? "ربح" : "خسارة"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-center print:hidden">
                    <Button onClick={handlePrint} className="bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500">
                      <Printer className="w-4 h-4 ml-2" />
                      طباعة التقرير
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
