"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, DollarSign, TrendingUp, Truck, Calculator, Package } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AdminFooter } from "@/components/admin-footer"

interface PendingShipment {
  id: string
  tracking_number: string
  receiver_address: string
  total_amount: number
  price: number
  driverFee: number // أجور السائق الافتراضية (محلية فقط)
}

export default function ShipmentProfitsPage() {
  const [shipments, setShipments] = useState<PendingShipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [additionalCosts, setAdditionalCosts] = useState<number>(0) // التكاليف الإضافية

  useEffect(() => {
    loadPendingShipments()
  }, [])

  const loadPendingShipments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/shipments/pending')
      const data = await response.json()
      
      if (data.success) {
        // تحويل البيانات وإضافة حقل أجور السائق الافتراضية
        const shipmentsWithFees = data.shipments.map((s: any) => ({
          id: s.id,
          tracking_number: s.tracking_number,
          receiver_address: s.receiver_address || 'غير محدد',
          total_amount: parseFloat(s.total_amount) || parseFloat(s.price) || 0,
          price: parseFloat(s.price) || 0,
          driverFee: 0 // القيمة الافتراضية
        }))
        setShipments(shipmentsWithFees)
      }
    } catch (error) {
      console.error('Error loading shipments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // تحديث أجور السائق لشحنة معينة
  const updateDriverFee = (id: string, fee: number) => {
    setShipments(prev => prev.map(s => 
      s.id === id ? { ...s, driverFee: fee } : s
    ))
  }

  // تبديل تحديد شحنة
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // تحديد/إلغاء تحديد الكل
  const toggleSelectAll = () => {
    if (selectedIds.size === shipments.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(shipments.map(s => s.id)))
    }
  }

  // حساب الإحصائيات للشحنات المحددة فقط
  const stats = useMemo(() => {
    const selectedShipments = shipments.filter(s => selectedIds.has(s.id))
    const totalAmount = selectedShipments.reduce((sum, s) => sum + s.total_amount, 0)
    const totalDriverFees = selectedShipments.reduce((sum, s) => sum + s.driverFee, 0)
    const netProfit = totalAmount - totalDriverFees
    const finalProfit = netProfit - additionalCosts // الربح النهائي بعد خصم التكاليف
    
    return {
      count: selectedShipments.length,
      totalAmount,
      totalDriverFees,
      netProfit,
      additionalCosts,
      finalProfit
    }
  }, [shipments, selectedIds, additionalCosts])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-green-500/5 pb-20">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-green-500/20">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden shadow-glow ring-2 ring-green-500/20 flex-shrink-0">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-1 sm:p-2" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-green-600 via-green-500 to-emerald-500 bg-clip-text text-transparent leading-tight">
                  أرباح الشحنات
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1 hidden sm:block">
                  حساب أرباح الشحنات قيد الانتظار
                </p>
              </div>
            </div>

            <Link href="/trips-table">
              <Button variant="outline" className="gap-2">
                <ArrowRight className="w-4 h-4" />
                <span className="hidden sm:inline">العودة للرحلات</span>
                <span className="sm:hidden">رجوع</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="space-y-4 sm:space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">الشحنات المحددة</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">مجموع المبالغ</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.totalAmount.toFixed(2)} د.أ</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">أجور السائقين</p>
                    <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.totalDriverFees.toFixed(2)} د.أ</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${stats.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`p-2 rounded-lg ${stats.netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">صافي الربح</p>
                    <p className={`text-lg sm:text-2xl font-bold ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stats.netProfit.toFixed(2)} د.أ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Costs & Final Profit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* التكاليف الإضافية */}
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <Calculator className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">التكاليف الإضافية</p>
                      <p className="text-xs text-red-500">أدخل التكاليف يدوياً</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={additionalCosts || ''}
                      onChange={(e) => setAdditionalCosts(parseFloat(e.target.value) || 0)}
                      className="w-28 text-center text-lg font-bold border-red-300 focus:border-red-500"
                      placeholder="0.00"
                    />
                    <span className="text-red-600 font-medium">د.أ</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* الربح النهائي */}
            <Card className={`${stats.finalProfit >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'} text-white`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/20">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80">الربح النهائي</p>
                      <p className="text-xs text-white/60">بعد خصم جميع التكاليف</p>
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold">
                    {stats.finalProfit.toFixed(2)} د.أ
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="glass-effect shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-green-600" />
                الشحنات قيد الانتظار
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                إجمالي: {shipments.length} شحنة
              </span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
              ) : shipments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد شحنات قيد الانتظار</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right w-12">
                          <Checkbox 
                            checked={selectedIds.size === shipments.length && shipments.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="text-right">رقم التتبع</TableHead>
                        <TableHead className="text-right">مكان التسليم</TableHead>
                        <TableHead className="text-right">المبلغ الكلي</TableHead>
                        <TableHead className="text-right w-32">أجور السائق</TableHead>
                        <TableHead className="text-right">الربح</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipments.map((shipment) => {
                        const isSelected = selectedIds.has(shipment.id)
                        const profit = shipment.total_amount - shipment.driverFee
                        
                        return (
                          <TableRow 
                            key={shipment.id} 
                            className={isSelected ? 'bg-green-50' : ''}
                          >
                            <TableCell>
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => toggleSelection(shipment.id)}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {shipment.tracking_number}
                            </TableCell>
                            <TableCell>
                              {shipment.receiver_address}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {shipment.total_amount.toFixed(2)} د.أ
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={shipment.driverFee || ''}
                                onChange={(e) => updateDriverFee(shipment.id, parseFloat(e.target.value) || 0)}
                                className="w-24 text-center"
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell className={`font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {profit.toFixed(2)} د.أ
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Box */}
          {stats.count > 0 && (
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold mb-2">ملخص الأرباح للشحنات المحددة</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
                    <div>
                      <p className="text-white/80 text-xs sm:text-sm">مجموع المبالغ</p>
                      <p className="text-lg sm:text-xl font-bold">{stats.totalAmount.toFixed(2)} د.أ</p>
                    </div>
                    <div>
                      <p className="text-white/80 text-xs sm:text-sm">أجور السائقين</p>
                      <p className="text-lg sm:text-xl font-bold text-orange-200">- {stats.totalDriverFees.toFixed(2)} د.أ</p>
                    </div>
                    <div>
                      <p className="text-white/80 text-xs sm:text-sm">صافي الربح</p>
                      <p className="text-lg sm:text-xl font-bold">{stats.netProfit.toFixed(2)} د.أ</p>
                    </div>
                    <div>
                      <p className="text-white/80 text-xs sm:text-sm">التكاليف الإضافية</p>
                      <p className="text-lg sm:text-xl font-bold text-red-200">- {stats.additionalCosts.toFixed(2)} د.أ</p>
                    </div>
                    <div className="border-r-2 border-white/30 pr-4 col-span-2 sm:col-span-1">
                      <p className="text-white/80 text-xs sm:text-sm">الربح النهائي</p>
                      <p className={`text-2xl sm:text-3xl font-bold ${stats.finalProfit < 0 ? 'text-red-200' : ''}`}>
                        {stats.finalProfit.toFixed(2)} د.أ
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <AdminFooter />
    </div>
  )
}
