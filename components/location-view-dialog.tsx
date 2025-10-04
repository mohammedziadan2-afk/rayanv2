"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, AlertCircle, Lock } from "lucide-react"
import type { Shipment } from "@/components/shipment-form"
import Image from "next/image"

interface LocationViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shipment: Shipment
}

export function LocationViewDialog({ open, onOpenChange, shipment }: LocationViewDialogProps) {
  const hasLocation = shipment.location && shipment.location.x !== undefined && shipment.location.y !== undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            موقع الشحنة الحالي
            <div className="mr-auto p-2 rounded-lg bg-muted">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
          </DialogTitle>
        </DialogHeader>

        {hasLocation ? (
          <div className="space-y-4">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg">
              <Image
                src="/jordan-palestine-map.jpg"
                alt="خريطة الأردن وفلسطين"
                fill
                className="object-contain"
                priority
              />
              <div
                className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${shipment.location?.x || 50}%`,
                  top: `${shipment.location?.y || 50}%`,
                }}
              >
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-50" />
                  <div className="absolute inset-0 bg-red-500 rounded-full opacity-30" />
                  <div className="absolute inset-0 bg-red-600 rounded-full shadow-lg z-10" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="font-semibold">رقم التتبع:</span>
                <span className="font-mono text-primary">{shipment.trackingNumber}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-semibold">الموقع المحدد:</span>
                <span className="text-sm text-muted-foreground">
                  X: {shipment.location?.x?.toFixed(1) || 0}% | Y: {shipment.location?.y?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 rounded-lg bg-muted/30 border-2 border-dashed border-muted-foreground/30 text-center">
            <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
              <AlertCircle className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground mb-2">لم يتم تحديد موقع لهذه الشحنة</p>
            <p className="text-sm text-muted-foreground">يمكنك تحديد الموقع من صفحة إدارة الشحنات</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
