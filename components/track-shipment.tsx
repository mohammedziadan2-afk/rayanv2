"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Package, User, Phone, MapPin, Calendar, FileText } from "lucide-react"
import type { Shipment } from "./shipment-form"
import { useRouter } from "next/navigation"

export function TrackShipment() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [notFound, setNotFound] = useState(false)
  const router = useRouter()

  const handleTrack = () => {
    if (!trackingNumber.trim()) return

    const shipments: Shipment[] = JSON.parse(localStorage.getItem("shipments") || "[]")
    const found = shipments.find((s) => s.trackingNumber === trackingNumber.trim())

    if (found) {
      setShipment(found)
      setNotFound(false)
    } else {
      setShipment(null)
      setNotFound(true)
    }
  }

  const handleViewDetails = () => {
    if (shipment) {
      router.push(`/shipment/${shipment.id}`)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-accent/10">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-accent" />
          <CardTitle>تتبع الشحنة</CardTitle>
        </div>
        <CardDescription>أدخل رقم التتبع لمعرفة تفاصيل الشحنة</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            placeholder="أدخل رقم التتبع (مثال: SH12345678901)"
            value={trackingNumber}
            onChange={(e) => {
              setTrackingNumber(e.target.value)
              setNotFound(false)
            }}
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            className="font-mono"
            dir="ltr"
            style={{ textAlign: "right" }}
          />
          <Button onClick={handleTrack} size="lg">
            <Search className="w-4 h-4 ml-2" />
            بحث
          </Button>
        </div>

        {/* Not Found Message */}
        {notFound && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
            <Package className="w-12 h-12 mx-auto text-destructive/50 mb-2" />
            <p className="text-destructive font-semibold">لم يتم العثور على الشحنة</p>
            <p className="text-sm text-muted-foreground mt-1">تأكد من رقم التتبع وحاول مرة أخرى</p>
          </div>
        )}

        {/* Shipment Details */}
        {shipment && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">تفاصيل الشحنة</h3>
                </div>
                <span className="text-xs font-mono bg-primary text-primary-foreground px-3 py-1 rounded-full">
                  {shipment.trackingNumber}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Sender Info */}
                <div className="space-y-3 p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2 text-primary">
                    <User className="w-4 h-4" />
                    <h4 className="font-semibold">المرسل</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">{shipment.senderName}</p>
                    {shipment.senderPhone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span dir="ltr">{shipment.senderPhone}</span>
                      </div>
                    )}
                    {shipment.senderAddress && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="w-3 h-3 mt-1" />
                        <span className="text-pretty">{shipment.senderAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Receiver Info */}
                <div className="space-y-3 p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2 text-accent">
                    <User className="w-4 h-4" />
                    <h4 className="font-semibold">المستقبل</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">{shipment.receiverName}</p>
                    {shipment.receiverPhone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span dir="ltr">{shipment.receiverPhone}</span>
                      </div>
                    )}
                    {shipment.receiverAddress && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="w-3 h-3 mt-1" />
                        <span className="text-pretty">{shipment.receiverAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {shipment.description && (
                <div className="mt-4 p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">وصف الشحنة</h4>
                  </div>
                  <p className="text-sm text-muted-foreground text-pretty">{shipment.description}</p>
                </div>
              )}

              {/* Date */}
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>تاريخ الإنشاء: {new Date(shipment.createdAt).toLocaleDateString("en-GB")}</span>
              </div>
            </div>

            <Button onClick={handleViewDetails} className="w-full" size="lg">
              عرض التفاصيل الكاملة والطباعة
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
