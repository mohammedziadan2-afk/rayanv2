"use client"

import type React from "react"

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
  MapPinned,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ShipmentInvoice } from "./shipment-invoice"

export interface Shipment {
  id: string
  trackingNumber: string
  senderName: string
  senderPhone: string
  senderAddress: string
  senderCountry: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  receiverCountry: string
  description: string
  amount: number
  weight: number
  receivedDate: string
  status: string
  paymentMethod: string
  paymentLocation: string
  createdAt: string
  deletedAt?: string // إضافة حقل تاريخ الحذف
  location?: {
    x: number
    y: number
    label?: string
  }
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
    senderPhone: "",
    senderAddress: "",
    senderCountry: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    receiverCountry: "",
    description: "",
    amount: "",
    weight: "",
    receivedDate: "",
    status: "pending",
    paymentMethod: "cash",
    paymentLocation: "sender",
    location: {
      x: 0,
      y: 0,
      label: "",
    },
  })

  const [receivedDate, setReceivedDate] = useState<Date | undefined>(new Date())
  const [showInvoice, setShowInvoice] = useState(false)
  const [savedShipment, setSavedShipment] = useState<Shipment | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.senderName || !formData.receiverName) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المرسل والمستقبل",
        variant: "destructive",
      })
      return
    }

    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال قيمة صحيحة للشحنة",
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

    const trackingNumber = generateTrackingNumber()

    const shipment: Shipment = {
      id: Date.now().toString(),
      trackingNumber,
      senderName: formData.senderName,
      senderPhone: formData.senderPhone,
      senderAddress: formData.senderAddress,
      senderCountry: formData.senderCountry,
      receiverName: formData.receiverName,
      receiverPhone: formData.receiverPhone,
      receiverAddress: formData.receiverAddress,
      receiverCountry: formData.receiverCountry,
      description: formData.description,
      amount: Number.parseFloat(formData.amount),
      weight: Number.parseFloat(formData.weight),
      receivedDate: receivedDate.toISOString().split("T")[0],
      status: formData.status,
      paymentMethod: formData.paymentMethod,
      paymentLocation: formData.paymentLocation,
      createdAt: new Date().toISOString(),
      location: formData.location,
    }

    const existingShipments = JSON.parse(localStorage.getItem("shipments") || "[]")

    const updatedShipments = [shipment, ...existingShipments]
    localStorage.setItem("shipments", JSON.stringify(updatedShipments))

    window.dispatchEvent(new Event("shipmentsUpdated"))

    toast({
      title: "نجح",
      description: `تمت إضافة الشحنة بنجاح: ${trackingNumber}`,
      duration: 5000,
    })

    setSavedShipment(shipment)
    setShowInvoice(true)

    setReceivedDate(new Date())
    setFormData({
      senderName: "",
      senderPhone: "",
      senderAddress: "",
      senderCountry: "",
      receiverName: "",
      receiverPhone: "",
      receiverAddress: "",
      receiverCountry: "",
      description: "",
      amount: "",
      weight: "",
      receivedDate: "",
      status: "pending",
      paymentMethod: "cash",
      paymentLocation: "sender",
      location: {
        x: 0,
        y: 0,
        label: "",
      },
    })

    onSuccess?.()
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

  const handlePaymentMethodChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: value,
    }))
  }

  const handlePaymentLocationChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentLocation: value,
    }))
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [e.target.name]: Number.parseFloat(e.target.value),
      },
    }))
  }

  const handleLocationLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        label: e.target.value,
      },
    }))
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
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
                style={{ textAlign: "right" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderCountry">الدولة</Label>
            <div className="relative">
              <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="senderCountry"
                name="senderCountry"
                value={formData.senderCountry}
                onChange={handleChange}
                placeholder="أدخل دولة المرسل"
                className="pr-10"
              />
            </div>
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
                style={{ textAlign: "right" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiverCountry">الدولة</Label>
            <div className="relative">
              <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="receiverCountry"
                name="receiverCountry"
                value={formData.receiverCountry}
                onChange={handleChange}
                placeholder="أدخل دولة المستقبل"
                className="pr-10"
              />
            </div>
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
            <Label htmlFor="amount">قيمة الشحن (د.أ) *</Label>
            <div className="relative">
              <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
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
            <Label htmlFor="paymentMethod">طريقة الدفع *</Label>
            <div className="relative">
              <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
              <Select value={formData.paymentMethod} onValueChange={handlePaymentMethodChange}>
                <SelectTrigger className="pr-10">
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="on-delivery">عند التسليم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentLocation">مكان الدفع *</Label>
            <div className="relative">
              <MapPinned className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
              <Select value={formData.paymentLocation} onValueChange={handlePaymentLocationChange}>
                <SelectTrigger className="pr-10">
                  <SelectValue placeholder="اختر مكان الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sender">عند المرسل</SelectItem>
                  <SelectItem value="receiver">عند المستلم</SelectItem>
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

          <div className="space-y-2">
            <Label htmlFor="locationX">موقع الشحنة (X) *</Label>
            <div className="relative">
              <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="locationX"
                name="x"
                type="number"
                step="0.01"
                min="0"
                value={formData.location?.x}
                onChange={handleLocationChange}
                placeholder="0.00"
                className="pr-10"
                required
                dir="ltr"
                style={{ textAlign: "right" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationY">موقع الشحنة (Y) *</Label>
            <div className="relative">
              <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="locationY"
                name="y"
                type="number"
                step="0.01"
                min="0"
                value={formData.location?.y}
                onChange={handleLocationChange}
                placeholder="0.00"
                className="pr-10"
                required
                dir="ltr"
                style={{ textAlign: "right" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationLabel">وصف الموقع</Label>
            <div className="relative">
              <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="locationLabel"
                name="label"
                value={formData.location?.label}
                onChange={handleLocationLabelChange}
                placeholder="أدخل وصف الموقع"
                className="pr-10"
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full gradient-accent" size="lg">
          <PackagePlus className="w-5 h-5 ml-2" />
          إضافة الشحنة
        </Button>
      </form>

      {savedShipment && <ShipmentInvoice shipment={savedShipment} open={showInvoice} onOpenChange={setShowInvoice} />}
    </>
  )
}
