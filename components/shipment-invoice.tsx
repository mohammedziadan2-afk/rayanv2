"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X, Package, Calendar, DollarSign, Weight, Hash, MapPin, User, Phone } from "lucide-react"
import Image from "next/image"
import type { Shipment } from "./shipment-form"

interface ShipmentInvoiceProps {
  shipment: Shipment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceNumber?: string
}

export function ShipmentInvoice({ shipment, open, onOpenChange, invoiceNumber }: ShipmentInvoiceProps) {
  if (!shipment) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex gap-3 print:hidden">
          <Button onClick={handlePrint} className="flex-1 h-12 text-base" size="lg">
            <Printer className="w-5 h-5 ml-2" />
            طباعة الاشعار
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="outline" size="lg" className="h-12">
            <X className="w-5 h-5 ml-2" />
            إغلاق
          </Button>
        </div>

        <DialogHeader className="print:hidden">
          <DialogTitle>اشعار شحن</DialogTitle>
        </DialogHeader>

        <div className="invoice-content">
          <div className="relative mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
            </div>
            <div className="relative flex items-start justify-between gap-6">
              <div className="flex items-center gap-5 flex-1">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white p-2 shadow-lg flex-shrink-0">
                  <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">مؤسسة الريان واريان</h1>
                  <p className="text-blue-100 text-lg font-medium mb-1">للخدمات اللوجستية في الشحن</p>
                  <p className="text-blue-200 text-sm font-semibold">Al-Rayan and Aryan Establishment</p>
                </div>
              </div>
              <div className="text-left bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-2xl font-bold mb-1">إشعار شحن</p>
                <p className="text-sm text-blue-100 mb-2">Shipment Notice</p>
                <div className="flex items-center gap-2 bg-white text-blue-900 px-3 py-1.5 rounded-lg">
                  <Hash className="w-4 h-4" />
                  <p className="text-sm font-bold">INV-{invoiceNumber || shipment.trackingNumber.slice(-6)}</p>
                </div>
              </div>
            </div>
            <div className="relative mt-6 pt-6 border-t border-white/20">
              <p className="text-sm text-blue-100" dir="ltr">
                📞 56893472123 | 🌐 www.alrayan.one
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="relative overflow-hidden rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-md hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/30 rounded-full -mr-10 -mt-10"></div>
              <div className="relative flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-emerald-700 font-bold uppercase tracking-wide mb-1">رقم الإشعار</p>
                  <p className="text-xl font-bold text-emerald-900" dir="ltr">
                    {invoiceNumber || shipment.trackingNumber}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-md hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/30 rounded-full -mr-10 -mt-10"></div>
              <div className="relative flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <Hash className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-amber-700 font-bold uppercase tracking-wide mb-1">رقم التتبع</p>
                  <p className="text-xl font-bold text-amber-900" dir="ltr">
                    {shipment.trackingNumber}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-5 shadow-md hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-20 h-20 bg-violet-200/30 rounded-full -mr-10 -mt-10"></div>
              <div className="relative flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-violet-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-violet-700 font-bold uppercase tracking-wide mb-1">تاريخ الاستلام</p>
                  <p className="text-xl font-bold text-violet-900">
                    {new Date(shipment.receivedDate).toLocaleDateString("ar-IQ")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Sender Card */}
            <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">معلومات المرسل</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">الاسم</p>
                    <p className="font-bold text-lg text-blue-900">{shipment.senderName}</p>
                  </div>
                </div>
                {shipment.senderPhone && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">رقم الهاتف</p>
                      <p className="font-semibold text-blue-900" dir="ltr" style={{ textAlign: "right" }}>
                        {shipment.senderPhone}
                      </p>
                    </div>
                  </div>
                )}
                {shipment.senderCountry && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">الدولة</p>
                      <p className="font-semibold text-blue-900">{shipment.senderCountry}</p>
                    </div>
                  </div>
                )}
                {shipment.senderAddress && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">العنوان</p>
                      <p className="font-medium text-sm text-blue-800 leading-relaxed">{shipment.senderAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Receiver Card */}
            <div className="rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">معلومات المستلم</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-rose-600 font-bold uppercase tracking-wide mb-1">الاسم</p>
                    <p className="font-bold text-lg text-rose-900">{shipment.receiverName}</p>
                  </div>
                </div>
                {shipment.receiverPhone && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Phone className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-rose-600 font-bold uppercase tracking-wide mb-1">رقم الهاتف</p>
                      <p className="font-semibold text-rose-900" dir="ltr" style={{ textAlign: "right" }}>
                        {shipment.receiverPhone}
                      </p>
                    </div>
                  </div>
                )}
                {shipment.receiverCountry && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-rose-600 font-bold uppercase tracking-wide mb-1">الدولة</p>
                      <p className="font-semibold text-rose-900">{shipment.receiverCountry}</p>
                    </div>
                  </div>
                )}
                {shipment.receiverAddress && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-rose-600 font-bold uppercase tracking-wide mb-1">العنوان</p>
                      <p className="font-medium text-sm text-rose-800 leading-relaxed">{shipment.receiverAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(shipment.description || shipment.weight || shipment.amount) && (
            <div className="rounded-xl border-2 border-slate-200 overflow-hidden mb-8 shadow-lg bg-white">
              <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  تفاصيل الشحنة
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {shipment.description && (
                    <div className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-100 bg-gradient-to-br from-slate-50 to-gray-50">
                      <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-1">الوصف</p>
                        <p className="font-semibold text-slate-900">{shipment.description}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shipment.weight > 0 && (
                      <div className="flex items-center gap-4 p-5 rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-sm">
                        <div className="w-12 h-12 rounded-lg bg-indigo-500 flex items-center justify-center shadow-md">
                          <Weight className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide mb-1">الوزن</p>
                          <p className="font-bold text-2xl text-indigo-900">{shipment.weight} كجم</p>
                        </div>
                      </div>
                    )}
                    {(shipment.totalAmount > 0 || shipment.amount > 0) && (
                      <div className="flex items-center gap-4 p-5 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                        <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center shadow-md">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">المبلغ الكلي</p>
                          <p className="font-bold text-2xl text-blue-900">{shipment.totalAmount || shipment.amount} د.أ</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(() => {
            const deposit = Number(shipment.deposit || 0)
            const remainingAmount = Number(shipment.amount || 0)
            const totalAmount = Number(shipment.totalAmount) > 0 
              ? Number(shipment.totalAmount) 
              : remainingAmount + deposit
            
            return (
              <div className="mt-8 space-y-4">
                {/* المبلغ الكلي */}
                <div className="rounded-xl overflow-hidden border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-blue-700 font-bold uppercase tracking-wide mb-1">المبلغ الكلي للشحنة</p>
                      <p className="text-base font-bold text-blue-900">Total Amount</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl shadow-lg">
                      <p className="text-2xl font-bold">{totalAmount.toFixed(2)} د.أ</p>
                    </div>
                  </div>
                </div>

                {/* الدفعة */}
                <div className="rounded-xl overflow-hidden border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-amber-700 font-bold uppercase tracking-wide mb-1">الدفعة المدفوعة</p>
                      <p className="text-base font-bold text-amber-900">Deposit Paid</p>
                    </div>
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl shadow-lg">
                      <p className="text-2xl font-bold">- {deposit.toFixed(2)} د.أ</p>
                    </div>
                  </div>
                </div>

                {/* باقي قيمة الشحن */}
                <div className="rounded-xl overflow-hidden border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-green-700 font-bold uppercase tracking-wide mb-1">باقي قيمة الشحن</p>
                      <p className="text-lg font-bold text-green-900">Remaining Amount</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl shadow-lg">
                      <p className="text-3xl font-bold">{remainingAmount.toFixed(2)} د.أ</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          <div className="mt-8 pt-8 border-t-2 border-slate-200">
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 border-2 border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4 text-center flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                الشروط والأحكام
              </h3>
              <div className="text-sm text-slate-700 space-y-2 leading-relaxed">
                <p>
                  • المؤسسة غير مسؤولة عن الإرساليات أو الشحنات التي تبقى أو لم تطالبوا لها بمطالبتها الجولات الرسمية
                  على إصدار الجمهور المحدودة
                </p>
                <p>• المؤسسة لا تتحمل بأي أو قيمة خسارتها أو عرابها لو تريها إلا على صفحات التبرد أو الطاقة المؤسسة</p>
                <p>
                  • المؤسسة غير مسؤولة عن لفت الموارد التحصيلية أو التصويبية التحصيل حالها ضمن البشكل إما نسب العوامل
                  الجوية أو أي عوامل سيريا للصلاحيات المشتتة عن الصغة الإجبارية على الحدود
                </p>
                <p>• جميع الشكات خاضعة للتحقق والتفتيش من قبل السلطات الخصاصة</p>
                <p>• مني هل الاستسلام للتحرك تستند معلم من سالك علاج التسلم للنافذ</p>
                <p>• الشكات غم المستلمة خلال 30 يوماً سندخل لتوزيع تدوين إضافية</p>
                <p>• المؤسسة غير مسؤولة عن الصقط المشتمل للتن عن السلع الخاملة عن الوالها</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-slate-200">
            <div className="flex justify-center">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full border-4 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                    <p className="text-xs font-bold text-blue-900">ختم المؤسسة</p>
                    <p className="text-[10px] text-blue-700">56893472123</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-700">الختم والتوقيع</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-slate-200">
            <div className="text-center space-y-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 rounded-xl p-6">
              <p className="text-xl font-bold text-slate-900">شكراً لاستخدامكم خدماتنا</p>
              <p className="text-base text-slate-600 font-medium">Thank you for using our services</p>
              <div className="inline-block bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                <p className="text-sm text-slate-700 font-mono" dir="ltr">
                  www.alrayan.one/invoice/{invoiceNumber || shipment.trackingNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            
            html, body {
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
            }
            
            * {
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            
            /* إخفاء كل شيء ما عدا الفاتورة */
            body > * {
              display: none !important;
            }
            
            body > div[data-radix-portal] {
              display: block !important;
            }
            
            /* إزالة جميع قيود overlay */
            [data-radix-dialog-overlay] {
              position: static !important;
              background: transparent !important;
              pointer-events: none !important;
            }
            
            /* إجبار dialog على العرض الكامل - أهم جزء */
            [role="dialog"],
            [data-radix-dialog-content],
            .max-w-4xl {
              position: static !important;
              display: block !important;
              width: 210mm !important;
              max-width: 210mm !important;
              min-width: 210mm !important;
              height: auto !important;
              max-height: none !important;
              min-height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: white !important;
              overflow: visible !important;
              transform: none !important;
              inset: auto !important;
              left: 0 !important;
              top: 0 !important;
              right: 0 !important;
              bottom: auto !important;
            }
            
            /* إزالة جميع قيود max-width من جميع العناصر */
            [role="dialog"] *,
            [data-radix-dialog-content] *,
            .invoice-content *,
            .max-w-4xl * {
              max-width: none !important;
            }
            
            /* محتوى الفاتورة - العرض الكامل */
            .invoice-content {
              display: block !important;
              width: 210mm !important;
              max-width: 210mm !important;
              min-width: 210mm !important;
              margin: 0 !important;
              padding: 8mm !important;
              background: white !important;
              box-sizing: border-box !important;
              overflow: visible !important;
            }
            
            /* grid و flex يجب أن يأخذوا العرض الكامل */
            .invoice-content .grid,
            .invoice-content .flex,
            .invoice-content > div {
              width: 100% !important;
              max-width: none !important;
            }
            
            /* أحجام الخطوط */
            .invoice-content {
              font-size: 9pt !important;
              line-height: 1.3 !important;
            }
            
            .invoice-content h1 {
              font-size: 16pt !important;
              line-height: 1.2 !important;
            }
            
            .invoice-content h2 {
              font-size: 13pt !important;
            }
            
            .invoice-content h3 {
              font-size: 11pt !important;
            }
            
            .invoice-content .text-3xl {
              font-size: 15pt !important;
            }
            
            .invoice-content .text-2xl {
              font-size: 13pt !important;
            }
            
            .invoice-content .text-xl {
              font-size: 11pt !important;
            }
            
            .invoice-content .text-lg {
              font-size: 10pt !important;
            }
            
            .invoice-content .text-base {
              font-size: 9pt !important;
            }
            
            .invoice-content .text-sm {
              font-size: 8pt !important;
            }
            
            .invoice-content .text-xs {
              font-size: 7pt !important;
            }
            
            /* المسافات */
            .invoice-content .mb-8 {
              margin-bottom: 4mm !important;
            }
            
            .invoice-content .mb-6 {
              margin-bottom: 3mm !important;
            }
            
            .invoice-content .mb-5 {
              margin-bottom: 2.5mm !important;
            }
            
            .invoice-content .mb-4 {
              margin-bottom: 2mm !important;
            }
            
            .invoice-content .mb-3 {
              margin-bottom: 1.5mm !important;
            }
            
            .invoice-content .mb-2 {
              margin-bottom: 1mm !important;
            }
            
            .invoice-content .mb-1 {
              margin-bottom: 0.5mm !important;
            }
            
            .invoice-content .mt-8 {
              margin-top: 4mm !important;
            }
            
            .invoice-content .mt-6 {
              margin-top: 3mm !important;
            }
            
            .invoice-content .mt-4 {
              margin-top: 2mm !important;
            }
            
            .invoice-content .mt-2 {
              margin-top: 1mm !important;
            }
            
            .invoice-content .mt-1 {
              margin-top: 0.5mm !important;
            }
            
            .invoice-content .p-6 {
              padding: 2.5mm !important;
            }
            
            .invoice-content .p-4 {
              padding: 1.5mm !important;
            }
            
            .invoice-content .pt-6 {
              padding-top: 2.5mm !important;
            }
            
            .invoice-content .pt-4 {
              padding-top: 1.5mm !important;
            }
            
            .invoice-content .pb-4 {
              padding-bottom: 1.5mm !important;
            }
            
            .invoice-content .px-6 {
              padding-left: 2.5mm !important;
              padding-right: 2.5mm !important;
            }
            
            .invoice-content .py-4 {
              padding-top: 1.5mm !important;
              padding-bottom: 1.5mm !important;
            }
            
            .invoice-content .gap-6 {
              gap: 2.5mm !important;
            }
            
            .invoice-content .gap-4 {
              gap: 1.5mm !important;
            }
            
            .invoice-content .gap-3 {
              gap: 1.2mm !important;
            }
            
            .invoice-content .space-y-4 > * + * {
              margin-top: 1.5mm !important;
            }
            
            .invoice-content .space-y-2 > * + * {
              margin-top: 0.8mm !important;
            }
            
            /* الحدود */
            .invoice-content .border-2 {
              border-width: 0.5pt !important;
            }
            
            .invoice-content .border-4 {
              border-width: 1pt !important;
            }
            
            /* الأيقونات */
            .invoice-content svg {
              width: 10px !important;
              height: 10px !important;
            }
            
            .invoice-content .w-12.h-12 svg {
              width: 14px !important;
              height: 14px !important;
            }
            
            /* الصور */
            .invoice-content .w-20 {
              width: 16mm !important;
            }
            
            .invoice-content .h-20 {
              height: 16mm !important;
            }
            
            .invoice-content .w-32 {
              width: 24mm !important;
            }
            
            .invoice-content .h-32 {
              height: 24mm !important;
            }
            
            .invoice-content .w-12 {
              width: 9mm !important;
            }
            
            .invoice-content .h-12 {
              height: 9mm !important;
            }
            
            /* منع فواصل الصفحات */
            .invoice-content,
            .invoice-content > div {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            /* إخفاء أزرار الطباعة */
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
