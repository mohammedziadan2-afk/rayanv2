"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BudgetCalculatorDialog } from "@/components/budget-calculator-dialog"
import { ShipmentSummary } from "@/components/shipment-summary"
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Calculator, Receipt } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function FinancePage() {
  const [showBudgetCalculator, setShowBudgetCalculator] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden shadow-glow ring-2 ring-primary/20 flex-shrink-0">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-1 sm:p-2" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent leading-tight">
                  مؤسسة الريان واريان للشحن
                </h1>
                <p className="text-[10px] sm:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1 hidden sm:block">
                  إدارة المالية والميزانية
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <ShipmentSummary />
              </div>
              <Link href="/expenses">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 sm:gap-2 glass-effect hover:shadow-glow-accent transition-all duration-300 bg-transparent"
                >
                  <Receipt className="w-4 h-4" />
                  <span className="hidden sm:inline">المصروفات</span>
                </Button>
              </Link>
              <Link href="/">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">العودة للرئيسية</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="sm:hidden mt-3 pt-3 border-t border-border/50">
            <ShipmentSummary />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="space-y-4 sm:space-y-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl gradient-primary shadow-glow">
              <Wallet className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">إدارة المالية</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                متابعة الإيرادات والمصروفات وحساب الميزانية
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card
              className="glass-effect hover:shadow-glow transition-all duration-300 cursor-pointer"
              onClick={() => setShowBudgetCalculator(true)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Calculator className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">حساب الميزانية</CardTitle>
                    <CardDescription>احسب الميزانية لفترة محددة</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  اختر فترة زمنية واحصل على تقرير شامل للإيرادات والمصروفات والميزانية النهائية
                </p>
              </CardContent>
            </Card>

            <Link href="/finance/revenues">
              <Card className="glass-effect border-green-500/20 hover:shadow-glow transition-all duration-300 cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-green-500/10">
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">الإيرادات</CardTitle>
                      <CardDescription>إجمالي الإيرادات من الشحنات</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">تتبع جميع الإيرادات من الشحنات المسجلة في النظام</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/finance/expenses">
              <Card className="glass-effect border-red-500/20 hover:shadow-glow transition-all duration-300 cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-red-500/10">
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">المصروفات</CardTitle>
                      <CardDescription>إجمالي المصروفات والمشتريات</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">متابعة جميع المصروفات والمشتريات المسجلة</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      <BudgetCalculatorDialog open={showBudgetCalculator} onOpenChange={setShowBudgetCalculator} />
    </div>
  )
}
