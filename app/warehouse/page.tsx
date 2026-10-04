"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Warehouse } from "lucide-react"
import { AddInventoryDialog } from "@/components/add-inventory-dialog"
import { WarehouseList } from "@/components/warehouse-list"
import Image from "next/image"
import { AdminFooter } from "@/components/admin-footer"

export default function WarehousePage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleInventoryAdded = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden shadow-glow ring-2 ring-primary/20 flex-shrink-0">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-1 sm:p-2" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent leading-tight">
                  مستودع الشحنات
                </h1>
                <p className="text-[10px] sm:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1">
                  إدارة المخزون والكميات
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-1 sm:gap-2 gradient-primary shadow-glow hover:shadow-glow-accent transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">إضافة مخزون</span>
              <span className="md:hidden">إضافة</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="space-y-4 sm:space-y-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl gradient-primary shadow-glow">
              <Warehouse className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">إدارة المستودع</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">تتبع الكميات والمخزون بسهولة</p>
            </div>
          </div>

          <WarehouseList key={refreshKey} />
        </div>
      </main>

      <AdminFooter backUrl="/admin" backLabel="الإدارة" />

      <AddInventoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onInventoryAdded={handleInventoryAdded}
      />
    </div>
  )
}
