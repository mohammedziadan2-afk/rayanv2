"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Printer, Pencil, Trash2, Package, Calculator, Tag, FileText, DollarSign } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getTrips, deleteTrip, updateTrip, type Trip } from "@/app/actions/trips"
import { getAllShipments, getShipmentById } from "@/app/actions/shipments"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { AdminFooter } from "@/components/admin-footer"

export default function TripsTablePage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tripToDelete, setTripToDelete] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [editFormData, setEditFormData] = useState<any>({})
  const [allShipments, setAllShipments] = useState<any[]>([])
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([])
  const [labelDialogOpen, setLabelDialogOpen] = useState(false)
  const [tripForLabels, setTripForLabels] = useState<Trip | null>(null)
  const [selectedShipmentsForLabels, setSelectedShipmentsForLabels] = useState<string[]>([])
  const { toast } = useToast()
  const [csrfToken, setCsrfToken] = useState<string>("")
  const [printTrip, setPrintTrip] = useState<Trip | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    loadTrips()
    loadAllShipments()

    const fetchCsrfToken = async () => {
      try {
        const response = await fetch("/api/csrf-token")
        const data = await response.json()
        if (data.token) {
          setCsrfToken(data.token)
        }
      } catch (error) {
        console.error("[v0] Error fetching CSRF token:", error)
      }
    }
    fetchCsrfToken()
  }, [])

  const loadTrips = async () => {
    setIsLoading(true)
    const data = await getTrips()
    setTrips(data)
    setIsLoading(false)
  }

  const loadAllShipments = async () => {
    const result = await getAllShipments()
    if (result.success) {
      setAllShipments(result.data)
    }
  }

  const getTobaccoRevenue = (trip: Trip) => {
    const notes = trip.notes ? JSON.parse(trip.notes) : {}
    return notes.tobacco_revenue || 0
  }

  const getOtherRevenue = (trip: Trip) => {
    const notes = trip.notes ? JSON.parse(trip.notes) : {}
    return notes.other_revenue || 0
  }

  const getTotalCosts = (trip: Trip) => {
    const notes = trip.notes ? JSON.parse(trip.notes) : {}

    const tripCosts =
      (notes.delivery_costs || 0) +
      (notes.porter_fees || 0) +
      (notes.permit_fees || 0) +
      (notes.tickets || 0) +
      (notes.employee_daily_wages || 0) +
      (notes.accommodation || 0) +
      (notes.other_costs || 0)

    const shipmentDeliveryCosts = trip.shipments.reduce((sum, shipment) => {
      return sum + (shipment.delivery_cost || 0)
    }, 0)

    return tripCosts + shipmentDeliveryCosts
  }

  const getAdditionalRevenue = (trip: Trip) => {
    const notes = trip.notes ? JSON.parse(trip.notes) : {}
    return (notes.tobacco_revenue || 0) + (notes.other_revenue || 0)
  }

  const handleViewDetails = (trip: Trip) => {
    setSelectedTrip(trip)
    setDetailsDialogOpen(true)
  }

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip)
    const notesData = trip.notes ? JSON.parse(trip.notes) : {}
    setEditFormData({
      trip_number: trip.trip_number,
      departure_date: trip.departure_date,
      people_count: notesData.people_count || 0,
      bags_count: notesData.bags_count || 0,
      delivery_costs: notesData.delivery_costs || 0,
      porter_fees: notesData.porter_fees || 0,
      permit_fees: notesData.permit_fees || 0,
      tickets: notesData.tickets || 0,
      employee_daily_wages: notesData.employee_daily_wages || 0,
      accommodation: notesData.accommodation || 0,
      other_costs: notesData.other_costs || 0,
      tobacco_revenue: notesData.tobacco_revenue || 0,
      other_revenue: notesData.other_revenue || 0,
    })
    const shipmentIds = trip.shipment_ids || []
    setSelectedShipmentIds(shipmentIds)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingTrip) return

    try {
      const notesData = {
        people_count: editFormData.people_count,
        bags_count: editFormData.bags_count,
        delivery_costs: editFormData.delivery_costs,
        porter_fees: editFormData.porter_fees,
        permit_fees: editFormData.permit_fees,
        tickets: editFormData.tickets,
        employee_daily_wages: editFormData.employee_daily_wages,
        accommodation: editFormData.accommodation,
        other_costs: editFormData.other_costs,
        tobacco_revenue: editFormData.tobacco_revenue,
        other_revenue: editFormData.other_revenue,
      }

      const result = await updateTrip(
        editingTrip.id,
        {
          trip_number: editFormData.trip_number,
          departure_date: editFormData.departure_date,
          notes: JSON.stringify(notesData),
          shipment_ids: selectedShipmentIds,
        },
        csrfToken,
      )

      if (result.success) {
        toast({
          title: "تم التحديث",
          description: "تم تحديث الرحلة بنجاح",
        })
        await loadTrips()
        setEditDialogOpen(false)
        setEditingTrip(null)
      } else {
        toast({
          title: "خطأ",
          description: result.error || "فشل تحديث الرحلة",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving trip:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الرحلة",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!tripToDelete) return

    const result = await deleteTrip(tripToDelete, csrfToken)
    if (result.success) {
      toast({
        title: "تم نقل إلى سلة المحذوفات",
        description: "تم نقل الرحلة إلى سلة المحذوفات بنجاح",
      })
      loadTrips()
    } else {
      toast({
        title: "خطأ",
        description: result.error || "فشل نقل الرحلة إلى سلة المحذوفات",
        variant: "destructive",
      })
    }
    setDeleteDialogOpen(false)
    setTripToDelete(null)
  }

  const handlePrint = (trip: Trip) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const notesData = trip.notes ? JSON.parse(trip.notes) : {}

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>طباعة الرحلة ${trip.trip_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; font-size: 18px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>تفاصيل الرحلة ${trip.trip_number}</h1>
          <div class="section">
            <p><strong>التاريخ:</strong> ${new Date(trip.departure_date).toLocaleDateString("ar-JO")}</p>
            <p><strong>عدد الأشخاص:</strong> ${notesData.people_count || 0}</p>
            <p><strong>عدد الحقائب:</strong> ${notesData.bags_count || 0}</p>
          </div>
          
          <div class="section">
            <div class="section-title">الشحنات (${trip.shipments.length})</div>
            <table>
              <thead>
                <tr>
                  <th>رقم التتبع</th>
                  <th>المرسل</th>
                  <th>المستلم</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                ${trip.shipments
                  .map(
                    (s) => `
                  <tr>
                    <td>${s.tracking_number}</td>
                    <td>${s.sender_name}</td>
                    <td>${s.receiver_name}</td>
                    <td>${s.amount} د.أ</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">التكاليف</div>
            <table>
              <tr><td>تكاليف توصيل</td><td>${notesData.delivery_costs || 0} د.أ</td></tr>
              <tr><td>أجور عتالة</td><td>${notesData.porter_fees || 0} د.أ</td></tr>
              <tr><td>تصاريح</td><td>${notesData.permit_fees || 0} د.أ</td></tr>
              <tr><td>تكتات</td><td>${notesData.tickets || 0} د.أ</td></tr>
              <tr><td>يوميات موظفين</td><td>${notesData.employee_daily_wages || 0} د.أ</td></tr>
              <tr><td>مبيت</td><td>${notesData.accommodation || 0} د.أ</td></tr>
              <tr><td>تكاليف أخرى</td><td>${notesData.other_costs || 0} د.أ</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">الإيرادات</div>
            <table>
              <tr><td>إيرادات تبغ</td><td>${notesData.tobacco_revenue || 0} د.أ</td></tr>
              <tr><td>إيرادات أخرى</td><td>${notesData.other_revenue || 0} د.أ</td></tr>
            </table>
          </div>
          
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const calculateTripBudget = (trip: Trip) => {
    const totalShipmentRevenue = trip.shipments.reduce((sum, s) => sum + Number(s.price || 0), 0)

    const notesData = trip.notes ? JSON.parse(trip.notes) : {}
    const totalCosts =
      (notesData.delivery_costs || 0) +
      (notesData.porter_fees || 0) +
      (notesData.permit_fees || 0) +
      (notesData.tickets || 0) +
      (notesData.employee_daily_wages || 0) +
      (notesData.accommodation || 0) +
      (notesData.other_costs || 0)

    const totalRevenues = totalShipmentRevenue + (notesData.tobacco_revenue || 0) + (notesData.other_revenue || 0)

    const netProfit = totalRevenues - totalCosts

    alert(`
      ميزانية الرحلة ${trip.trip_number}
      
      إيرادات الشحنات: ${totalShipmentRevenue.toFixed(2)} د.أ
      إجمالي التكاليف: ${totalCosts.toFixed(2)} د.أ
      إجمالي الإيرادات: ${totalRevenues.toFixed(2)} د.أ
      صافي الربح: ${netProfit.toFixed(2)} د.أ
    `)
  }

  const handleOpenLabelDialog = (trip: Trip) => {
    setTripForLabels(trip)
    setSelectedShipmentsForLabels([])
    setLabelDialogOpen(true)
  }

  const toggleShipmentForLabel = (shipmentId: string) => {
    setSelectedShipmentsForLabels((prev) =>
      prev.includes(shipmentId) ? prev.filter((id) => id !== shipmentId) : [...prev, shipmentId],
    )
  }

  const handlePrintLabels = async () => {
    if (!tripForLabels || selectedShipmentsForLabels.length === 0) {
      toast({
        title: "تنبيه",
        description: "الرجاء تحديد شحنة واحدة على الأقل",
        variant: "destructive",
      })
      return
    }

    try {
      const fullShipmentsData = await Promise.all(
        selectedShipmentsForLabels.map(async (shipmentId) => {
          const result = await getShipmentById(String(shipmentId))
          return result.success ? result.data : null
        }),
      )

      const selectedShipments = fullShipmentsData.filter((s) => s !== null)

      if (selectedShipments.length === 0) {
        toast({
          title: "خطأ",
          description: "فشل جلب بيانات الشحنات",
          variant: "destructive",
        })
        return
      }

      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        toast({
          title: "خطأ",
          description: "فشل فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة",
          variant: "destructive",
        })
        return
      }

      const labelsHtml = selectedShipments
        .map(
          (shipment, index) => `
        <div class="label" data-index="${index}">
          <div class="label-header">
            <img src="${window.location.origin}/images/logo.jpg" alt="Logo" class="logo" onerror="this.style.display='none'" />
            <div class="company-info">
              <h2>مؤسسة الريان واريان</h2>
              <p class="subtitle">للخدمات اللوجستية في الشحن</p>
              <p class="phone">📞 0791083443</p>
            </div>
          </div>
          <div class="divider"></div>
          <div class="receiver-info">
            <div class="info-line">
              <span class="label-key">المستلم:</span>
              <span class="label-val">${shipment.receiverName || "غير متوفر"}</span>
            </div>
            <div class="info-line">
              <span class="label-key">الهاتف:</span>
              <span class="label-val">${shipment.receiverPhone || "غير متوفر"}</span>
            </div>
            <div class="info-line">
              <span class="label-key">العنوان:</span>
              <span class="label-val">${shipment.receiverAddress || "غير متوفر"}</span>
            </div>
            ${
              shipment.receiverCountry
                ? `<div class="info-line">
              <span class="label-key">الدولة:</span>
              <span class="label-val">${shipment.receiverCountry}</span>
            </div>`
                : ""
            }
          </div>
          <div class="tracking">
            <span class="tracking-num">${shipment.trackingNumber}</span>
          </div>
        </div>
      `,
        )
        .join("")

      printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>طباعة ليبلات الشحن</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4;
              margin: 3mm;
            }
            
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-wrap: wrap;
              gap: 1.5mm;
              justify-content: space-between;
              padding: 0;
            }
            
            .label {
              width: calc(33.33% - 1mm);
              height: 72mm;
              border: 1.5px solid #000;
              padding: 1.5mm;
              background: white;
              display: flex;
              flex-direction: column;
              gap: 0.8mm;
            }
            
            .label:nth-child(12n) {
              page-break-after: always;
            }
            
            .label-header {
              display: flex;
              align-items: center;
              gap: 1.5mm;
              padding-bottom: 0.8mm;
            }
            
            .logo {
              width: 12mm;
              height: 12mm;
              object-fit: contain;
              border: 0.5px solid #ddd;
              border-radius: 1mm;
              flex-shrink: 0;
              background: white;
            }
            
            .company-info {
              flex: 1;
            }
            
            .company-info h2 {
              font-size: 8pt;
              font-weight: bold;
              margin: 0;
              line-height: 1.1;
              color: #000;
            }
            
            .subtitle {
              font-size: 6pt;
              color: #555;
              margin: 0.4mm 0;
              line-height: 1.1;
            }
            
            .phone {
              font-size: 7pt;
              font-weight: bold;
              color: #000;
              margin: 0;
              line-height: 1.1;
            }
            
            .divider {
              height: 0.8px;
              background: #000;
              margin: 0.5mm 0;
            }
            
            .receiver-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 0.6mm;
            }
            
            .info-line {
              display: flex;
              font-size: 7.5pt;
              line-height: 1.2;
              padding: 0.3mm 0;
            }
            
            .label-key {
              font-weight: bold;
              min-width: 12mm;
              color: #000;
            }
            
            .label-val {
              flex: 1;
              color: #222;
            }
            
            .tracking {
              margin-top: 0.5mm;
              padding: 1mm;
              background: #f8f8f8;
              border: 1px solid #000;
              border-radius: 1mm;
              text-align: center;
            }
            
            .tracking-num {
              display: block;
              font-size: 9pt;
              font-weight: bold;
              font-family: 'Courier New', monospace;
              letter-spacing: 0.3px;
              line-height: 1.1;
            }
            
            @media print {
              body {
                padding: 0;
              }
              
              .label {
                break-inside: avoid;
              }
              
              .logo {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
        </body>
      </html>
    `)
      printWindow.document.close()
      printWindow.print()

      setLabelDialogOpen(false)
      toast({
        title: "تم إرسال الطباعة",
        description: `تم إرسال ${selectedShipments.length} ليبل للطباعة`,
      })
      // </CHANGE>
    } catch (error) {
      console.error("Error printing labels:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء طباعة الليبلات",
        variant: "destructive",
      })
    }
  }

  const toggleShipmentSelection = (shipmentId: string) => {
    setSelectedShipmentIds((prev) =>
      prev.includes(shipmentId) ? prev.filter((id) => id !== shipmentId) : [...prev, shipmentId],
    )
  }

  const handlePrintShipments = (trip: Trip) => {
    setPrintTrip(trip)
  }

  const printReport = () => {
    // The overlay is portaled to <body> and marked as the only printable
    // node via the global print stylesheet, so the native print / save-as-PDF
    // dialog renders exactly this report and paginates naturally.
    window.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      {mounted && printTrip &&
        createPortal(
          <div
            id="trip-print-portal"
            dir="rtl"
            className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden bg-white text-black"
          >
            <style>{`
              @media print {
                /* Hide everything except this report so the native print /
                   save-as-PDF dialog shows only the shipments table. */
                body > *:not(#trip-print-portal) { display: none !important; }
                #trip-print-portal {
                  position: static !important;
                  overflow: visible !important;
                }
                #trip-print-toolbar { display: none !important; }
                @page { margin: 10mm; }
              }
              #trip-print-portal table {
                width: 100%;
                table-layout: fixed;
                border-collapse: collapse;
                margin: 16px 0;
              }
              #trip-print-portal th, #trip-print-portal td {
                border: 1px solid #333;
                padding: 6px 4px;
                text-align: right;
                font-size: 11px;
                word-break: break-word;
                overflow-wrap: anywhere;
              }
              @media (min-width: 640px) {
                #trip-print-portal th, #trip-print-portal td { padding: 10px 8px; font-size: 13px; }
              }
              #trip-print-portal th { background-color: #f2f2f2; font-weight: bold; }
              #trip-print-portal tbody tr:nth-child(even) { background-color: #f9f9f9; }
            `}</style>

            <div
              id="trip-print-toolbar"
              className="sticky top-0 flex items-center justify-center gap-3 bg-white border-b p-3"
            >
              <button
                onClick={printReport}
                className="min-h-11 rounded-lg bg-primary px-6 py-2 font-bold text-primary-foreground"
              >
                طباعة
              </button>
              <button
                onClick={() => setPrintTrip(null)}
                className="min-h-11 rounded-lg bg-muted px-6 py-2 font-bold text-foreground"
              >
                إغلاق
              </button>
            </div>

            <div className="px-2 py-4 sm:p-5">
              <h1 className="mb-6 text-center text-xl sm:text-2xl font-bold">شحنات الرحلة {printTrip.trip_number}</h1>
              <div className="mb-4 text-sm">
                <p>
                  <strong>تاريخ الرحلة:</strong>{" "}
                  {new Date(printTrip.departure_date).toLocaleDateString("ar-JO")}
                </p>
                <p>
                  <strong>عدد الشحنات:</strong> {printTrip.shipments.length}
                </p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "12%" }}>رقم التتبع</th>
                    <th style={{ width: "18%" }}>وصف الشحنة</th>
                    <th style={{ width: "15%" }}>اسم المستلم</th>
                    <th style={{ width: "18%" }}>عنوان المستلم</th>
                    <th style={{ width: "12%" }}>رقم المستلم</th>
                    <th style={{ width: "10%" }}>المبلغ</th>
                    <th style={{ width: "15%" }}>ملحوظات</th>
                  </tr>
                </thead>
                <tbody>
                  {printTrip.shipments.map((s) => (
                    <tr key={s.tracking_number}>
                      <td>{s.tracking_number}</td>
                      <td>{s.description || "-"}</td>
                      <td>{s.receiver_name}</td>
                      <td>{s.receiver_address || "-"}</td>
                      <td>{s.receiver_phone || "-"}</td>
                      <td>{s.amount} د.أ</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>,
          document.body,
        )}
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden shadow-glow ring-2 ring-primary/20 flex-shrink-0">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-1 sm:p-2" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent leading-tight">
                  مؤسسة الريان واريان للشحن
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1 hidden sm:block">
                  جدول الرحلات - إدارة رحلات التوصيل
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href="/shipment-profits">
                <Button variant="outline" className="gap-2 border-green-500 text-green-600 hover:bg-green-50">
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden sm:inline">أرباح الشحنات</span>
                  <span className="sm:hidden">أرباح</span>
                </Button>
              </Link>
              <Link href="/trip-parcels">
                <Button className="gap-2 gradient-primary shadow-glow">
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">إضافة رحلة جديدة</span>
                  <span className="sm:hidden">إضافة</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="space-y-4 sm:space-y-8">
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-8">
            <div className="p-2 sm:p-2.5 md:p-4 rounded-xl sm:rounded-2xl gradient-primary shadow-glow">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">جدول الرحلات</h2>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                عرض وإدارة جميع رحلات التوصيل
              </p>
            </div>
          </div>

          <Card className="glass-effect shadow-glow">
            <CardHeader>
              <CardTitle>قائمة الرحلات</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
              ) : trips.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد رحلات محفوظة</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الرحلة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">إيرادات إضافية</TableHead>
                      <TableHead className="text-right">مجموع التكاليف</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{trip.trip_number}</TableCell>
                        <TableCell>{new Date(trip.departure_date).toLocaleDateString("ar-JO")}</TableCell>
                        <TableCell className="text-green-600 font-medium">{getAdditionalRevenue(trip)} د.أ</TableCell>
                        <TableCell className="text-red-600 font-medium">{getTotalCosts(trip)} د.أ</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="طباعة الشحنات"
                              onClick={() => handlePrintShipments(trip)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="طباعة ليبلات"
                              onClick={() => handleOpenLabelDialog(trip)}
                            >
                              <Tag className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="ميزانية الرحلة"
                              onClick={() => calculateTripBudget(trip)}
                            >
                              <Calculator className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="تفاصيل الرحلة"
                              onClick={() => handleViewDetails(trip)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="طباعة الرحلة"
                              onClick={() => handlePrint(trip)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="تعديل الرحلة"
                              onClick={() => handleEditTrip(trip)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="نقل إلى سلة المحذوفات"
                              onClick={() => {
                                setTripToDelete(trip.id)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الرحلة {selectedTrip?.trip_number}</DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>التاريخ</Label>
                  <p className="text-sm">{new Date(selectedTrip.departure_date).toLocaleDateString("ar-JO")}</p>
                </div>
                <div>
                  <Label>عدد الأشخاص</Label>
                  <p className="text-sm">{JSON.parse(selectedTrip.notes || "{}").people_count || 0}</p>
                </div>
                <div>
                  <Label>عدد الحقائب</Label>
                  <p className="text-sm">{JSON.parse(selectedTrip.notes || "{}").bags_count || 0}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">الشحنات ({selectedTrip.shipments.length})</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم التتبع</TableHead>
                      <TableHead>المرسل</TableHead>
                      <TableHead>المستلم</TableHead>
                      <TableHead>المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTrip.shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>{shipment.tracking_number}</TableCell>
                        <TableCell>{shipment.sender_name}</TableCell>
                        <TableCell>{shipment.receiver_name}</TableCell>
                        <TableCell>{shipment.amount} د.أ</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="font-semibold mb-2">التكاليف</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(() => {
                    const notes = JSON.parse(selectedTrip.notes || "{}")
                    return (
                      <>
                        <div>تكاليف توصيل:</div>
                        <div>{notes.delivery_costs || 0} د.أ</div>
                        <div>أجور عتالة:</div>
                        <div>{notes.porter_fees || 0} د.أ</div>
                        <div>تصاريح:</div>
                        <div>{notes.permit_fees || 0} د.أ</div>
                        <div>تكتات:</div>
                        <div>{notes.tickets || 0} د.أ</div>
                        <div>يوميات موظفين:</div>
                        <div>{notes.employee_daily_wages || 0} د.أ</div>
                        <div>مبيت:</div>
                        <div>{notes.accommodation || 0} د.أ</div>
                        <div>تكاليف أخرى:</div>
                        <div>{notes.other_costs || 0} د.أ</div>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">الإيرادات</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(() => {
                    const notes = JSON.parse(selectedTrip.notes || "{}")
                    return (
                      <>
                        <div>إيرادات تبغ:</div>
                        <div>{notes.tobacco_revenue || 0} د.أ</div>
                        <div>إيرادات أخرى:</div>
                        <div>{notes.other_revenue || 0} د.أ</div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل الرحلة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>رقم الرحلة</Label>
                <Input
                  value={editFormData.trip_number || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, trip_number: e.target.value })}
                />
              </div>
              <div>
                <Label>تاريخ الرحلة</Label>
                <Input
                  type="date"
                  value={editFormData.departure_date || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, departure_date: e.target.value })}
                />
              </div>
              <div>
                <Label>عدد الأشخاص</Label>
                <Input
                  type="number"
                  value={editFormData.people_count || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, people_count: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>عدد الحقائب</Label>
                <Input
                  type="number"
                  value={editFormData.bags_count || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, bags_count: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">الشحنات في الرحلة</h3>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {allShipments
                  .filter((shipment) => {
                    const isInCurrentTrip = selectedShipmentIds.includes(shipment.id)
                    const isPending = shipment.deliveryStatus === "pending" || shipment.delivery_status === "pending"

                    const isInOtherTrip = trips.some((trip) => {
                      // تخطي الرحلة الحالية
                      if (trip.id === editingTrip?.id) return false
                      // فحص إذا كانت الشحنة في هذه الرحلة
                      const tripShipmentIds = trip.shipment_ids || []
                      return tripShipmentIds.includes(shipment.id)
                    })

                    // عرض الشحنة إذا:
                    // 1. مضافة للرحلة الحالية
                    // 2. أو حالتها قيد الانتظار وغير مضافة لأي رحلة أخرى
                    return isInCurrentTrip || (isPending && !isInOtherTrip)
                  })
                  .map((shipment) => (
                    <div key={shipment.id} className="flex items-center gap-2 p-2 hover:bg-accent/10 rounded">
                      <Checkbox
                        checked={selectedShipmentIds.includes(shipment.id)}
                        onCheckedChange={() => toggleShipmentSelection(shipment.id)}
                      />
                      <div className="flex-1 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{shipment.trackingNumber || shipment.tracking_number}</span>
                          <span className="text-muted-foreground">-</span>
                          <span>{shipment.receiverName || shipment.receiver_name}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-primary">{Number(shipment.amount || 0).toFixed(2)} د.أ</span>
                        </div>
                        {(shipment.description || shipment.shipment_type) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            الوصف: {shipment.description || shipment.shipment_type}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">عدد الشحنات المختارة: {selectedShipmentIds.length}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">التكاليف</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>تكاليف توصيل</Label>
                  <Input
                    type="number"
                    value={editFormData.delivery_costs || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, delivery_costs: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>أجور عتالة</Label>
                  <Input
                    type="number"
                    value={editFormData.porter_fees || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, porter_fees: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>تصاريح</Label>
                  <Input
                    type="number"
                    value={editFormData.permit_fees || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, permit_fees: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>تكتات</Label>
                  <Input
                    type="number"
                    value={editFormData.tickets || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, tickets: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>يوميات موظفين</Label>
                  <Input
                    type="number"
                    value={editFormData.employee_daily_wages || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, employee_daily_wages: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>مبيت</Label>
                  <Input
                    type="number"
                    value={editFormData.accommodation || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, accommodation: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>تكاليف أخرى</Label>
                  <Input
                    type="number"
                    value={editFormData.other_costs || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, other_costs: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">الإيرادات</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>إيرادات تبغ</Label>
                  <Input
                    type="number"
                    value={editFormData.tobacco_revenue || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, tobacco_revenue: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>إيرادات أخرى</Label>
                  <Input
                    type="number"
                    value={editFormData.other_revenue || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, other_revenue: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveEdit}>حفظ التعديلات</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>اختيار الشحنات لطباعة الليبلات</DialogTitle>
          </DialogHeader>
          {tripForLabels && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                اختر الشحنات التي تريد طباعة ليبلات لها من الرحلة {tripForLabels.trip_number}
              </p>
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                {tripForLabels.shipments.map((shipment) => (
                  <div key={shipment.id} className="flex items-center gap-3 p-3 hover:bg-accent/10 rounded-lg border">
                    <Checkbox
                      checked={selectedShipmentsForLabels.includes(shipment.id)}
                      onCheckedChange={() => toggleShipmentForLabel(shipment.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{shipment.tracking_number}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-sm">{shipment.receiver_name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {shipment.receiver_address}
                        {shipment.receiver_country ? `, ${shipment.receiver_country}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  عدد الشحنات المختارة: {selectedShipmentsForLabels.length}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setLabelDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handlePrintLabels} disabled={selectedShipmentsForLabels.length === 0}>
                    <Printer className="h-4 w-4 ml-2" />
                    طباعة الليبلات
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>نقل إلى سلة المحذوفات</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم نقل هذه الرحلة إلى سلة المحذوفات. يمكنك استرجاعها خلال 30 يوماً قبل الحذف النهائي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              نقل إلى سلة المحذوفات
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AdminFooter backUrl="/admin" backLabel="الإدارة" />
    </div>
  )
}
