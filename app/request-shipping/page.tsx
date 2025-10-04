"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Package, User, Phone, MapPin, FileText, Weight, DollarSign, Send, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase-client"
import { toast } from "sonner"

export default function RequestShippingPage() {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    pickupLocation: "",
    pickupAddress: "",
    deliveryLocation: "",
    deliveryAddress: "",
    packageDescription: "",
    estimatedWeight: "",
    estimatedValue: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [requestNumber, setRequestNumber] = useState("")

  const supabase = createBrowserClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerName || !formData.customerPhone || !formData.pickupLocation || !formData.deliveryLocation) {
      toast.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    setIsSubmitting(true)

    try {
      // إنشاء رقم طلب فريد
      const requestNum = `REQ${Date.now().toString().slice(-8)}`

      const { error } = await supabase.from("shipping_requests").insert([
        {
          request_number: requestNum,
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          pickup_location: formData.pickupLocation,
          pickup_address: formData.pickupAddress || null,
          delivery_location: formData.deliveryLocation,
          delivery_address: formData.deliveryAddress || null,
          package_description: formData.packageDescription || null,
          estimated_weight: formData.estimatedWeight ? Number.parseFloat(formData.estimatedWeight) : null,
          estimated_value: formData.estimatedValue ? Number.parseFloat(formData.estimatedValue) : null,
          notes: formData.notes || null,
          status: "pending",
          request_date: new Date().toISOString(),
        },
      ])

      if (error) throw error

      setRequestNumber(requestNum)
      setIsSuccess(true)
      toast.success("تم إرسال طلب الشحن بنجاح!")

      // إعادة تعيين النموذج
      setFormData({
        customerName: "",
        customerPhone: "",
        pickupLocation: "",
        pickupAddress: "",
        deliveryLocation: "",
        deliveryAddress: "",
        packageDescription: "",
        estimatedWeight: "",
        estimatedValue: "",
        notes: "",
      })
    } catch (error) {
      console.error("[v0] Error submitting shipping request:", error)
      toast.error("فشل إرسال طلب الشحن. يرجى المحاولة مرة أخرى.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg glass-effect">
          <CardContent className="pt-6 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">تم إرسال الطلب بنجاح!</h2>
              <p className="text-muted-foreground">رقم طلبك هو:</p>
              <p className="text-2xl font-mono font-bold text-primary">{requestNumber}</p>
              <p className="text-sm text-muted-foreground">سيتم التواصل معك قريباً لتأكيد الطلب</p>
              <Link href={`/track-request/${requestNumber}`}>
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  <Package className="w-5 h-5 ml-2" />
                  تتبع طلبك
                </Button>
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setIsSuccess(false)} className="w-full gradient-accent">
                <Send className="w-5 h-5 ml-2" />
                إرسال طلب آخر
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full bg-transparent">
                  <ArrowRight className="w-5 h-5 ml-2" />
                  العودة للرئيسية
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl gradient-primary shadow-glow">
                <Package className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">طلب شحن جديد</h1>
                <p className="text-sm text-muted-foreground mt-1">املأ النموذج لإرسال طلب شحن</p>
              </div>
            </div>
            <Link href="/">
              <Button
                variant="outline"
                className="gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent"
              >
                <ArrowRight className="w-5 h-5" />
                <span className="hidden sm:inline">العودة للرئيسية</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <Card className="max-w-3xl mx-auto shadow-lg glass-effect">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-xl">معلومات الشحنة</CardTitle>
            <CardDescription>يرجى ملء جميع الحقول المطلوبة (*)</CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* معلومات العميل */}
              <div className="space-y-4 p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">معلومات العميل</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">الاسم الكامل *</Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      placeholder="أدخل اسمك الكامل"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">رقم الهاتف *</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="customerPhone"
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleChange}
                        placeholder="05xxxxxxxx"
                        className="pr-10"
                        dir="ltr"
                        style={{ textAlign: "right" }}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* موقع الاستلام */}
              <div className="space-y-4 p-4 rounded-lg bg-accent/10">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold text-foreground">موقع الاستلام</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickupLocation">المدينة *</Label>
                    <Input
                      id="pickupLocation"
                      name="pickupLocation"
                      value={formData.pickupLocation}
                      onChange={handleChange}
                      placeholder="مثال: الرياض"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickupAddress">العنوان التفصيلي</Label>
                    <Input
                      id="pickupAddress"
                      name="pickupAddress"
                      value={formData.pickupAddress}
                      onChange={handleChange}
                      placeholder="الحي، الشارع، رقم المبنى"
                    />
                  </div>
                </div>
              </div>

              {/* موقع التسليم */}
              <div className="space-y-4 p-4 rounded-lg bg-secondary/10">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-secondary" />
                  <h3 className="font-semibold text-foreground">موقع التسليم</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryLocation">المدينة *</Label>
                    <Input
                      id="deliveryLocation"
                      name="deliveryLocation"
                      value={formData.deliveryLocation}
                      onChange={handleChange}
                      placeholder="مثال: جدة"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryAddress">العنوان التفصيلي</Label>
                    <Input
                      id="deliveryAddress"
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleChange}
                      placeholder="الحي، الشارع، رقم المبنى"
                    />
                  </div>
                </div>
              </div>

              {/* تفاصيل الطرد */}
              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">تفاصيل الطرد</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="packageDescription">وصف المحتويات</Label>
                    <div className="relative">
                      <FileText className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Textarea
                        id="packageDescription"
                        name="packageDescription"
                        value={formData.packageDescription}
                        onChange={handleChange}
                        placeholder="مثال: ملابس، إلكترونيات، كتب..."
                        className="pr-10 min-h-[80px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimatedWeight">الوزن التقديري (كجم)</Label>
                      <div className="relative">
                        <Weight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="estimatedWeight"
                          name="estimatedWeight"
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.estimatedWeight}
                          onChange={handleChange}
                          placeholder="0.0"
                          className="pr-10"
                          dir="ltr"
                          style={{ textAlign: "right" }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimatedValue">القيمة التقديرية (د.أ)</Label>
                      <div className="relative">
                        <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="estimatedValue"
                          name="estimatedValue"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.estimatedValue}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="pr-10"
                          dir="ltr"
                          style={{ textAlign: "right" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ملاحظات إضافية */}
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="أي ملاحظات أو تعليمات خاصة..."
                  className="min-h-[100px]"
                />
              </div>

              <Button type="submit" className="w-full gradient-accent" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 ml-2" />
                    إرسال الطلب
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
