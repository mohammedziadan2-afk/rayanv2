"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, DollarSign, Package, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { getAllShipments } from "@/app/actions/shipments"

interface Shipment {
  id: string
  shipmentName: string
  senderName: string
  receiverName: string
  receiverPhone: string
  quantity: number
  amount: number
  date: string
  status: string
  notes?: string
}

interface RevenueDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RevenueDetailsDialog({ open, onOpenChange }: RevenueDetailsDialogProps) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalShipments, setTotalShipments] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const shipmentsData = await getAllShipments()

      setShipments(shipmentsData)
      const shipmentsTotal = shipmentsData.reduce((sum, shipment) => sum + (shipment.amount || 0), 0)

      setTotalRevenue(shipmentsTotal)
      setTotalShipments(shipmentsData.length)
    } catch (error) {
      console.error("Error loading revenue data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="w-6 h-6 text-green-500" />
            تفاصيل الإيرادات
          </DialogTitle>
          <DialogDescription>إجمالي الإيرادات من جميع الشحنات المسجلة</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 print:space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-effect border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                    <p className="text-2xl font-bold text-green-500">{totalRevenue.toLocaleString()} د.ع</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-orange-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-orange-500/10">
                    <TrendingUp className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">عدد الشحنات</p>
                    <p className="text-2xl font-bold text-orange-500">{totalShipments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {shipments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" />
                تفاصيل الشحنات ({shipments.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {shipments.map((shipment) => (
                  <Card key={shipment.id} className="glass-effect hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <p className="font-semibold">{shipment.shipmentName}</p>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <p>المرسل: {shipment.senderName}</p>
                            <p>المستلم: {shipment.receiverName}</p>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(shipment.date).toLocaleDateString("en-GB")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-muted-foreground">القيمة</p>
                          <p className="text-xl font-bold text-green-500">{shipment.amount.toLocaleString()} د.ع</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {shipments.length === 0 && (
            <Card className="glass-effect">
              <CardContent className="pt-6 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">لا توجد شحنات مسجلة</p>
              </CardContent>
            </Card>
          )}

          {shipments.length > 0 && (
            <>
              <div className="flex justify-end print:hidden">
                <Button onClick={handlePrint} className="gap-2">
                  <Printer className="w-4 h-4" />
                  طباعة التقرير
                </Button>
              </div>

              <style jsx global>{`
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 10mm;
                  }
                  
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    print-color-adjust: exact;
                    -webkit-print-color-adjust: exact;
                  }
                  
                  body {
                    width: 190mm !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  
                  .print\\:hidden {
                    display: none !important;
                  }
                  
                  .print\\:space-y-4 > * + * {
                    margin-top: 4mm !important;
                  }
                }
              `}</style>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
