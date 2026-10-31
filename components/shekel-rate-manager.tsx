"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DollarSign, Edit2, Save, X } from "lucide-react"
import { getShekelRate, setShekelRate } from "@/app/actions/settings"
import { toast } from "sonner"

export function ShekelRateManager() {
  const [rate, setRate] = useState<string>("0.77")
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentRate, setCurrentRate] = useState<number>(0.77)

  useEffect(() => {
    loadRate()
  }, [])

  const loadRate = async () => {
    const fetchedRate = await getShekelRate()
    setCurrentRate(fetchedRate)
    setRate(fetchedRate.toString())
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const numRate = Number.parseFloat(rate)
      if (isNaN(numRate) || numRate <= 0) {
        toast.error("يرجى إدخال سعر صحيح")
        return
      }

      const result = await setShekelRate(numRate)
      if (result.success) {
        toast.success("تم حفظ سعر الشيكل بنجاح")
        setCurrentRate(numRate)
        setIsEditing(false)
      } else {
        toast.error(result.message || "فشل في حفظ السعر")
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الحفظ")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setRate(currentRate.toString())
    setIsEditing(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 sm:gap-2 glass-effect hover:shadow-glow transition-all duration-300 w-full text-xs sm:text-sm h-auto py-3 sm:py-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30 hover:border-green-500/50 hover:from-green-500/20 hover:to-green-600/20"
        >
          <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
          <span className="truncate text-green-700 dark:text-green-400">سعر الشيكل</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            إدارة سعر الشيكل
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Rate Display */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-muted-foreground mb-1">السعر الحالي</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">
              {currentRate.toFixed(2)} <span className="text-lg">شيكل/دينار</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">1 دينار = {currentRate.toFixed(2)} شيكل</p>
          </div>

          {/* Edit Section */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shekel_rate" className="text-base font-semibold">
                  السعر الجديد (شيكل لكل دينار)
                </Label>
                <Input
                  id="shekel_rate"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="h-12 text-lg"
                  placeholder="0.77"
                  dir="ltr"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1 h-12 bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 ml-2" />
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </Button>
                <Button onClick={handleCancel} variant="outline" className="h-12 bg-transparent" disabled={saving}>
                  <X className="w-4 h-4 ml-2" />
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full h-12 gap-2">
              <Edit2 className="w-4 h-4" />
              تعديل السعر
            </Button>
          )}

          {/* Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>ملاحظة:</strong> سيتم استخدام هذا السعر لحساب قيمة الشحنات بالشيكل في صفحات السائقين.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
