"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Receipt, ShoppingCart, DollarSign, Calendar, Tag, FileText } from "lucide-react"
import type { Expense } from "./expenses-list"

interface ExpenseFormProps {
  type: "expense" | "purchase"
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const expenseCategories = ["رواتب", "إيجار", "كهرباء وماء", "صيانة", "وقود", "اتصالات", "مواد مكتبية", "تسويق", "أخرى"]

const purchaseCategories = ["معدات", "أثاث", "مواد تعبئة", "أدوات", "قطع غيار", "مستلزمات", "برمجيات", "أخرى"]

export function ExpenseForm({ type, isOpen, onClose, onSuccess }: ExpenseFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.description || !formData.amount || !formData.category) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      })
      return
    }

    if (Number.parseFloat(formData.amount) <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال قيمة صحيحة",
        variant: "destructive",
      })
      return
    }

    const expense: Expense = {
      id: Date.now().toString(),
      type,
      description: formData.description,
      amount: Number.parseFloat(formData.amount),
      date: formData.date,
      category: formData.category,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    }

    const existingExpenses = JSON.parse(localStorage.getItem("expenses") || "[]")
    const updatedExpenses = [expense, ...existingExpenses]
    localStorage.setItem("expenses", JSON.stringify(updatedExpenses))

    window.dispatchEvent(new Event("expensesUpdated"))

    toast({
      title: "تم بنجاح",
      description: `تم إضافة ${type === "expense" ? "المصروف" : "المشترى"} بنجاح`,
    })

    setFormData({
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      category: "",
      notes: "",
    })

    onSuccess?.()
  }

  const categories = type === "expense" ? expenseCategories : purchaseCategories
  const icon = type === "expense" ? <Receipt className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />
  const title = type === "expense" ? "إضافة مصروف جديد" : "إضافة مشترى جديد"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
          <DialogDescription>قم بإدخال تفاصيل {type === "expense" ? "المصروف" : "المشترى"}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">الوصف *</Label>
            <div className="relative">
              <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="أدخل وصف المصروف أو المشترى"
                className="pr-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ (د.أ) *</Label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="pr-10"
                  required
                  dir="ltr"
                  style={{ textAlign: "right" }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">التاريخ *</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="pr-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">الفئة *</Label>
            <div className="relative">
              <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="pr-10">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أدخل أي ملاحظات إضافية (اختياري)"
              className="min-h-[80px]"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              إلغاء
            </Button>
            <Button type="submit" className="flex-1">
              إضافة
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
