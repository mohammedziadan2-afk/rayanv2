"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X, Package, Calendar, DollarSign, Weight } from "lucide-react"
import Image from "next/image"
import type { Shipment } from "./shipment-form"

interface ShipmentInvoiceProps {
  shipment: Shipment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShipmentInvoice({ shipment, open, onOpenChange }: ShipmentInvoiceProps) {
  if (!shipment) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-full print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle>إشعار شحن</DialogTitle>
        </DialogHeader>

        <div className="print:p-8" id="invoice-content">
          {/* Header Section - شريط علوي بتصميم احترافي */}
          <div className="relative mb-8 overflow-hidden rounded-2xl gradient-primary p-8 text-white shadow-glow">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white shadow-xl ring-4 ring-white/20">
                  <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-3" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">مؤسسة الريان واريان للشحن</h1>
                  <p className="text-white/90 text-lg">خدمات الشحن والتوصيل السريع</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm mb-1">إشعار شحن</p>
                <p className="text-4xl font-bold">INVOICE</p>
              </div>
            </div>
          </div>

          {/* Tracking Number & Date - بطاقة بارزة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="glass-effect rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">رقم التتبع</p>
              </div>
              <p className="text-2xl font-bold text-primary" dir="ltr">
                {shipment.trackingNumber}
              </p>
            </div>

            <div className="glass-effect rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">تاريخ الاستلام</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {new Date(shipment.receivedDate).toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>

          {/* Sender and Receiver - تصميم متقابل احترافي */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Sender Card */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-primary/20">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">من</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary">معلومات المرسل</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1.5 uppercase tracking-wide">الاسم</p>
                    <p className="font-bold text-lg text-foreground">{shipment.senderName}</p>
                  </div>
                  {shipment.senderPhone && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1.5 uppercase tracking-wide">
                        رقم الهاتف
                      </p>
                      <p className="font-semibold text-foreground" dir="ltr" style={{ textAlign: "right" }}>
                        {shipment.senderPhone}
                      </p>
                    </div>
                  )}
                  {shipment.senderCountry && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1.5 uppercase tracking-wide">
                        الدولة
                      </p>
                      <p className="font-semibold text-foreground">{shipment.senderCountry}</p>
                    </div>
                  )}
                  {shipment.senderAddress && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1.5 uppercase tracking-wide">
                        العنوان
                      </p>
                      <p className="font-medium text-sm text-foreground leading-relaxed">{shipment.senderAddress}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Receiver Card */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 p-6 shadow-lg">
              <div className="absolute top-0 left-0 w-32 h-32 bg-accent/10 rounded-full -translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-accent/20">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">إلى</span>
                  </div>
                  <h3 className="text-xl font-bold text-accent">معلومات المستقبل</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1.5 uppercase tracking-wide">الاسم</p>
                    <p className="font-bold text-lg text-foreground">{shipment.receiverName}</p>
                  </div>
                  {shipment.receiverPhone && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1.5 uppercase tracking-wide">
                        رقم الهاتف
                      </p>
                      <p className="font-semibold text-foreground" dir="ltr" style={{ textAlign: "right" }}>
                        {shipment.receiverPhone}
                      </p>
                    </div>
                  )}
                  {shipment.receiverCountry && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1.5 uppercase tracking-wide">
                        الدولة
                      </p>
                      <p className="font-semibold text-foreground">{shipment.receiverCountry}</p>
                    </div>
                  )}
                  {shipment.receiverAddress && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1.5 uppercase tracking-wide">
                        العنوان
                      </p>
                      <p className="font-medium text-sm text-foreground leading-relaxed">{shipment.receiverAddress}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Shipment Details - جدول احترافي */}
          {(shipment.description || shipment.weight || shipment.amount) && (
            <div className="rounded-2xl border-2 border-border overflow-hidden shadow-lg mb-8">
              <div className="bg-muted/50 px-6 py-4 border-b-2 border-border">
                <h3 className="text-xl font-bold text-foreground">تفاصيل الشحنة</h3>
              </div>
              <div className="bg-card p-6">
                <div className="grid grid-cols-1 gap-4">
                  {shipment.description && (
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wide">
                          الوصف
                        </p>
                        <p className="font-semibold text-foreground">{shipment.description}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shipment.weight > 0 && (
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Weight className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wide">
                            الوزن
                          </p>
                          <p className="font-bold text-lg text-foreground">{shipment.weight} كجم</p>
                        </div>
                      </div>
                    )}
                    {shipment.amount > 0 && (
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/10 border-2 border-accent/20">
                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wide">
                            قيمة الشحن
                          </p>
                          <p className="font-bold text-2xl text-accent">{shipment.amount} د.أ</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer - تذييل أنيق */}
          <div className="mt-8 pt-6 border-t-2 border-border">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-foreground">شكراً لاستخدامكم خدماتنا</p>
              <p className="text-sm text-muted-foreground">مؤسسة الريان واريان للشحن - جميع الحقوق محفوظة © 2025</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 print:hidden">
          <Button onClick={handlePrint} className="flex-1 h-12 text-base" size="lg">
            <Printer className="w-5 h-5 ml-2" />
            طباعة الفاتورة
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="outline" size="lg" className="h-12">
            <X className="w-5 h-5 ml-2" />
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
