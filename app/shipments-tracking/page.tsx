"use client"

import { ShipmentList } from "@/components/shipment-list"
import { AddShipmentButton } from "@/components/add-shipment-button"
import Image from "next/image"
import Link from "next/link"
import { Package } from "lucide-react"
import { AdminFooter } from "@/components/admin-footer"

export default function ShipmentsTrackingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Link href="/">
                <div className="relative w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-xl sm:rounded-2xl overflow-hidden shadow-glow ring-2 ring-primary/20 flex-shrink-0 cursor-pointer hover:ring-primary/40 transition-all">
                  <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-1 sm:p-2" />
                </div>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent leading-tight">
                  مؤسسة الريان واريان للشحن
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1 hidden sm:block">
                  الريان للخدمات اللوجستية وحلول الشحن والتوصيل
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="space-y-4 sm:space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-2.5 md:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-glow">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">متابعة الشحنات</h2>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  إضافة وإدارة الشحنات الجديدة
                </p>
              </div>
            </div>
          </div>

          <ShipmentList />
        </div>
      </main>

      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
        <AddShipmentButton variant="orange" />
      </div>

      <AdminFooter backUrl="/admin" backLabel="الإدارة" />
    </div>
  )
}
