"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  DollarSign,
  Search,
  Plus,
  CheckCircle,
  Trash2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createDebt, payDebt, deleteDebt, type DebtData } from "@/app/actions/debts"
import { getShipmentByTrackingNumber } from "@/app/actions/shipments"
import { toast } from "sonner"

interface DebtsContentProps {
  initialDebts: DebtData[]
}

export function DebtsContent({ initialDebts }: DebtsContentProps) {
  const [debts, setDebts] = useState<DebtData[]>(initialDebts)
  const [filteredDebts, setFilteredDebts] = useState<DebtData[]>(initialDebts)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<DebtData | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")

  const [trackingNumber, setTrackingNumber] = useState("")
  const [isLoadingShipment, setIsLoadingShipment] = useState(false)
  const [shipmentId, setShipmentId] = useState<string | null>(null)
  const [shipmentData, setShipmentData] = useState<{
    senderName: string
    description: string
    amount: number
  } | null>(null)
  const [debtorCreditorName, setDebtorCreditorName] = useState("")
  const [debtType, setDebtType] = useState<"receivable" | "payable">("receivable")
  const [manualAmount, setManualAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [dueDate, setDueDate] = useState("")

  useEffect(() => {
    setDebts(initialDebts)
    setFilteredDebts(initialDebts)
  }, [initialDebts])

  useEffect(() => {
    filterDebts()
  }, [searchTerm, typeFilter, statusFilter, debts])

  const filterDebts = () => {
    let filtered = debts

    if (searchTerm) {
      filtered = filtered.filter(
        (debt) =>
          debt.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          debt.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          debt.receiverPhone.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((debt) => debt.debtType === typeFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((debt) => debt.status === statusFilter)
    }

    setFilteredDebts(filtered)
  }

  const handleFetchShipment = async () => {
    if (!trackingNumber.trim()) {
      toast.error("يرجى إدخال رقم التتبع")
      return
    }

    setIsLoadingShipment(true)
    const result = await getShipmentByTrackingNumber(trackingNumber.trim())
    setIsLoadingShipment(false)

    if (result.success && result.data) {
      setShipmentId(result.data.id)
      setShipmentData({
        senderName: result.data.senderName,
        description: result.data.description,
        amount: result.data.amount,
      })
      setDebtorCreditorName(result.data.senderName)
      setManualAmount(result.data.amount.toString())
      toast.success("تم جلب معلومات الشحنة بنجاح")
    } else {
      toast.error("الشحنة غير موجودة")
      setShipmentData(null)
      setShipmentId(null)
    }
  }

  const handleAddDebt = async () => {
    // Validate required fields
    if (!debtorCreditorName.trim()) {
      toast.error("يرجى إدخال اسم المدين/الدائن")
      return
    }

    if (!manualAmount || Number.parseFloat(manualAmount) <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح")
      return
    }

    const amount = Number.parseFloat(manualAmount)

    const result = await createDebt({
      shipmentId: shipmentId,
      trackingNumber: trackingNumber.trim() || "يدوي",
      receiverName: debtorCreditorName.trim(),
      receiverPhone: "-",
      amount,
      debtType,
      status: "pending",
      paidAmount: 0,
      remainingAmount: amount,
      notes: notes.trim() || undefined,
      dueDate: dueDate || undefined,
    })

    if (result.success) {
      toast.success("تم إضافة الذمة بنجاح")
      setIsAddDialogOpen(false)
      // Reset form
      setTrackingNumber("")
      setShipmentId(null)
      setShipmentData(null)
      setDebtorCreditorName("")
      setManualAmount("")
      setNotes("")
      setDueDate("")
      const newDebt: DebtData = {
        id: result.data.id,
        shipmentId: shipmentId,
        trackingNumber: trackingNumber.trim() || "يدوي",
        receiverName: debtorCreditorName.trim(),
        receiverPhone: "-",
        amount,
        debtType,
        status: "pending",
        paidAmount: 0,
        remainingAmount: amount,
        notes: notes.trim() || undefined,
        dueDate: dueDate || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setDebts([newDebt, ...debts])
    } else {
      toast.error(result.error || "حدث خطأ أثناء إضافة الذمة")
    }
  }

  const handlePayDebt = async () => {
    if (!selectedDebt || !paymentAmount) {
      toast.error("يرجى إدخال المبلغ المدفوع")
      return
    }

    const amount = Number.parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح")
      return
    }

    if (amount > selectedDebt.remainingAmount) {
      toast.error("المبلغ المدفوع أكبر من المبلغ المتبقي")
      return
    }

    const result = await payDebt(selectedDebt.id, amount)

    if (result.success) {
      toast.success("تم تسجيل الدفعة بنجاح")
      setIsPayDialogOpen(false)
      setSelectedDebt(null)
      setPaymentAmount("")
      const newPaidAmount = selectedDebt.paidAmount + amount
      const newRemainingAmount = selectedDebt.amount - newPaidAmount
      const newStatus = newRemainingAmount <= 0 ? "paid" : newPaidAmount > 0 ? "partial" : "pending"

      setDebts(
        debts.map((debt) =>
          debt.id === selectedDebt.id
            ? {
                ...debt,
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                status: newStatus,
                paidAt: newStatus === "paid" ? new Date().toISOString() : debt.paidAt,
                updatedAt: new Date().toISOString(),
              }
            : debt,
        ),
      )
    } else {
      toast.error(result.error || "حدث خطأ أثناء تسجيل الدفعة")
    }
  }

  const handleDeleteDebt = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الذمة؟")) return

    const result = await deleteDebt(id)

    if (result.success) {
      toast.success("تم حذف الذمة بنجاح")
      setDebts(debts.filter((debt) => debt.id !== id))
    } else {
      toast.error(result.error || "حدث خطأ أثناء حذف الذمة")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "معلقة", variant: "secondary" as const },
      partial: { label: "مدفوعة جزئياً", variant: "outline" as const },
      paid: { label: "مدفوعة", variant: "default" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeBadge = (type: string) => {
    return type === "receivable" ? (
      <Badge variant="default" className="bg-green-500">
        <TrendingUp className="w-3 h-3 ml-1" />
        دائن
      </Badge>
    ) : (
      <Badge variant="destructive">
        <TrendingDown className="w-3 h-3 ml-1" />
        مدين
      </Badge>
    )
  }

  const totalReceivables = filteredDebts
    .filter((d) => d.debtType === "receivable")
    .reduce((sum, d) => sum + Number(d.remainingAmount), 0)

  const totalPayables = filteredDebts
    .filter((d) => d.debtType === "payable")
    .reduce((sum, d) => sum + Number(d.remainingAmount), 0)

  const netBalance = totalReceivables - totalPayables

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              {/* </CHANGE> */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-glow ring-2 ring-primary/20">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-2" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                  إدارة الذمم
                </h1>
                <p className="text-sm text-muted-foreground">متابعة المدينين والدائنين</p>
              </div>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة دائن/مدين
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إضافة دائن/مدين جديد</DialogTitle>
                  <DialogDescription>أدخل رقم التتبع لجلب معلومات الشحنة أو أدخل البيانات يدوياً</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Tracking Number (Optional) */}
                  <div className="space-y-2">
                    <Label>رقم التتبع (اختياري)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="أدخل رقم التتبع"
                        className="flex-1"
                      />
                      <Button onClick={handleFetchShipment} disabled={isLoadingShipment} variant="outline">
                        {isLoadingShipment ? <Loader2 className="w-4 h-4 animate-spin" /> : "جلب"}
                      </Button>
                    </div>
                  </div>

                  {/* Display shipment data if fetched */}
                  {shipmentData && (
                    <Card className="p-4 bg-muted/50">
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold">اسم المرسل: </span>
                          {shipmentData.senderName}
                        </div>
                        <div>
                          <span className="font-semibold">وصف الشحنة: </span>
                          {shipmentData.description}
                        </div>
                        <div>
                          <span className="font-semibold">المبلغ: </span>
                          {Number(shipmentData.amount || 0).toFixed(2)} د.أ
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Debtor/Creditor Name */}
                  <div className="space-y-2">
                    <Label>اسم المدين/الدائن *</Label>
                    <Input
                      value={debtorCreditorName}
                      onChange={(e) => setDebtorCreditorName(e.target.value)}
                      placeholder="أدخل اسم المدين أو الدائن"
                    />
                  </div>

                  {/* Debt Type */}
                  <div className="space-y-2">
                    <Label>نوع الذمة *</Label>
                    <Select value={debtType} onValueChange={(v) => setDebtType(v as "receivable" | "payable")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receivable">دائن (مستحق لنا)</SelectItem>
                        <SelectItem value="payable">مدين (مستحق علينا)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label>المبلغ *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      placeholder="أدخل المبلغ"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>ملاحظات (سبب الدين)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="أضف ملاحظات حول سبب الدين..."
                      rows={3}
                    />
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label>تاريخ الاستحقاق</Label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>

                  <Button onClick={handleAddDebt} className="w-full">
                    إضافة الذمة
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-effect p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الدائنين</p>
                <p className="text-2xl font-bold text-green-600">{totalReceivables.toFixed(2)} د.أ</p>
              </div>
            </div>
          </Card>

          <Card className="glass-effect p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المدينين</p>
                <p className="text-2xl font-bold text-red-600">{totalPayables.toFixed(2)} د.أ</p>
              </div>
            </div>
          </Card>

          <Card className="glass-effect p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">صافي الرصيد</p>
                <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {netBalance.toFixed(2)} د.أ
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-effect p-6 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="البحث برقم التتبع أو اسم المستلم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="نوع الذمة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="receivable">دائن</SelectItem>
                <SelectItem value="payable">مدين</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">معلقة</SelectItem>
                <SelectItem value="partial">مدفوعة جزئياً</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Debts Table */}
        <Card className="glass-effect shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-bold">رقم التتبع</TableHead>
                  <TableHead className="text-right font-bold">اسم المدين/الدائن</TableHead>
                  <TableHead className="text-right font-bold">النوع</TableHead>
                  <TableHead className="text-right font-bold">المبلغ الكلي</TableHead>
                  <TableHead className="text-right font-bold">المبلغ المدفوع</TableHead>
                  <TableHead className="text-right font-bold">المبلغ المتبقي</TableHead>
                  <TableHead className="text-right font-bold">الحالة</TableHead>
                  <TableHead className="text-right font-bold">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-right font-bold">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="w-12 h-12 text-muted-foreground" />
                        <p className="text-muted-foreground">لا توجد ذمم</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDebts.map((debt) => (
                    <TableRow key={debt.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs">{debt.trackingNumber}</TableCell>
                      <TableCell>{debt.receiverName}</TableCell>
                      <TableCell>{getTypeBadge(debt.debtType)}</TableCell>
                      <TableCell className="font-bold">{Number(debt.amount).toFixed(2)} د.أ</TableCell>
                      <TableCell className="text-green-600">{Number(debt.paidAmount).toFixed(2)} د.أ</TableCell>
                      <TableCell className="font-bold text-primary">
                        {Number(debt.remainingAmount).toFixed(2)} د.أ
                      </TableCell>
                      <TableCell>{getStatusBadge(debt.status)}</TableCell>
                      <TableCell className="text-sm">
                        {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString("ar-SA") : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {debt.status !== "paid" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 bg-transparent"
                              onClick={() => {
                                setSelectedDebt(debt)
                                setIsPayDialogOpen(true)
                              }}
                            >
                              <CheckCircle className="w-4 h-4" />
                              سداد
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 bg-transparent border-red-500/30 hover:border-red-500/50 text-red-600"
                            onClick={() => handleDeleteDebt(debt.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>

      {/* Payment Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
            <DialogDescription>
              {selectedDebt && (
                <>
                  المبلغ المتبقي:{" "}
                  <span className="font-bold text-primary">{Number(selectedDebt.remainingAmount).toFixed(2)} د.أ</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>المبلغ المدفوع</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={selectedDebt ? Number(selectedDebt.remainingAmount) : 0}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="أدخل المبلغ المدفوع"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePayDebt} className="flex-1">
                تسجيل الدفعة
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPayDialogOpen(false)
                  setSelectedDebt(null)
                  setPaymentAmount("")
                }}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
