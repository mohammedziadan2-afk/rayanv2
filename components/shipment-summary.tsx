"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Package, TrendingUp } from "lucide-react"
import type { Shipment } from "./shipment-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ShipmentSummary() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const loadShipments = () => {
    const stored = localStorage.getItem("shipments")
    if (stored) {
      setShipments(JSON.parse(stored))
    }
  }

  useEffect(() => {
    loadShipments()

    // Listen for updates
    const handleUpdate = () => loadShipments()
    window.addEventListener("shipmentsUpdated", handleUpdate)

    return () => window.removeEventListener("shipmentsUpdated", handleUpdate)
  }, [])

  const totalAmount = shipments.reduce((sum, shipment) => sum + (shipment.amount || 0), 0)
  const totalShipments = shipments.length
  const averageAmount = totalShipments > 0 ? totalAmount / totalShipments : 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="gap-2 bg-transparent">
          <DollarSign className="w-5 h-5" />
          مراجعة المجموع
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            ملخص الشحنات المالي
          </DialogTitle>
          <DialogDescription>إحصائيات شاملة لجميع الشحنات المسجلة</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Total Amount Card */}
          <Card className="border-2 border-primary bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                إجمالي قيمة الشحنات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{totalAmount.toFixed(2)} د.أ</p>
            </CardContent>
          </Card>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Shipments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  عدد الشحنات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{totalShipments}</p>
              </CardContent>
            </Card>

            {/* Average Amount */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  متوسط القيمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{averageAmount.toFixed(2)} د.أ</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Shipments */}
          {shipments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">آخر 5 شحنات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {shipments.slice(0, 5).map((shipment) => (
                    <div
                      key={shipment.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{shipment.senderName}</p>
                        <p className="text-xs text-muted-foreground">{shipment.trackingNumber}</p>
                      </div>
                      <p className="font-semibold text-accent">{shipment.amount?.toFixed(2) || "0.00"} د.أ</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
