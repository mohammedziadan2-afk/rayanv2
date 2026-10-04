"use client"

import { getShipmentById } from "@/app/actions/shipments"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { X, Printer } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useEffect, useState } from "react"
import { CompanyStamp } from "@/components/company-stamp"

interface InvoicePageProps {
  params: {
    invoiceId: string
  }
}

export default function InvoiceEnglishPage({ params }: InvoicePageProps) {
  const shipmentId = params.invoiceId
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!shipmentData) {
    notFound()
  }

  const handlePrint = async () => {
    if (typeof window === "undefined" || generatingPdf) return

    const content = document.getElementById("invoice-content")
    if (!content) return

    setGeneratingPdf(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
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
      try {
        window.print()
      } catch {
        alert("Failed to generate PDF. Please try again.")
      }
    } finally {
      setGeneratingPdf(false)
    }
  }

  const invoiceNumber = shipmentData.trackingNumber
    ? `INV-${shipmentData.trackingNumber.replace("SH", "")}`
    : "N/A"

  const deposit = Number(shipmentData.deposit || 0)
  const remainingAmount = Number(shipmentData.price || shipmentData.amount || 0)
  const totalAmount = Number(shipmentData.total_amount) > 0 
    ? Number(shipmentData.total_amount) 
    : remainingAmount + deposit

  const formatDate = (date: string) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Pending",
      processing: "Processing",
      "in-transit": "In Transit",
      "out-for-delivery": "Out for Delivery",
      delivered: "Delivered",
      cancelled: "Cancelled",
      returned: "Returned",
    }
    return map[status] || status
  }

  return (
    <div className="min-h-screen bg-gray-200 print:bg-white print:min-h-0">
      {/* Header Controls */}
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
                  Print with stamp
                </Label>
              </div>
              <Link href={`/invoices/${shipmentId}`}>
                <Button variant="outline" className="gap-2">
                  Arabic Version
                </Button>
              </Link>
              <Button
                onClick={handlePrint}
                disabled={generatingPdf}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70"
              >
                <Printer className="w-4 h-4" />
                {generatingPdf ? "Generating..." : "Print / Save PDF"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* A4 Invoice */}
      <div className="print:p-0 p-4 print:block">
        <div 
          id="invoice-content"
          className="bg-white mx-auto print:mx-0 print:shadow-none shadow-2xl a4-invoice-en"
          dir="ltr"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-blue-600 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 print:w-12 print:h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                <Image src="/images/logo.jpg" alt="Al-Rayan Logo" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-base print:text-sm font-bold text-gray-900">Al-Rayan & Aryan Establishment</h1>
                <p className="text-[11px] print:text-[9px] text-gray-500">Logistics & Shipping Services</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-blue-600 text-white px-4 py-1.5 rounded-md inline-block">
                <h2 className="text-sm print:text-xs font-bold tracking-wide">SHIPPING NOTICE</h2>
              </div>
              <p className="text-[11px] print:text-[9px] text-gray-600 mt-1.5">
                No: <span className="font-mono font-bold text-blue-600">{invoiceNumber}</span>
              </p>
            </div>
          </div>

          {/* Info Row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-gray-50 p-2 rounded border text-center">
              <p className="text-gray-500 text-[9px] uppercase tracking-wide font-medium">Tracking Number</p>
              <p className="font-mono font-bold text-gray-900 text-[11px] mt-0.5">{shipmentData.trackingNumber || "-"}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded border text-center">
              <p className="text-gray-500 text-[9px] uppercase tracking-wide font-medium">Date Received</p>
              <p className="font-bold text-gray-900 text-[11px] mt-0.5">{formatDate(shipmentData.receivedDate)}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded border text-center">
              <p className="text-gray-500 text-[9px] uppercase tracking-wide font-medium">Payment Status</p>
              <p className={`font-bold text-[11px] mt-0.5 ${shipmentData.paymentStatus === "paid" ? "text-green-600" : "text-red-600"}`}>
                {shipmentData.paymentStatus === "paid" ? "Paid" : "Unpaid"}
              </p>
            </div>
          </div>

          {/* Sender & Receiver */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-blue-600 text-white px-3 py-1.5">
                <h3 className="font-bold text-[11px] uppercase tracking-wide">Sender Information</h3>
              </div>
              <div className="p-2 space-y-1 text-[10px]">
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 font-medium">Name:</span>
                  <span className="font-semibold text-gray-900">{shipmentData.senderName || "-"}</span>
                </div>
                {shipmentData.senderIdNumber && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-16 font-medium">ID:</span>
                    <span className="text-gray-900">{shipmentData.senderIdNumber}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 font-medium">Phone:</span>
                  <span className="text-gray-900">{shipmentData.senderPhone || "-"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 font-medium">Address:</span>
                  <span className="text-gray-900">{shipmentData.senderAddress || "-"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 font-medium">Country:</span>
                  <span className="text-gray-900">{shipmentData.senderCountry || "-"}</span>
                </div>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-green-600 text-white px-3 py-1.5">
                <h3 className="font-bold text-[11px] uppercase tracking-wide">Receiver Information</h3>
              </div>
              <div className="p-2 space-y-1 text-[10px]">
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 font-medium">Name:</span>
                  <span className="font-semibold text-gray-900">{shipmentData.receiverName || "-"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 font-medium">Phone:</span>
                  <span className="text-gray-900">{shipmentData.receiverPhone || "-"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 font-medium">Address:</span>
                  <span className="text-gray-900">{shipmentData.receiverAddress || "-"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 font-medium">Country:</span>
                  <span className="text-gray-900">{shipmentData.receiverCountry || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          <div className="border rounded-lg overflow-hidden mb-3">
            <div className="bg-gray-700 text-white px-3 py-1.5">
              <h3 className="font-bold text-[11px] uppercase tracking-wide">Shipment Details</h3>
            </div>
            <div className="p-2">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 font-medium text-gray-500 uppercase text-[9px]">Description</th>
                    <th className="text-left py-1 font-medium text-gray-500 uppercase text-[9px]">Weight</th>
                    <th className="text-left py-1 font-medium text-gray-500 uppercase text-[9px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1.5 text-gray-900 font-medium">{shipmentData.description || "-"}</td>
                    <td className="py-1.5 text-gray-900">{shipmentData.weight ? `${shipmentData.weight} KG` : "-"}</td>
                    <td className="py-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                        shipmentData.status === "delivered" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {getStatusLabel(shipmentData.status)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              {shipmentData.notes && (
                <div className="mt-1.5 pt-1.5 border-t text-[10px]">
                  <span className="text-gray-500 font-medium">Notes: </span>
                  <span className="text-gray-900">{shipmentData.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Amounts */}
          <div className="border rounded-lg overflow-hidden mb-3">
            <div className="bg-emerald-600 text-white px-3 py-1.5">
              <h3 className="font-bold text-[11px] uppercase tracking-wide">Payment Summary</h3>
            </div>
            <div className="p-2.5 space-y-1.5">
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200">
                <span className="font-bold text-blue-800 text-[11px]">Total Shipment Amount</span>
                <span className="text-sm font-bold text-blue-800">{totalAmount.toFixed(2)} JOD</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-amber-50 rounded border border-amber-200">
                <span className="font-bold text-amber-800 text-[11px]">Deposit Paid</span>
                <span className="text-sm font-bold text-amber-800">- {deposit.toFixed(2)} JOD</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-green-100 rounded-lg border-2 border-green-400">
                <span className="font-bold text-green-800 text-xs">Remaining Balance</span>
                <span className="text-base font-bold text-green-800">{remainingAmount.toFixed(2)} JOD</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-gray-50 rounded-lg p-2 border mb-3">
            <h3 className="font-bold text-gray-700 text-[9px] mb-1 uppercase tracking-wide">Terms & Conditions</h3>
            <div className="text-[8px] text-gray-600 leading-relaxed space-y-0.5">
              <p>{'- The establishment is not responsible for goods confiscated or damaged by official border authorities.'}</p>
              <p>{'- The establishment does not bear any customs duties, fines, or taxes on parcel contents.'}</p>
              <p>{'- All shipments are subject to inspection by the relevant authorities.'}</p>
              <p>{'- The recipient must present a valid ID upon receiving the shipment.'}</p>
              <p>{'- Shipments unclaimed within 30 days will incur additional storage fees.'}</p>
            </div>
          </div>

          {/* Stamp & Signature */}
          <div className="flex justify-between items-center border-t pt-2.5">
            {showStamp && (
              <CompanyStamp
                date={shipmentData.createdAt ? new Date(shipmentData.createdAt).toLocaleDateString("en-GB") : undefined}
                className="w-16 h-16 print:w-14 print:h-14"
              />
            )}
            <div className="text-center flex-1">
              <p className="text-[10px] text-gray-700 font-semibold">Thank you for using our services</p>
              <div className="flex justify-center items-center gap-2 text-[9px] text-gray-500 mt-0.5">
                <span>+962 79 108 3443</span>
                <span>|</span>
                <span>Amman - Al Yasmin</span>
              </div>
              <p className="text-[8px] text-gray-400 mt-0.5">www.alrayan.one</p>
            </div>
            <div className="text-center">
              {shipmentData.receiver_signature ? (
                <div className="w-24 h-12 border border-gray-300 rounded overflow-hidden bg-white">
                  <img 
                    src={shipmentData.receiver_signature || "/placeholder.svg"} 
                    alt="Receiver Signature" 
                    className="w-full h-full object-contain"
                  />
                  <p className="text-[7px] text-gray-500 mt-0.5">Receiver Signature</p>
                </div>
              ) : (
                <div className="border-t border-gray-400 w-24 pt-1">
                  <p className="text-[9px] text-gray-600">Receiver Signature</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        .a4-invoice-en {
          width: 210mm;
          max-width: 210mm;
          min-height: auto;
          padding: 10mm;
          box-sizing: border-box;
          font-size: 11px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        @media screen and (max-width: 800px) {
          .a4-invoice-en {
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
          
          .a4-invoice-en {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            padding: 5mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            transform: scale(0.88) !important;
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
