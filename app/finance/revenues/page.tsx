"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrendingUp, ArrowLeft, Plus, Trash2, Edit } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getAllTrips } from "@/app/actions/trips"
import {
  getAdditionalRevenues,
  addAdditionalRevenue,
  deleteAdditionalRevenue,
  updateAdditionalRevenue,
  type AdditionalRevenue,
} from "@/app/actions/revenues"
import { useToast } from "@/hooks/use-toast"
import { getCSRFToken } from "@/app/actions/csrf"

export default function RevenuesPage() {
  const [trips, setTrips] = useState<any[]>([])
  const [additionalRevenues, setAdditionalRevenues] = useState<AdditionalRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [csrfToken, setCsrfToken] = useState("")
  const [newRevenue, setNewRevenue] = useState({
    title: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    category: "other",
  })
  const [showTripsTable, setShowTripsTable] = useState(false)
  const [showAdditionalTable, setShowAdditionalTable] = useState(false)
  const [editingRevenue, setEditingRevenue] = useState<AdditionalRevenue | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    getCSRFToken().then((token) => {
      setCsrfToken(token)
    })
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tripsData, revenuesData] = await Promise.all([getAllTrips(), getAdditionalRevenues()])
      setTrips(tripsData)
      setAdditionalRevenues(revenuesData.data || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTripProfit = (trip: any) => {
    const shipmentsRevenue = trip.shipments.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0)
    const tobacco = Number(trip.tobacco_revenue || 0)
    const other = Number(trip.other_revenue || 0)
    const totalRevenue = shipmentsRevenue + tobacco + other

    const totalCosts =
      Number(trip.delivery_costs || 0) +
      Number(trip.porter_fees || 0) +
      Number(trip.permit_fees || 0) +
      Number(trip.tickets || 0) +
      Number(trip.employee_daily_wages || 0) +
      Number(trip.accommodation || 0) +
      Number(trip.other_costs || 0)

    return totalRevenue - totalCosts
  }

  const totalTripsProfit = trips.reduce((sum, trip) => sum + calculateTripProfit(trip), 0)
  const totalAdditionalRevenue = additionalRevenues.reduce((sum, rev) => sum + Number(rev.amount || 0), 0)
  const totalRevenue = totalTripsProfit + totalAdditionalRevenue

  const handleAddRevenue = async () => {
    if (!newRevenue.title || !newRevenue.amount) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" })
      return
    }

    const revenueData = {
      ...newRevenue,
      amount: Number.parseFloat(newRevenue.amount),
    }

    const result = editingRevenue
      ? await updateAdditionalRevenue(editingRevenue.id, revenueData, csrfToken)
      : await addAdditionalRevenue(revenueData, csrfToken)

    if (result.success) {
      toast({
        title: "تم بنجاح",
        description: editingRevenue ? "تم تعديل الإيراد الثانوي" : "تم إضافة الإيراد الثانوي",
      })
      const newToken = await getCSRFToken()
      setCsrfToken(newToken)
      setDialogOpen(false)
      setEditingRevenue(null)
      setNewRevenue({
        title: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        category: "other",
      })
      loadData()
    } else {
      toast({ title: "خطأ", description: result.error || "فشل في حفظ الإيراد", variant: "destructive" })
    }
  }

  const handleDeleteRevenue = async (id: string) => {
    const result = await deleteAdditionalRevenue(id, csrfToken)
    if (result.success) {
      toast({ title: "تم بنجاح", description: "تم حذف الإيراد الثانوي" })
      const newToken = await getCSRFToken()
      setCsrfToken(newToken)
      loadData()
    } else {
      toast({ title: "خطأ", description: result.error || "فشل في حذف الإيراد", variant: "destructive" })
    }
  }

  const handleEditRevenue = (revenue: AdditionalRevenue) => {
    setEditingRevenue(revenue)
    setNewRevenue({
      title: revenue.title,
      amount: revenue.amount.toString(),
      date: revenue.date,
      description: revenue.description || "",
      category: revenue.category,
    })
    setDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden shadow-glow ring-2 ring-primary/20 flex-shrink-0">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-1 sm:p-2" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-2xl lg:text-3xl font-bold bg-gradient-to-l from-sky-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent leading-tight">
                  مؤسسة الريان واريان للشحن
                </h1>
                <p className="text-[10px] sm:text-sm text-muted-foreground font-semibold mt-0.5 sm:mt-1">الإيرادات</p>
              </div>
            </div>

            <Link href="/finance">
              <Button
                size="sm"
                variant="outline"
                className="gap-1 sm:gap-2 glass-effect hover:shadow-glow bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">العودة</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-green-100/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-green-500 shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                    <p className="text-4xl font-bold text-green-700">{totalRevenue.toFixed(2)} د.أ</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>صافي أرباح الرحلات</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTripsTable(!showTripsTable)}
                  className="glass-effect"
                >
                  {showTripsTable ? "إخفاء" : "إظهار"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-4">جاري التحميل...</p>
              ) : (
                <>
                  {showTripsTable && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>رقم الرحلة</TableHead>
                          <TableHead>تاريخ المغادرة</TableHead>
                          <TableHead className="text-right">صافي الربح</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trips.map((trip) => (
                          <TableRow key={trip.id}>
                            <TableCell className="font-medium">{trip.trip_number}</TableCell>
                            <TableCell>{new Date(trip.departure_date).toLocaleDateString("ar-EG")}</TableCell>
                            <TableCell className="text-right font-bold text-green-700">
                              {calculateTripProfit(trip).toFixed(2)} د.أ
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  <div className="mt-4 p-4 bg-green-100 rounded-lg">
                    <p className="text-lg font-bold text-green-800">
                      مجموع أرباح الرحلات: {totalTripsProfit.toFixed(2)} د.أ
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>الإيرادات الثانوية</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdditionalTable(!showAdditionalTable)}
                    className="glass-effect"
                  >
                    {showAdditionalTable ? "إخفاء" : "إظهار"}
                  </Button>
                  <Dialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                      setDialogOpen(open)
                      if (!open) {
                        setEditingRevenue(null)
                        setNewRevenue({
                          title: "",
                          amount: "",
                          date: new Date().toISOString().split("T")[0],
                          description: "",
                          category: "other",
                        })
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500">
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة إيراد ثانوي
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingRevenue ? "تعديل إيراد ثانوي" : "إضافة إيراد ثانوي"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">العنوان</Label>
                          <Input
                            id="title"
                            value={newRevenue.title}
                            onChange={(e) => setNewRevenue({ ...newRevenue, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">المبلغ</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={newRevenue.amount}
                            onChange={(e) => setNewRevenue({ ...newRevenue, amount: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date">التاريخ</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newRevenue.date}
                            onChange={(e) => setNewRevenue({ ...newRevenue, date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">الوصف (اختياري)</Label>
                          <Input
                            id="description"
                            value={newRevenue.description}
                            onChange={(e) => setNewRevenue({ ...newRevenue, description: e.target.value })}
                          />
                        </div>
                        <Button
                          onClick={handleAddRevenue}
                          className="w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500"
                        >
                          {editingRevenue ? "تحديث" : "حفظ"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {additionalRevenues.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">لا توجد إيرادات ثانوية</p>
              ) : (
                <>
                  {showAdditionalTable && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>العنوان</TableHead>
                          <TableHead>التاريخ</TableHead>
                          <TableHead className="text-right">المبلغ</TableHead>
                          <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {additionalRevenues.map((rev) => (
                          <TableRow key={rev.id}>
                            <TableCell className="font-medium">{rev.title}</TableCell>
                            <TableCell>{new Date(rev.date).toLocaleDateString("ar-EG")}</TableCell>
                            <TableCell className="text-right font-bold text-green-700">
                              {Number(rev.amount).toFixed(2)} د.أ
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRevenue(rev)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRevenue(rev.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  <div className="mt-4 p-4 bg-cyan-100 rounded-lg">
                    <p className="text-lg font-bold text-cyan-800">
                      مجموع الإيرادات الثانوية: {totalAdditionalRevenue.toFixed(2)} د.أ
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
