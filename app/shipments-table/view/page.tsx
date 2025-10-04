"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Printer, ArrowRight } from "lucide-react"
import type { Shipment } from "@/components/shipment-form"

export default function ShipmentsTableViewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([])
  const [companyInfo, setCompanyInfo] = useState({ name: "", phone: "", address: "" })
  const startDate = searchParams.get("startDate") || ""
  const endDate = searchParams.get("endDate") || ""

  useEffect(() => {
    loadShipments()
    loadCompanyInfo()
  }, [])

  useEffect(() => {
    filterShipments()
  }, [shipments, startDate, endDate])

  const loadShipments = () => {
    const stored = localStorage.getItem("shipments")
    if (stored) {
      const parsed = JSON.parse(stored)
      setShipments(parsed)
    }
  }

  const loadCompanyInfo = () => {
    const stored = localStorage.getItem("companyInfo")
    if (stored) {
      setCompanyInfo(JSON.parse(stored))
    }
  }

  const filterShipments = () => {
    let filtered = [...shipments]

    if (startDate) {
      filtered = filtered.filter((s) => s.receivedDate >= startDate)
    }

    if (endDate) {
      filtered = filtered.filter((s) => s.receivedDate <= endDate)
    }

    setFilteredShipments(filtered)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    router.push("/shipments-table")
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-4 print:hidden">
          <Button onClick={handleBack} variant="outline" className="gap-2 bg-transparent">
            <ArrowRight className="h-4 w-4" />
            العودة إلى جدول الشحنات
          </Button>
          <Button onClick={handlePrint} className="gap-2 gradient-accent">
            <Printer className="h-4 w-4" />
            طباعة / حفظ PDF
          </Button>
        </div>

        <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
          {companyInfo.name && <h1 className="text-4xl font-bold mb-2">{companyInfo.name}</h1>}
          {companyInfo.phone && <p className="text-sm text-gray-600">هاتف: {companyInfo.phone}</p>}
          {companyInfo.address && <p className="text-sm text-gray-600">العنوان: {companyInfo.address}</p>}

          <h2 className="text-3xl font-bold mt-6 mb-4 text-blue-600">تقرير الشحنات</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-4">
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm font-semibold text-gray-700">تاريخ الطباعة</p>
              <p className="text-lg font-bold">{new Date().toLocaleDateString("ar-JO")}</p>
            </div>

            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm font-semibold text-gray-700">عدد الشحنات</p>
              <p className="text-lg font-bold text-blue-600">{filteredShipments.length}</p>
            </div>

            {startDate ? (
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm font-semibold text-gray-700">من تاريخ</p>
                <p className="text-lg font-bold">{new Date(startDate).toLocaleDateString("ar-JO")}</p>
              </div>
            ) : (
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm font-semibold text-gray-700">من تاريخ</p>
                <p className="text-lg font-bold">غير محدد</p>
              </div>
            )}

            {endDate ? (
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm font-semibold text-gray-700">إلى تاريخ</p>
                <p className="text-lg font-bold">{new Date(endDate).toLocaleDateString("ar-JO")}</p>
              </div>
            ) : (
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm font-semibold text-gray-700">إلى تاريخ</p>
                <p className="text-lg font-bold">غير محدد</p>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200">
                <TableHead className="text-right font-bold border border-gray-300">رقم التتبع</TableHead>
                <TableHead className="text-right font-bold border border-gray-300">المرسل</TableHead>
                <TableHead className="text-right font-bold border border-gray-300">هاتف المرسل</TableHead>
                <TableHead className="text-right font-bold border border-gray-300">المستلم</TableHead>
                <TableHead className="text-right font-bold border border-gray-300">هاتف المستلم</TableHead>
                <TableHead className="text-right font-bold border border-gray-300">طريقة الدفع</TableHead>
                <TableHead className="text-right font-bold border border-gray-300">عنوان المستلم</TableHead>
                <TableHead className="text-right font-bold border border-gray-300">الوصف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500 border border-gray-300">
                    لا توجد شحنات في الفترة المحددة
                  </TableCell>
                </TableRow>
              ) : (
                filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium border border-gray-300">{shipment.trackingNumber}</TableCell>
                    <TableCell className="border border-gray-300">{shipment.senderName}</TableCell>
                    <TableCell dir="ltr" className="text-right border border-gray-300">
                      {shipment.senderPhone}
                    </TableCell>
                    <TableCell className="border border-gray-300">{shipment.receiverName}</TableCell>
                    <TableCell dir="ltr" className="text-right border border-gray-300">
                      {shipment.receiverPhone}
                    </TableCell>
                    <TableCell className="border border-gray-300">
                      {shipment.paymentMethod === "cash"
                        ? "نقداً"
                        : shipment.paymentMethod === "on-delivery"
                          ? "عند التسليم"
                          : "نقداً"}
                    </TableCell>
                    <TableCell className="border border-gray-300">{shipment.receiverAddress}</TableCell>
                    <TableCell className="border border-gray-300">{shipment.description}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
