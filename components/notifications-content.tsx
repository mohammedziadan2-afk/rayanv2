"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Bell, Plus, Check, ArrowRight, Calendar, Clock } from "lucide-react"
import { createNotification, completeNotification, type Notification } from "@/app/actions/notifications"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

interface NotificationsContentProps {
  notifications: Notification[]
  loading: boolean
  onUpdate: () => void
}

export function NotificationsContent({ notifications, loading, onUpdate }: NotificationsContentProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleAddNotification = async () => {
    if (!title.trim() || !dueDate) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const result = await createNotification({
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate,
    })

    if (result.success) {
      toast({
        title: "تم بنجاح",
        description: "تم إضافة التنبيه بنجاح",
      })
      setTitle("")
      setDescription("")
      setDueDate("")
      setIsAddDialogOpen(false)
      onUpdate()
    } else {
      toast({
        title: "خطأ",
        description: result.error || "فشل في إضافة التنبيه",
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  const handleCompleteNotification = async (id: string) => {
    const result = await completeNotification(id)

    if (result.success) {
      toast({
        title: "تم بنجاح",
        description: "تم تنفيذ التنبيه بنجاح",
      })
      onUpdate()
    } else {
      toast({
        title: "خطأ",
        description: result.error || "فشل في تحديث التنبيه",
        variant: "destructive",
      })
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin")} className="hover:bg-primary/10">
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl gradient-primary shadow-glow">
                <Bell className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">التنبيهات</h1>
                <p className="text-sm text-muted-foreground mt-1">إدارة التنبيهات والمهام</p>
              </div>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-glow">
                <Plus className="w-4 h-4" />
                إضافة تنبيه
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إضافة تنبيه جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان التنبيه *</Label>
                  <Input
                    id="title"
                    placeholder="مثال: متابعة شحنة رقم 123"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف (اختياري)</Label>
                  <Textarea
                    id="description"
                    placeholder="تفاصيل إضافية عن التنبيه..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">تاريخ الاستحقاق *</Label>
                  <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                  إلغاء
                </Button>
                <Button onClick={handleAddNotification} disabled={isSubmitting}>
                  {isSubmitting ? "جاري الإضافة..." : "إضافة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 glass-effect">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التنبيهات</p>
                <p className="text-3xl font-bold text-foreground mt-1">{notifications.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Bell className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 glass-effect">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متأخرة</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {notifications.filter((n) => isOverdue(n.due_date)).length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-100">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 glass-effect">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قادمة</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {notifications.filter((n) => !isOverdue(n.due_date)).length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center glass-effect">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">لا توجد تنبيهات</h3>
            <p className="text-muted-foreground mb-6">ابدأ بإضافة تنبيه جديد لتتبع مهامك</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة تنبيه
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-6 glass-effect transition-all hover:shadow-lg ${
                  isOverdue(notification.due_date) ? "border-red-500/50 bg-red-50/5" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{notification.title}</h3>
                      {isOverdue(notification.due_date) && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                          متأخر
                        </span>
                      )}
                    </div>
                    {notification.description && (
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(notification.due_date), "dd MMMM yyyy", {
                            locale: ar,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCompleteNotification(notification.id)}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                    تم تنفيذه
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
