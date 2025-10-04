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
import { PackagePlus } from "lucide-react"
import { ShipmentForm } from "@/components/shipment-form"

export function AddShipmentButton() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1 sm:gap-2 p-2 sm:px-4">
          <PackagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">إضافة شحنة جديدة</span>
        </Button>
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
