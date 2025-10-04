"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Package } from "lucide-react"
import type { Shipment } from "./shipment-form"

interface SelectTrackingNumberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (trackingNumber: string) => void
}

export function SelectTrackingNumberDialog({ open, onOpenChange, onSelect }: SelectTrackingNumberDialogProps) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (open) {
      loadShipments()
    }
  }, [open])

  const loadShipments = () => {
    const stored = localStorage.getItem("shipments")
    if (stored) {
      const allShipments = JSON.parse(stored) as Shipment[]
      setShipments(allShipments)
    } else {
      setShipments([])
    }
  }

  const filteredShipments = shipments.filter(
    (shipment) =>
      shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.receiverName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelect = (trackingNumber: string) => {
    onSelect(trackingNumber)
    setSearchTerm("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">اختيار رقم تتبع</DialogTitle>
          <DialogDescription>اختر رقم تتبع من قائمة الشحنات المتاحة</DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن شحنة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[400px]">
          {filteredShipments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">{searchTerm ? "لا توجد نتائج للبحث" : "لا توجد شحنات متاحة"}</p>
              {!searchTerm && (
                <p className="text-sm text-muted-foreground mt-2">يرجى إضافة شحنات في صفحة إدارة الشحنات أولاً</p>
              )}
            </div>
          ) : (
            filteredShipments.map((shipment) => (
              <div
                key={shipment.id}
                className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleSelect(shipment.trackingNumber)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary-foreground bg-primary px-2 py-1 rounded font-semibold">
                        {shipment.trackingNumber}
                      </span>
                      {shipment.amount && (
                        <span className="text-xs font-semibold text-accent-foreground bg-accent px-2 py-1 rounded">
                          {shipment.amount.toFixed(2)} د.أ
                        </span>
                      )}
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-foreground">
                        من: <span className="font-normal">{shipment.senderName}</span>
                      </p>
                      <p className="font-semibold text-foreground">
                        إلى: <span className="font-normal">{shipment.receiverName}</span>
                      </p>
                      {shipment.description && (
                        <p className="text-xs text-muted-foreground mt-1">{shipment.description}</p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleSelect(shipment.trackingNumber)}>
                    اختيار
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
