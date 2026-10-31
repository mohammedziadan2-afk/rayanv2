"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Package, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getAllShipments } from "@/app/actions/shipments"

export default function ShipmentsStatsPage() {
  const [stats, setStats] = useState({ count: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const result = await getAllShipments()
      const count = result.data.length
      const total = result.data.reduce((sum, shipment) => sum + Number(shipment.amount || 0), 0)
      setStats({ count, total })
    } catch (error) {
      console.error("Error loading shipments stats:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50">
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
                  إحصائيات الشحنات
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
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <p className="text-center py-8">جاري التحميل...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-blue-500 shadow-lg">
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">عدد الشحنات</p>
                      <p className="text-5xl font-bold text-blue-700">{stats.count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-cyan-300 bg-gradient-to-br from-cyan-50 to-cyan-100/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-cyan-500 shadow-lg">
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">مجموع المبالغ</p>
                      <p className="text-4xl font-bold text-cyan-700">{stats.total.toFixed(2)} د.أ</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
