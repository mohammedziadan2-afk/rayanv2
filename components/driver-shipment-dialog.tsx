"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone, MapPin, User, DollarSign, Save, Truck, PenTool, Check, Package } from "lucide-react"
import { updateDriverTask } from "@/app/actions/drivers"
import { getShekelRate } from "@/app/actions/settings"
import { toast } from "sonner"
import { SignaturePad } from "@/components/signature-pad"

interface DriverShipmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: {
    id: string
    status: string
    driver_fee?: number
    delivery_type?: string
    shipments?: {
      tracking_number: string
      receiver_name: string
      receiver_phone: string
      receiver_address: string
      amount: number
      description?: string
      payment_status?: string
    }
  }
  sessionId?: string | number
  onUpdate: () => void
}

export function DriverShipmentDialog({ open, onOpenChange, task, sessionId, onUpdate }: DriverShipmentDialogProps) {
  const [status, setStatus] = useState(task.status)
  const [driverFee, setDriverFee] = useState(task.driver_fee ? task.driver_fee.toString() : "0")
  const [saving, setSaving] = useState(false)
  const [shekelRate, setShekelRate] = useState<number>(0.77)
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)

  useEffect(() => {
    setStatus(task.status)
    setDriverFee(task.driver_fee ? task.driver_fee.toString() : "0")
  }, [task.id, task.status, task.driver_fee])

  useEffect(() => {
    if (open) {
      getShekelRate().then((rate) => setShekelRate(rate))
    }
  }, [open])

  const handleSave = async () => {
    setSaving(true)
    try {
      const shouldRemoveFromSession = status === "rejected" || status === "refused"

      const result = await updateDriverTask(task.id, {
        status,
        driver_fee: Number.parseFloat(driverFee) || 0,
        completed_date: status === "delivered" ? new Date().toISOString() : undefined,
        session_id: shouldRemoveFromSession ? undefined : sessionId ? String(sessionId) : undefined,
        receiver_signature: status === "delivered" ? signature : undefined,
      })

      if (result.success) {
        toast.success(shouldRemoveFromSession ? "تم إرجاع الشحنة إلى المهام الحالية" : "تم حفظ التغييرات بنجاح")

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("driverTasksUpdated"))
        }

        onUpdate()
        onOpenChange(false)
      } else {
        toast.error(result.message || "فشل في حفظ التغييرات")
      }
    } catch (error) {
      console.error("Exception during save:", error)
      toast.error("حدث خطأ أثناء الحفظ")
    } finally {
      setSaving(false)
    }
  }

  const isPaid = task.shipments?.payment_status === "paid"
  const shipmentAmount = Number(task.shipments?.amount || task.driver_fee || 0)
  const displayAmount = isPaid ? 0 : shipmentAmount
  const amountInShekel = displayAmount * shekelRate

  const isIncluded = task.delivery_type === "included"
  const deliveryTypeText = isIncluded ? "شامل التوصيل" : "غير شامل التوصيل"
  const deliveryTypeColor = isIncluded
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-red-50 text-red-700 border-red-200"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-xl">تفاصيل الشحنة</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-1">
          {/* Receiver Info - compact 2-column grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
              <User className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">اسم المستلم</p>
                <p className="text-sm font-bold text-blue-900 leading-tight">{task.shipments?.receiver_name}</p>
                {task.shipments?.tracking_number && (
                  <p className="text-[10px] text-blue-600 font-mono truncate">{task.shipments.tracking_number}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
              <Phone className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">رقم الهاتف</p>
                <a
                  href={`tel:${task.shipments?.receiver_phone}`}
                  className="text-sm font-bold text-green-900 hover:underline"
                  dir="ltr"
                >
                  {task.shipments?.receiver_phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
              <MapPin className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">العنوان</p>
                <p className="text-sm font-semibold text-orange-900 leading-tight break-words">{task.shipments?.receiver_address}</p>
              </div>
            </div>

            <div className={`flex items-start gap-2 p-2 rounded-lg border ${deliveryTypeColor}`}>
              <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] opacity-80">نوع التوصيل</p>
                <p className="text-sm font-bold leading-tight">{deliveryTypeText}</p>
              </div>
            </div>
          </div>

          {/* Shipment Description - full width to preserve line breaks */}
          {task.shipments?.description && (
            <div className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg">
              <Package className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">وصف الشحنة</p>
                <p className="text-sm font-semibold text-purple-900 leading-snug whitespace-pre-line break-words">
                  {task.shipments.description}
                </p>
              </div>
            </div>
          )}

          {/* Amount */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">مبلغ الشحنة</span>
              </div>
              <div className="text-left flex flex-col items-end">
                <span className="text-base font-bold text-blue-600">{displayAmount.toFixed(2)} دينار</span>
                {displayAmount > 0 && shekelRate > 0 && (
                  <>
                    <span className="text-[11px] font-medium text-muted-foreground">أو</span>
                    <span className="text-base font-bold text-emerald-600">{amountInShekel.toFixed(2)} شيكل</span>
                  </>
                )}
              </div>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {isPaid
                ? "الشحنة مدفوعة مسبقاً - مبلغ السائق = 0"
                : shipmentAmount > 0
                  ? "غير مدفوعة - يجب تحصيل المبلغ من المستلم"
                  : "تنبيه: لم يتم تحديد مبلغ الشحنة"}
            </p>
          </div>

          {/* Status + Driver Fee - side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="status" className="text-sm font-semibold">
                حالة الشحنة *
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="h-11 text-base">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" className="text-base py-2.5">
                    قيد الانتظار
                  </SelectItem>
                  <SelectItem value="delivered" className="text-base py-2.5">
                    تم التسليم
                  </SelectItem>
                  <SelectItem value="rejected" className="text-base py-2.5">
                    رفض التسليم
                  </SelectItem>
                  <SelectItem value="postponed" className="text-base py-2.5">
                    مؤجل
                  </SelectItem>
                  <SelectItem value="refused" className="text-base py-2.5">
                    مرفوض
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="driver_fee" className="text-sm font-semibold">
                أجرة السائق *
              </Label>
              <Input
                id="driver_fee"
                type="number"
                step="0.01"
                min="0"
                value={driverFee}
                onChange={(e) => setDriverFee(e.target.value)}
                className="h-11 text-base"
                placeholder="0.00"
              />
            </div>
          </div>

          {(status === "rejected" || status === "refused") && (
            <p className="text-xs text-orange-600 bg-orange-50 p-1.5 rounded-lg">
              ⚠️ سيتم إرجاع الشحنة إلى قائمة المهام الحالية
            </p>
          )}

          {/* Signature Button */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold">توقيع المستلم</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSignatureDialogOpen(true)}
                className={`flex-1 h-11 text-base ${signature ? "border-green-500 bg-green-50" : ""}`}
              >
                {signature ? (
                  <>
                    <Check className="w-4 h-4 ml-2 text-green-600" />
                    تم التوقيع
                  </>
                ) : (
                  <>
                    <PenTool className="w-4 h-4 ml-2" />
                    توقيع المستلم
                  </>
                )}
              </Button>
              {signature && (
                <div className="w-20 h-11 border rounded-lg overflow-hidden bg-white">
                  <img src={signature || "/placeholder.svg"} alt="التوقيع" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
            {status === "delivered" && !signature && (
              <p className="text-xs text-amber-600 bg-amber-50 p-1.5 rounded-lg">
                يُفضل الحصول على توقيع المستلم قبل تأكيد التسليم
              </p>
            )}
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-base" size="lg">
            <Save className="w-5 h-5 ml-2" />
            {saving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </div>

        {/* Signature Pad Dialog */}
        <SignaturePad
          isOpen={signatureDialogOpen}
          onClose={() => setSignatureDialogOpen(false)}
          onSave={(signatureData) => {
            setSignature(signatureData)
            toast.success("تم حفظ التوقيع بنجاح")
          }}
          title="توقيع المستلم"
        />
      </DialogContent>
    </Dialog>
  )
}
