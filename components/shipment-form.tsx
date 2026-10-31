"use client"

import type React from "react"
import { CountrySelect } from "@/components/country-select"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  PackagePlus,
  User,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Weight,
  Globe,
  CalendarIcon,
  TrendingUp,
  CreditCard,
  Banknote,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ShipmentInvoice } from "./shipment-invoice"
import { createShipment } from "@/app/actions/shipments"
import { CSRFInput } from "@/components/csrf-input"

export interface Shipment {
  id: string
  trackingNumber: string
  senderName: string
  senderIdNumber: string
  senderPhone: string
  senderAddress: string
  senderCountry: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  receiverCountry: string
  description: string
  totalAmount: number
  deposit: number
  amount: number
  weight: number
  receivedDate: string
  status: string
  paymentStatus: string
  createdAt: string
  deletedAt?: string
  notes?: string
  collectionMethod?: string
}

function generateTrackingNumber(): string {
  const prefix = "SH"
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `${prefix}${timestamp}${random}`
}

interface ShipmentFormProps {
  onSuccess?: () => void
}

export function ShipmentForm({ onSuccess }: ShipmentFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    senderName: "",
    senderIdNumber: "",
    senderPhone: "",
    senderAddress: "",
    senderCountry: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    receiverCountry: "",
    description: "",
    totalAmount: "",
    deposit: "0",
    amount: "",
    weight: "",
    receivedDate: "",
    status: "pending",
    paymentStatus: "unpaid",
    collectionMethod: "driver",
    notes: "",
  })

  const [receivedDate, setReceivedDate] = useState<Date | undefined>(new Date())
  const [showInvoice, setShowInvoice] = useState(false)
  const [savedShipment, setSavedShipment] = useState<Shipment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.senderName || !formData.receiverName) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المرسل والمستقبل",
        variant: "destructive",
      })
      return
    }

    if (!formData.totalAmount || Number.parseFloat(formData.totalAmount) < 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال المبلغ الكلي للشحنة",
        variant: "destructive",
      })
      return
    }

    if (!formData.weight || Number.parseFloat(formData.weight) <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال وزن صحيح للشحنة",
        variant: "destructive",
      })
      return
    }

    if (!receivedDate) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار تاريخ الاستلام",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const form = e.currentTarget as HTMLFormElement
      const formDataObj = new FormData(form)
      const csrfToken = formDataObj.get("csrf_token") as string

      const trackingNumber = generateTrackingNumber()

      const totalAmount = Number.parseFloat(formData.totalAmount) || 0
      const deposit = Number.parseFloat(formData.deposit) || 0
      const remainingAmount = totalAmount - deposit

      const shipmentData = {
        trackingNumber,
        senderName: formData.senderName,
        senderIdNumber: formData.senderIdNumber,
        senderPhone: formData.senderPhone,
        senderAddress: formData.senderAddress,
        senderCountry: formData.senderCountry,
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        receiverAddress: formData.receiverAddress,
        receiverCountry: formData.receiverCountry,
        description: formData.description,
        totalAmount: totalAmount,
        deposit: deposit,
        amount: remainingAmount,
        weight: Number.parseFloat(formData.weight),
        receivedDate: receivedDate.toISOString().split("T")[0],
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        collectionMethod: formData.collectionMethod,
        notes: formData.notes,
      }

      const result = await createShipment(shipmentData, csrfToken)

      if (!result.success) {
        toast({
          title: "خطأ",
          description: result.error || "فشل في حفظ الشحنة",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "نجح",
        description: `تمت إضافة الشحنة بنجاح: ${trackingNumber}`,
        duration: 5000,
      })

      const shipment: Shipment = {
        id: result.data.id,
        trackingNumber: result.data.tracking_number,
        senderName: result.data.sender_name,
        senderIdNumber: result.data.sender_id_number,
        senderPhone: result.data.sender_phone,
        senderAddress: result.data.sender_address,
        senderCountry: result.data.sender_country,
        receiverName: result.data.receiver_name,
        receiverPhone: result.data.receiver_phone,
        receiverAddress: result.data.receiver_address,
        receiverCountry: result.data.receiver_country,
        description: result.data.description,
        totalAmount: result.data.total_amount || result.data.price,
        deposit: result.data.deposit || 0,
        amount: result.data.price,
        weight: result.data.weight,
        receivedDate: result.data.received_date,
        status: result.data.status,
        paymentStatus: result.data.payment_status,
        createdAt: result.data.created_at,
        notes: result.data.notes,
        collectionMethod: result.data.collection_method,
      }

      setSavedShipment(shipment)
      setShowInvoice(true)

      setReceivedDate(new Date())
      setFormData({
        senderName: "",
        senderIdNumber: "",
        senderPhone: "",
        senderAddress: "",
        senderCountry: "",
        receiverName: "",
        receiverPhone: "",
        receiverAddress: "",
        receiverCountry: "",
        description: "",
        totalAmount: "",
        deposit: "0",
        amount: "",
        weight: "",
        receivedDate: "",
        status: "pending",
        paymentStatus: "unpaid",
        collectionMethod: "driver",
        notes: "",
      })

      window.dispatchEvent(new CustomEvent("shipmentsUpdated"))

      onSuccess?.()
    } catch (error) {
      console.error("[v0] Error submitting form:", error)
      if (error instanceof Error && error.message.includes("CSRF")) {
        toast({
          title: "خطأ أمني",
          description: "رمز الحماية غير صحيح. يرجى تحديث الصفحة والمحاولة مرة أخرى",
          variant: "destructive",
        })
      } else {
        toast({
          title: "خطأ",
          description: "حدث خطأ غير متوقع",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      status: value,
    }))
  }

  const handlePaymentStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentStatus: value,
    }))
  }

  const handleCollectionMethodChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      collectionMethod: value,
    }))
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <CSRFInput />

        <div className="space-y-4 p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">معلومات المرسل</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderName">الاسم *</Label>
            <Input
              id="senderName"
              name="senderName"
              value={formData.senderName}
              onChange={handleChange}
              placeholder="أدخل اسم المرسل"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderIdNumber">رقم الهوية أو جواز السفر</Label>
            <div className="relative">
              <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="senderIdNumber"
                name="senderIdNumber"
                value={formData.senderIdNumber}
                onChange={handleChange}
                placeholder="أدخل رقم الهوية أو جواز السفر"
                className="pr-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderPhone">رقم الهاتف</Label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="senderPhone"
                name="senderPhone"
                value={formData.senderPhone}
                onChange={handleChange}
                placeholder="05xxxxxxxx"
                className="pr-10"
                dir="ltr"
                inputMode="tel"
                style={{ textAlign: "right" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الدولة</Label>
            <CountrySelect
              value={formData.senderCountry}
              onChange={(val) => setFormData((prev) => ({ ...prev, senderCountry: val }))}
              placeholder="اختر دولة المرسل"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderAddress">العنوان</Label>
            <div className="relative">
              <MapPin className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
              <Textarea
                id="senderAddress"
                name="senderAddress"
                value={formData.senderAddress}
                onChange={handleChange}
                placeholder="أدخل عنوان المرسل"
                className="pr-10 min-h-[80px]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 rounded-lg bg-accent/10">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-foreground">معلومات المستقبل</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiverName">الاسم *</Label>
            <Input
              id="receiverName"
              name="receiverName"
              value={formData.receiverName}
              onChange={handleChange}
              placeholder="أدخل اسم المستقبل"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiverPhone">رقم الهاتف</Label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="receiverPhone"
                name="receiverPhone"
                value={formData.receiverPhone}
                onChange={handleChange}
                placeholder="05xxxxxxxx"
                className="pr-10"
                dir="ltr"
                inputMode="tel"
                style={{ textAlign: "right" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الدولة</Label>
            <CountrySelect
              value={formData.receiverCountry}
              onChange={(val) => setFormData((prev) => ({ ...prev, receiverCountry: val }))}
              placeholder="اختر دولة المستقبل"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiverAddress">العنوان</Label>
            <div className="relative">
              <MapPin className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
              <Textarea
                id="receiverAddress"
                name="receiverAddress"
                value={formData.receiverAddress}
                onChange={handleChange}
                placeholder="أدخل عنوان المستقبل"
                className="pr-10 min-h-[80px]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">وصف الشحنة</Label>
          <div className="relative">
            <FileText className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="أدخل وصف محتويات الشحنة"
              className="pr-10 min-h-[100px]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">ملاحظات</Label>
          <div className="relative">
            <FileText className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="أدخل أي ملاحظات إضافية"
              className="pr-10 min-h-[100px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">الوزن (كجم) *</Label>
            <div className="relative">
              <Weight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={formData.weight}
                onChange={handleChange}
                placeholder="0.00"
                className="pr-10"
                required
                dir="ltr"
                style={{ textAlign: "right" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalAmount">المبلغ الكلي للشحنة (د.أ) *</Label>
            <div className="relative">
              <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={formData.totalAmount}
                onChange={handleChange}
                placeholder="0.00"
                className="pr-10"
                required
                dir="ltr"
                style={{ textAlign: "right" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit">الدفعة (د.أ)</Label>
            <div className="relative">
              <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="deposit"
                name="deposit"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={formData.deposit}
                onChange={handleChange}
                placeholder="0.00"
                className="pr-10"
                dir="ltr"
                style={{ textAlign: "right" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>باقي قيمة الشحن (د.أ)</Label>
            <div className="relative">
              <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
              <Input
                value={((Number.parseFloat(formData.totalAmount) || 0) - (Number.parseFloat(formData.deposit) || 0)).toFixed(2)}
                readOnly
                className="pr-10 bg-green-50 border-green-200 font-semibold text-green-700"
                dir="ltr"
                style={{ textAlign: "right" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentStatus">حالة الدفع *</Label>
            <div className="relative">
              <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
              <Select value={formData.paymentStatus} onValueChange={handlePaymentStatusChange}>
                <SelectTrigger className="pr-10">
                  <SelectValue placeholder="اختر حالة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">مدفوع</SelectItem>
                  <SelectItem value="unpaid">غير مدفوع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="collectionMethod">طريقة التحصيل *</Label>
            <div className="relative">
              <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
              <Select value={formData.collectionMethod} onValueChange={handleCollectionMethodChange}>
                <SelectTrigger className="pr-10">
                  <SelectValue placeholder="اختر طريقة التحصيل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driver">يحصلها السائق</SelectItem>
                  <SelectItem value="office">حصلت في المكتب</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>تاريخ الاستلام *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-right font-normal pr-10",
                    !receivedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="absolute right-3 w-4 h-4" />
                  {receivedDate ? receivedDate.toLocaleDateString("en-GB") : <span>اختر التاريخ</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={receivedDate} onSelect={setReceivedDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">حالة الشحنة *</Label>
            <div className="relative">
              <TrendingUp className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
              <Select value={formData.status} onValueChange={handleSelectChange}>
                <SelectTrigger className="pr-10">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="processing">قيد المعالجة</SelectItem>
                  <SelectItem value="in-transit">في الطريق</SelectItem>
                  <SelectItem value="out-for-delivery">خارج للتوصيل</SelectItem>
                  <SelectItem value="delivered">تم التوصيل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                  <SelectItem value="returned">مرتجع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full gradient-accent" size="lg" disabled={isSubmitting}>
          <PackagePlus className="w-5 h-5 ml-2" />
          {isSubmitting ? "جاري الحفظ..." : "إضافة الشحنة"}
        </Button>
      </form>

      {savedShipment && <ShipmentInvoice shipment={savedShipment} open={showInvoice} onOpenChange={setShowInvoice} />}
    </>
  )
}
