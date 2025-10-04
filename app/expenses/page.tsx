"use client"

import { ExpensesList } from "@/components/expenses-list"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Receipt } from "lucide-react"

export default function ExpensesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-accent/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-glow-accent ring-2 ring-accent/20">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-2" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-l from-accent via-accent/80 to-primary bg-clip-text text-transparent">
                  المصروفات والمشتريات
                </h1>
                <p className="text-sm text-muted-foreground font-semibold mt-1">إدارة المصروفات والمشتريات اليومية</p>
              </div>
            </div>
            <Link href="/">
              <Button
                variant="outline"
                className="gap-2 glass-effect hover:shadow-glow-accent transition-all duration-300 bg-transparent"
              >
                <ArrowRight className="w-4 h-4" />
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 rounded-2xl gradient-accent shadow-glow-accent">
              <Receipt className="w-7 h-7 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">إدارة المصروفات</h2>
              <p className="text-muted-foreground mt-1">تتبع وإدارة جميع المصروفات والمشتريات</p>
            </div>
          </div>
          <ExpensesList />
        </div>
      </main>
    </div>
  )
}
