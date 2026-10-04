"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, TrendingUp, TrendingDown, Package } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AdminFooter } from "@/components/admin-footer"

export default function BudgetPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 pb-20">
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
                <p className="text-[10px] sm:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1">
                  نظام الميزانية
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-glow">
              <Calculator className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">الميزانية</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">إدارة الإيرادات والمصروفات</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* 1. الميزانية النهائية */}
            <Link href="/finance/final-budget">
              <Card className="glass-effect hover:shadow-xl transition-all duration-300 border-2 border-purple-200 hover:border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100/50 h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                      <Calculator className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg sm:text-xl">الميزانية النهائية</CardTitle>
                      <CardDescription>احسب الميزانية لفترة محددة</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">عرض الميزانية الإجمالية = الإيرادات - المصروفات</p>
                </CardContent>
              </Card>
            </Link>

            {/* 2. الإيرادات */}
            <Link href="/finance/revenues">
              <Card className="glass-effect hover:shadow-xl transition-all duration-300 border-2 border-green-200 hover:border-green-400 bg-gradient-to-br from-green-50 to-green-100/50 h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg sm:text-xl">الإيرادات</CardTitle>
                      <CardDescription>أرباح الرحلات والإيرادات الثانوية</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">عرض صافي أرباح الرحلات وإضافة إيرادات ثانوية</p>
                </CardContent>
              </Card>
            </Link>

            {/* 3. المصروفات */}
            <Link href="/finance/expenses">
              <Card className="glass-effect hover:shadow-xl transition-all duration-300 border-2 border-red-200 hover:border-red-400 bg-gradient-to-br from-red-50 to-red-100/50 h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                      <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg sm:text-xl">المصروفات</CardTitle>
                      <CardDescription>إدارة وإضافة المصروفات</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">إضافة وعرض جميع المصروفات حسب النوع</p>
                </CardContent>
              </Card>
            </Link>

            {/* 4. الشحنات */}
            <Link href="/finance/shipments">
              <Card className="glass-effect hover:shadow-xl transition-all duration-300 border-2 border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100/50 h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg sm:text-xl">الشحنات</CardTitle>
                      <CardDescription>إحصائيات الشحنات</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">عدد الشحنات ومجموع مبالغها</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
      <AdminFooter backUrl="/admin" backLabel="الإدارة" />
    </div>
  )
}
