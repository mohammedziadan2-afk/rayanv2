"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, User, Calendar, Hash, TrendingUp, TrendingDown, Layers, Phone, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Shipment } from "./shipment-form"

interface WarehouseItem {
  id: string
  shipment_name: string
  sender_name: string
  shipment_type: string
  warehouse_quantity: number
  delivered_quantity: number
  remaining_quantity: number
  tracking_number?: string
  created_at: string
}

interface PreviewWarehouseItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: WarehouseItem | null
}

export function PreviewWarehouseItemDialog({ open, onOpenChange, item }: PreviewWarehouseItemDialogProps) {
  const [shipmentData, setShipmentData] = useState<Shipment | null>(null)

  useEffect(() => {
    if (item?.tracking_number) {
      const stored = localStorage.getItem("shipments")
      if (stored) {
        const shipments: Shipment[] = JSON.parse(stored)
        const foundShipment = shipments.find((s) => s.trackingNumber === item.tracking_number)
        setShipmentData(foundShipment || null)
      }
    } else {
      setShipmentData(null)
    }
  }, [item])

  if (!item) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">معاينة الشحنة</DialogTitle>
              <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2 bg-transparent no-print">
                <Printer className="w-4 h-4" />
                طباعة
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Section */}
            <div className="text-center p-6 rounded-lg gradient-primary">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background/20 mb-4">
                <Package className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-primary-foreground mb-2">{item.shipment_name}</h2>
              <Badge variant="secondary" className="text-sm">
                {item.shipment_type}
              </Badge>
            </div>

            {/* Tracking Number */}
            {item.tracking_number && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Hash className="w-4 h-4" />
                  <span>رقم التتبع</span>
                </div>
                <p className="text-lg font-mono font-bold">{item.tracking_number}</p>
              </div>
            )}

            <Separator />

            {/* Sender Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                معلومات المرسل
              </h3>
              <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                <p className="text-lg font-medium">{item.sender_name}</p>
                {shipmentData?.senderPhone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <p className="text-base" dir="ltr">
                      {shipmentData.senderPhone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Quantities Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                الكميات
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {/* Warehouse Quantity */}
                <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>كمية المستودع</span>
                  </div>
                  <p className="text-3xl font-bold text-primary text-center">{item.warehouse_quantity}</p>
                </div>

                {/* Delivered Quantity */}
                <div className="p-4 rounded-lg border-2 border-accent/20 bg-accent/5">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                    <TrendingDown className="w-4 h-4 text-accent" />
                    <span>الكمية المسلمة</span>
                  </div>
                  <p className="text-3xl font-bold text-accent text-center">{item.delivered_quantity}</p>
                </div>

                {/* Remaining Quantity */}
                <div className="p-4 rounded-lg border-2 border-foreground/20 bg-muted/30">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                    <Package className="w-4 h-4" />
                    <span>الكمية المتبقية</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground text-center">{item.remaining_quantity}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Date Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                معلومات التاريخ
              </h3>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <span>تاريخ الإضافة</span>
                </div>
                <p className="text-base font-medium">{formatDate(item.created_at)}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>نسبة التسليم</span>
                <span>
                  {item.warehouse_quantity > 0
                    ? Math.round((item.delivered_quantity / item.warehouse_quantity) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full gradient-primary transition-all duration-500"
                  style={{
                    width: `${item.warehouse_quantity > 0 ? (item.delivered_quantity / item.warehouse_quantity) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
