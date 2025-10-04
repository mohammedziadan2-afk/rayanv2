"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Package, User, Phone, MapPin, Calendar, FileText, ArrowRight, Sparkles } from "lucide-react"
import type { Shipment } from "@/components/shipment-form"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { LocationViewDialog } from "@/components/location-view-dialog"

export default function TrackPage() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showLocationDialog, setShowLocationDialog] = useState(false)
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-glow ring-2 ring-primary/20">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-2" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                  مؤسسة الريان واريان للشحن
                </h1>
                <p className="text-sm text-muted-foreground font-semibold mt-1">تتبع الشحنات</p>
              </div>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                className="gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent"
              >
                <ArrowRight className="w-4 h-4" />
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl border-2 border-primary/20 overflow-hidden">
            <CardHeader className="gradient-primary text-primary-foreground border-b-2 border-primary/20">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                  <Search className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-4xl font-bold">تتبع الشحنة</CardTitle>
                  <CardDescription className="text-primary-foreground/90 text-base mt-2">
                    أدخل رقم التتبع لمعرفة تفاصيل الشحنة وحالتها الحالية
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-10 space-y-8 p-10">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                  <Input
                    placeholder="أدخل رقم التتبع (مثال: SH12345678901)"
                    value={trackingNumber}
                    onChange={(e) => {
                      setTrackingNumber(e.target.value)
                      setNotFound(false)
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                    className="font-mono text-lg h-16 pr-14 border-2 focus:border-primary shadow-md"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                  />
                </div>
                <Button
                  onClick={handleTrack}
                  size="lg"
                  className="px-12 h-16 text-lg gradient-primary shadow-glow hover:shadow-glow-accent transition-all duration-300"
                >
                  <Search className="w-6 h-6 ml-2" />
                  بحث
                </Button>
              </div>

              {notFound && (
                <div className="p-10 rounded-2xl bg-gradient-to-br from-destructive/10 to-destructive/5 border-2 border-destructive/30 text-center animate-in fade-in duration-300 shadow-lg">
                  <div className="p-5 rounded-full bg-destructive/20 w-fit mx-auto mb-6">
                    <Package className="w-24 h-24 text-destructive" />
                  </div>
                  <p className="text-destructive font-bold text-2xl mb-3">لم يتم العثور على الشحنة</p>
                  <p className="text-muted-foreground">تأكد من رقم التتبع وحاول مرة أخرى</p>
                </div>
              )}

              {shipment && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="p-10 rounded-2xl glass-effect border-2 border-primary/20 shadow-2xl">
                    <div className="flex items-center justify-between mb-10 pb-8 border-b-2 border-primary/20">
                      <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl gradient-primary shadow-glow">
                          <Package className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <h3 className="font-bold text-3xl">تفاصيل الشحنة</h3>
                      </div>
                      <span className="text-sm font-mono gradient-primary text-primary-foreground px-8 py-4 rounded-full font-bold shadow-glow">
                        {shipment.trackingNumber}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-5 p-8 rounded-2xl glass-effect border-2 border-primary/20 shadow-lg">
                        <div className="flex items-center gap-3 text-primary pb-4 border-b-2 border-primary/20">
                          <div className="p-3 rounded-xl bg-primary/20">
                            <User className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-xl">المرسل</h4>
                        </div>
                        <div className="space-y-4">
                          <p className="font-bold text-2xl">{shipment.senderName}</p>
                          {shipment.senderPhone && (
                            <div className="flex items-center gap-3 text-muted-foreground bg-muted/50 p-4 rounded-xl">
                              <Phone className="w-5 h-5" />
                              <span dir="ltr" className="font-medium text-base">
                                {shipment.senderPhone}
                              </span>
                            </div>
                          )}
                          {shipment.senderAddress && (
                            <div className="flex items-start gap-3 text-muted-foreground bg-muted/50 p-4 rounded-xl">
                              <MapPin className="w-5 h-5 mt-1" />
                              <span className="text-pretty leading-relaxed">{shipment.senderAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-5 p-8 rounded-2xl glass-effect border-2 border-accent/20 shadow-lg">
                        <div className="flex items-center gap-3 text-accent pb-4 border-b-2 border-accent/20">
                          <div className="p-3 rounded-xl bg-accent/20">
                            <User className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-xl">المستقبل</h4>
                        </div>
                        <div className="space-y-4">
                          <p className="font-bold text-2xl">{shipment.receiverName}</p>
                          {shipment.receiverPhone && (
                            <div className="flex items-center gap-3 text-muted-foreground bg-muted/50 p-4 rounded-xl">
                              <Phone className="w-5 h-5" />
                              <span dir="ltr" className="font-medium text-base">
                                {shipment.receiverPhone}
                              </span>
                            </div>
                          )}
                          {shipment.receiverAddress && (
                            <div className="flex items-start gap-3 text-muted-foreground bg-muted/50 p-4 rounded-xl">
                              <MapPin className="w-5 h-5 mt-1" />
                              <span className="text-pretty leading-relaxed">{shipment.receiverAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {shipment.description && (
                      <div className="mt-6 p-8 rounded-2xl glass-effect border-2 border-muted shadow-lg">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="p-3 rounded-xl bg-muted">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <h4 className="font-bold text-xl">وصف الشحنة</h4>
                        </div>
                        <p className="text-muted-foreground text-pretty leading-relaxed text-base">
                          {shipment.description}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 flex items-center gap-4 bg-muted/50 p-5 rounded-xl">
                      <Calendar className="w-6 h-6 text-muted-foreground" />
                      <span className="font-semibold text-base">
                        تاريخ الإنشاء: {new Date(shipment.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleViewDetails}
                      className="flex-1 h-16 text-xl gradient-primary shadow-glow hover:shadow-glow-accent transition-all duration-300"
                      size="lg"
                    >
                      <Sparkles className="w-6 h-6 ml-2" />
                      عرض التفاصيل الكاملة والطباعة
                    </Button>
                    <Button
                      onClick={() => setShowLocationDialog(true)}
                      variant="outline"
                      className="flex-1 h-16 text-xl border-2 border-primary/30 hover:bg-primary/10 shadow-lg hover:shadow-glow transition-all duration-300"
                      size="lg"
                    >
                      <MapPin className="w-6 h-6 ml-2" />
                      موقع الشحنة الحالي
                    </Button>
                  </div>

                  <LocationViewDialog
                    open={showLocationDialog}
                    onOpenChange={setShowLocationDialog}
                    shipment={shipment}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
