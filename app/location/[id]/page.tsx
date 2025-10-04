"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Save, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Shipment } from "@/components/shipment-form"

export default function LocationPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const shipments = JSON.parse(localStorage.getItem("shipments") || "[]")
    const found = shipments.find((s: Shipment) => s.id === params.id)
    if (found) {
      setShipment(found)
      if (found.location && typeof found.location.x === "number" && typeof found.location.y === "number") {
        setMarkerPosition({ x: found.location.x, y: found.location.y })
      }
    }
  }, [params.id])

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMarkerPosition({ x, y })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setMarkerPosition({ x, y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const saveLocation = () => {
    if (!shipment) return

    const shipments = JSON.parse(localStorage.getItem("shipments") || "[]")
    const updated = shipments.map((s: Shipment) =>
      s.id === shipment.id
        ? {
            ...s,
            location: {
              x: markerPosition.x,
              y: markerPosition.y,
              label: `${(markerPosition.x || 0).toFixed(1)}%, ${(markerPosition.y || 0).toFixed(1)}%`,
            },
          }
        : s,
    )

    localStorage.setItem("shipments", JSON.stringify(updated))
    window.dispatchEvent(new Event("shipmentsUpdated"))

    toast({
      title: "نجح",
      description: "تم حفظ موقع الشحنة بنجاح",
    })

    router.push("/")
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">جاري التحميل...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/")} className="shrink-0">
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">موقع الشحنة الحالي</h1>
            <p className="text-sm text-muted-foreground">رقم التتبع: {shipment.trackingNumber}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              خريطة الأردن وفلسطين
            </CardTitle>
            <CardDescription>اضغط أو اسحب المؤشر لتحديد موقع الشحنة على الخريطة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="relative w-full aspect-square rounded-lg overflow-hidden cursor-crosshair shadow-lg border-4 border-primary/20"
              onClick={handleMapClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                backgroundImage:
                  "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/81CAuRhlfRL._AC_SL1500_-42WftnXh9YqpuY4DPzHEm7VD0q0GLf.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 cursor-move transition-transform hover:scale-125"
                style={{
                  left: `${markerPosition.x}%`,
                  top: `${markerPosition.y}%`,
                }}
                onMouseDown={handleMouseDown}
              >
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-red-500 rounded-full opacity-30 animate-pulse" />
                  <div className="absolute inset-0 bg-red-600 rounded-full shadow-lg" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-semibold">الموقع المحدد:</p>
                <p className="text-xs text-muted-foreground">
                  X: {(markerPosition?.x || 0).toFixed(1)}% | Y: {(markerPosition?.y || 0).toFixed(1)}%
                </p>
              </div>
              <Button onClick={saveLocation} size="lg">
                <Save className="w-4 h-4 ml-2" />
                حفظ الموقع
              </Button>
            </div>

            <div className="p-4 bg-accent/10 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm">معلومات الشحنة:</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">المرسل:</span>
                  <p className="font-medium">{shipment.senderName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">المستقبل:</span>
                  <p className="font-medium">{shipment.receiverName}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
