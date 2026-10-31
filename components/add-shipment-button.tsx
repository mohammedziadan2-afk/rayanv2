"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PackagePlus, Plus } from "lucide-react"
import { ShipmentForm } from "@/components/shipment-form"

interface AddShipmentButtonProps {
  variant?: "default" | "orange"
}

export function AddShipmentButton({ variant = "default" }: AddShipmentButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "orange" ? (
          <Button
            size="sm"
            className="gap-1 sm:gap-2 p-2 sm:px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
          >
            <PackagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">إضافة شحنة جديدة</span>
          </Button>
        ) : (
          <Button
            size="lg"
            variant="default"
            className="gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white border-2 border-green-400/50 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">إضافة شحنة جديدة</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">إضافة شحنة جديدة</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">أدخل تفاصيل الشحنة والمرسل والمستقبل</DialogDescription>
        </DialogHeader>
        <ShipmentForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
