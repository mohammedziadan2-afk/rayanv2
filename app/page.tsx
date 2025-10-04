"use client"

import { ShipmentList } from "@/components/shipment-list"
import { AddShipmentButton } from "@/components/add-shipment-button"
import Image from "next/image"
import Link from "next/link"
import { Search, Package, Settings, Warehouse, Wallet, Truck, Table, Trash2, FileText, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="relative w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-xl sm:rounded-2xl overflow-hidden shadow-glow ring-2 ring-primary/20 flex-shrink-0">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-1 sm:p-2" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent leading-tight">
                  مؤسسة الريان واريان للشحن
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1 hidden sm:block">
                  الريان للخدمات اللوجستية وحلول الشحن والتوصيل
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Link href="/track">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent p-1.5 sm:p-2 md:px-4"
                >
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline text-xs sm:text-sm">تتبع الشحنات</span>
                </Button>
              </Link>
              <Link href="/settings">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent p-1.5 sm:p-2 md:px-4"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline text-xs sm:text-sm">الإعدادات</span>
                </Button>
              </Link>
              <AddShipmentButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="space-y-4 sm:space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-2.5 md:p-4 rounded-xl sm:rounded-2xl gradient-primary shadow-glow">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">إدارة الشحنات</h2>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  عرض وإدارة جميع الشحنات بسهولة واحترافية
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex gap-2 w-full sm:w-auto">
              <Link href="/shipping-requests" className="w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow-accent transition-all duration-300 bg-transparent w-full text-xs sm:text-sm"
                >
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="truncate">طلبات الشحن</span>
                </Button>
              </Link>
              <Link href="/shipments-table" className="w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow-accent transition-all duration-300 bg-transparent w-full text-xs sm:text-sm"
                >
                  <Table className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="truncate">جدول الشحنات</span>
                </Button>
              </Link>
              <Link href="/trips" className="w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow-accent transition-all duration-300 bg-transparent w-full text-xs sm:text-sm"
                >
                  <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="truncate">الرحلات</span>
                </Button>
              </Link>
              <Link href="/finance" className="w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent w-full text-xs sm:text-sm"
                >
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="truncate">المالية</span>
                </Button>
              </Link>
              <Link href="/warehouse" className="w-full sm:w-auto col-span-2 sm:col-span-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent w-full text-xs sm:text-sm"
                >
                  <Warehouse className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="truncate">المستودع</span>
                </Button>
              </Link>
            </div>
          </div>

          <ShipmentList />

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 sm:pt-8">
            <Link href="/trash" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent border-red-500/30 hover:border-red-500/50 text-red-600 hover:text-red-700 w-full"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">سلة المحذوفات</span>
              </Button>
            </Link>
            <Link href="/customers" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent border-primary/30 hover:border-primary/50 w-full"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">الزبائن</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
