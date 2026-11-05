"use client"

import { getShipmentById } from "@/app/actions/shipments"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { X, Printer } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { use, useEffect, useState } from "react"
import { CompanyStamp } from "@/components/company-stamp"

interface InvoicePageProps {
  params: Promise<{
    invoiceId: string
  }>
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const { invoiceId: shipmentId } = use(params)
  const [shipmentData, setShipmentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showStamp, setShowStamp] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const result = await getShipmentById(shipmentId)
      if (result.success && result.data) {
        setShipmentData(result.data)
      }
      setLoading(false)
    }
    fetchData()
  }, [shipmentId])

  if (loading) {
    return (
      <div className="paper min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!shipmentData) {
    notFound()
  }

  // Generate a real PDF from the invoice content and trigger a download.
  // This works reliably everywhere — including standalone PWAs and in-app
  // browsers where the native window.print() dialog is blocked by the OS.
  const handlePrint = async () => {
    if (typeof window === "undefined" || generatingPdf) return

    const content = document.getElementById("invoice-content")
    if (!content) return

    setGeneratingPdf(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        // html2canvas-pro supports modern CSS colors (oklch/lab) used by Tailwind,
        // unlike the original html2canvas which throws on them.
        import("html2canvas-pro"),
        import("jspdf"),
      ])

      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      })

      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 6
      const imgWidth = pageWidth - margin * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Single page if it fits, otherwise split across multiple pages.
      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight)
      } else {
        let heightLeft = imgHeight
        let position = margin
        pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight)
        heightLeft -= pageHeight - margin * 2
        while (heightLeft > 0) {
          position = margin - (imgHeight - heightLeft)
          pdf.addPage()
          pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight)
          heightLeft -= pageHeight - margin * 2
        }
      }

      pdf.save(`${invoiceNumber || "invoice"}.pdf`)
    } catch (e) {
      // Fallback to the browser's native print if PDF generation fails.
      try {
        window.print()
      } catch {
        alert("تعذّر إنشاء ملف PDF. الرجاء المحاولة مرة أخرى.")
      }
    } finally {
      setGeneratingPdf(false)
    }
  }

  const invoiceNumber = shipmentData.trackingNumber
    ? `INV-${shipmentData.trackingNumber.replace("SH", "")}`
    : "غير متوفر"

  const deposit = Number(shipmentData.deposit || 0)
  const remainingAmount = Number(shipmentData.price || shipmentData.amount || 0)
  const totalAmount = Number(shipmentData.total_amount) > 0 
    ? Number(shipmentData.total_amount) 
    : remainingAmount + deposit

  return (
    <div className="paper min-h-screen bg-gray-200 print:bg-white print:min-h-0">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 6mm; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .a4-invoice { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
      {/* Header Controls - hidden on print */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/invoices">
              <Button variant="ghost" size="icon" className="rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-stamp"
                  checked={showStamp}
                  onCheckedChange={(checked) => setShowStamp(checked as boolean)}
                />
                <Label htmlFor="show-stamp" className="text-sm cursor-pointer">
                  طباعة مع الختم
                </Label>
              </div>
              <Link href={`/invoices/${shipmentId}/en`}>
                <Button variant="outline" className="gap-2">
                  English
                </Button>
              </Link>
              <Button
                onClick={handlePrint}
                disabled={generatingPdf}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70"
              >
                <Printer className="w-4 h-4" />
                {generatingPdf ? "جاري الإنشاء..." : "طباعة / حفظ PDF"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* A4 Invoice */}
      <div className="print:p-0 p-4 print:block">
        <div 
          id="invoice-content"
          className="bg-white mx-auto print:mx-0 print:shadow-none shadow-2xl a4-invoice"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-blue-600 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="relative w-12 h-12 print:w-10 print:h-10 rounded overflow-hidden border border-gray-200 flex-shrink-0">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-sm print:text-xs font-bold text-gray-900">مؤسسة الريان واريان</h1>
                <p className="text-[10px] print:text-[8px] text-gray-600">للخدمات اللوجستية في الشحن</p>
              </div>
            </div>
            <div className="text-left">
              <div className="bg-blue-600 text-white px-3 py-1 rounded">
                <h2 className="text-xs print:text-[10px] font-bold">إشعار شحن</h2>
              </div>
              <p className="text-[10px] print:text-[8px] text-gray-600 mt-1">
                رقم: <span className="font-mono font-bold text-blue-600">{invoiceNumber}</span>
              </p>
            </div>
          </div>

          {/* Invoice Info Row */}
          <div className="grid grid-cols-3 gap-1 mb-2">
            <div className="bg-gray-50 p-1.5 rounded border text-center">
              <p className="text-gray-500 text-[8px]">رقم التتبع</p>
              <p className="font-mono font-bold text-gray-900 text-[10px]">{shipmentData.trackingNumber || "-"}</p>
            </div>
            <div className="bg-gray-50 p-1.5 rounded border text-center">
              <p className="text-gray-500 text-[8px]">تاريخ الاستلام</p>
              <p className="font-bold text-gray-900 text-[10px]">
                {shipmentData.receivedDate ? new Date(shipmentData.receivedDate).toLocaleDateString("en-GB") : "-"}
              </p>
            </div>
            <div className="bg-gray-50 p-1.5 rounded border text-center">
              <p className="text-gray-500 text-[8px]">حالة الدفع</p>
              <p className={`font-bold text-[10px] ${shipmentData.paymentStatus === "paid" ? "text-green-600" : "text-red-600"}`}>
                {shipmentData.paymentStatus === "paid" ? "مدفوع" : "غير مدفوع"}
              </p>
            </div>
          </div>

          {/* Sender & Receiver */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="border rounded overflow-hidden">
              <div className="bg-blue-600 text-white px-2 py-1">
                <h3 className="font-bold text-[10px]">معلومات المرسل</h3>
              </div>
              <div className="p-1.5 space-y-0.5 text-[9px]">
                <div className="flex"><span className="text-gray-500 w-14">الاسم:</span><span className="font-semibold">{shipmentData.senderName || "-"}</span></div>
                {shipmentData.senderIdNumber && <div className="flex"><span className="text-gray-500 w-14">الهوية:</span><span>{shipmentData.senderIdNumber}</span></div>}
                <div className="flex"><span className="text-gray-500 w-14">الهاتف:</span><span dir="ltr">{shipmentData.senderPhone || "-"}</span></div>
                <div className="flex"><span className="text-gray-500 w-14">العنوان:</span><span>{shipmentData.senderAddress || "-"}</span></div>
                <div className="flex"><span className="text-gray-500 w-14">الدولة:</span><span>{shipmentData.senderCountry || "-"}</span></div>
              </div>
            </div>
            <div className="border rounded overflow-hidden">
              <div className="bg-green-600 text-white px-2 py-1">
                <h3 className="font-bold text-[10px]">معلومات المستلم</h3>
              </div>
              <div className="p-1.5 space-y-0.5 text-[9px]">
                <div className="flex"><span className="text-gray-500 w-14">الاسم:</span><span className="font-semibold">{shipmentData.receiverName || "-"}</span></div>
                <div className="flex"><span className="text-gray-500 w-14">الهاتف:</span><span dir="ltr">{shipmentData.receiverPhone || "-"}</span></div>
                <div className="flex"><span className="text-gray-500 w-14">العنوان:</span><span>{shipmentData.receiverAddress || "-"}</span></div>
                <div className="flex"><span className="text-gray-500 w-14">الدولة:</span><span>{shipmentData.receiverCountry || "-"}</span></div>
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          <div className="border rounded overflow-hidden mb-2">
            <div className="bg-gray-700 text-white px-2 py-1">
              <h3 className="font-bold text-[10px]">تفاصيل الشحنة</h3>
            </div>
            <div className="p-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[9px]">
              <div className="flex"><span className="text-gray-500">الوصف:</span><span className="mr-1">{shipmentData.description || "-"}</span></div>
              <div className="flex"><span className="text-gray-500">الوزن:</span><span className="mr-1">{shipmentData.weight ? `${shipmentData.weight} كغ` : "-"}</span></div>
              {shipmentData.notes && <div className="flex w-full"><span className="text-gray-500">ملاحظات:</span><span className="mr-1">{shipmentData.notes}</span></div>}
            </div>
          </div>

          {/* Amounts Section */}
          <div className="border rounded overflow-hidden mb-2">
            <div className="bg-emerald-600 text-white px-2 py-1">
              <h3 className="font-bold text-[10px]">تفاصيل المبالغ</h3>
            </div>
            <div className="p-2 space-y-1">
              <div className="flex justify-between items-center p-1.5 bg-blue-50 rounded border border-blue-200">
                <span className="font-bold text-blue-800 text-[10px]">المبلغ الكلي للشحنة:</span>
                <span className="text-sm font-bold text-blue-800">{totalAmount.toFixed(2)} د.أ</span>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-amber-50 rounded border border-amber-200">
                <span className="font-bold text-amber-800 text-[10px]">الدفعة المدفوعة:</span>
                <span className="text-sm font-bold text-amber-800">- {deposit.toFixed(2)} د.أ</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-100 rounded border-2 border-green-400">
                <span className="font-bold text-green-800 text-xs">باقي قيمة الشحن:</span>
                <span className="text-base font-bold text-green-800">{remainingAmount.toFixed(2)} د.أ</span>
              </div>
            </div>
          </div>

          {/* Terms - Very Compact */}
          <div className="bg-gray-50 rounded p-1.5 border mb-2">
            <h3 className="font-bold text-gray-700 text-[8px] mb-0.5">الشروط والأحكام</h3>
            <div className="text-[7px] text-gray-600 leading-tight">
              <p>• المؤسسة غير مسؤولة عن البضاعة التي تتلفها أو تحتجزها الجهات الرسمية على المعابر الحدودية.</p>
              <p>• المؤسسة لا تتحمل تكاليف أي قيمة جمركية أو غرامة أو ضريبة على محتويات الطرد.</p>
              <p>• جميع الشحنات خاضعة للفحص والتفتيش من قبل السلطات المختصة.</p>
              <p>• يجب على المستلم تقديم هوية صالحة عند استلام الشحنة.</p>
            </div>
          </div>

          {/* Stamp & Signature - Inline */}
          <div className="flex justify-between items-center border-t pt-2">
            {showStamp && (
              <CompanyStamp
                date={shipmentData.createdAt ? new Date(shipmentData.createdAt).toLocaleDateString("en-GB") : undefined}
                className="w-16 h-16 print:w-14 print:h-14"
              />
            )}
            <div className="text-center flex-1">
              <p className="text-[9px] text-gray-600 font-semibold">شكراً لاستخدامكم خدماتنا</p>
              <div className="flex justify-center items-center gap-2 text-[8px] text-gray-500">
                <span>+962 79 108 3443</span>
                <span>|</span>
                <span>عمان - الياسمين</span>
              </div>
            </div>
            <div className="text-center">
              {shipmentData.receiver_signature ? (
                <div className="w-24 h-12 border border-gray-300 rounded overflow-hidden bg-white">
                  <img 
                    src={shipmentData.receiver_signature || "/placeholder.svg"} 
                    alt="توقيع المستلم" 
                    className="w-full h-full object-contain"
                  />
                  <p className="text-[7px] text-gray-500 mt-0.5">توقيع المستلم</p>
                </div>
              ) : (
                <div className="border-t border-gray-400 w-24 pt-0.5">
                  <p className="text-[8px] text-gray-600">توقيع المستلم</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        .a4-invoice {
          width: 210mm;
          max-width: 210mm;
          min-height: auto;
          padding: 8mm;
          box-sizing: border-box;
          font-size: 11px;
        }
        
        @media screen and (max-width: 800px) {
          .a4-invoice {
            width: 100%;
            max-width: 100%;
            min-height: auto;
            padding: 12px;
          }
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 5mm !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          .min-h-screen {
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
          }
          
          .bg-gray-200 {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .print\\:p-0, .p-4 {
            padding: 0 !important;
          }
          
          .a4-invoice {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            padding: 3mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            transform: scale(0.85) !important;
            transform-origin: top center !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .shadow-2xl {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}
