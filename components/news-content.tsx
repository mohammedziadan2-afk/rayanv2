"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, Archive, CheckCircle, Edit2, X, AlertTriangle } from "lucide-react"
import { createNews, updateNews, deleteNews, type News } from "@/app/actions/news"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface NewsContentProps {
  news: News[]
  onUpdate: () => void
}

const linkifyText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      )
    }
    return <span key={index}>{part}</span>
  })
}

export function NewsContent({ news, onUpdate }: NewsContentProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addCategory, setAddCategory] = useState<"general" | "tracking">("general")
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  const openAddDialog = (category: "general" | "tracking") => {
    setAddCategory(category)
    setTitle("")
    setContent("")
    setIsAddDialogOpen(true)
  }

  const handleAddNews = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("يرجى ملء جميع الحقول")
      return
    }

    const result = await createNews({
      title: title.trim(),
      content: content.trim(),
      is_active: true,
      category: addCategory,
    })

    if (result) {
      toast.success(addCategory === "tracking" ? "تمت إضافة خبر صفحة التتبع بنجاح" : "تم إضافة الخبر بنجاح")
      setTitle("")
      setContent("")
      setIsAddDialogOpen(false)
      onUpdate()
    } else {
      toast.error("فشل في إضافة الخبر")
    }
  }

  const handleUpdateNews = async () => {
    if (!editingNews || !title.trim() || !content.trim()) {
      toast.error("يرجى ملء جميع الحقول")
      return
    }

    const success = await updateNews(editingNews.id, {
      title: title.trim(),
      content: content.trim(),
    })

    if (success) {
      toast.success("تم تحديث الخبر بنجاح")
      setEditingNews(null)
      setTitle("")
      setContent("")
      onUpdate()
    } else {
      toast.error("فشل في تحديث الخبر")
    }
  }

  const handleDeleteNews = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الخبر؟")) return

    const success = await deleteNews(id)
    if (success) {
      toast.success("تم حذف الخبر بنجاح")
      onUpdate()
    } else {
      toast.error("فشل في حذف الخبر")
    }
  }

  const handleArchiveNews = async (id: number, currentIsActive: boolean) => {
    const success = await updateNews(id, { is_active: !currentIsActive })

    if (success) {
      toast.success(!currentIsActive ? "تم تفعيل الخبر" : "تم إلغاء تفعيل الخبر")
      onUpdate()
    } else {
      toast.error("فشل في تحديث حالة الخبر")
    }
  }

  const startEdit = (newsItem: News) => {
    setEditingNews(newsItem)
    setTitle(newsItem.title)
    setContent(newsItem.content)
  }

  const cancelEdit = () => {
    setEditingNews(null)
    setTitle("")
    setContent("")
  }

  const isTracking = (n: News) => n.category === "tracking"
  const trackingActiveNews = news.filter((n) => n.is_active && isTracking(n))
  const trackingArchivedNews = news.filter((n) => !n.is_active && isTracking(n))
  const activeNews = news.filter((n) => n.is_active && !isTracking(n))
  const archivedNews = news.filter((n) => !n.is_active && !isTracking(n))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button className="gap-2 shadow-lg" onClick={() => openAddDialog("general")}>
          <Plus className="w-4 h-4" />
          <span>إضافة خبر جديد</span>
        </Button>
        <Button
          variant="outline"
          className="gap-2 shadow-sm border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
          onClick={() => openAddDialog("tracking")}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>إضافة خبر لصفحة التتبع</span>
        </Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {addCategory === "tracking" ? "إضافة خبر لصفحة تتبع الزبائن" : "إضافة خبر جديد"}
            </DialogTitle>
          </DialogHeader>
          {addCategory === "tracking" && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>سيظهر هذا الخبر للزبائن كشريط تنبيه تحت عنوان &quot;مهم جداً&quot; في صفحة تتبع الشحنات.</span>
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الخبر</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="أدخل عنوان الخبر"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">محتوى الخبر</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="أدخل محتوى الخبر"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddNews} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>إضافة</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-4 md:p-6">
          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-6 h-6" />
            أخبار صفحة تتبع الزبائن ({trackingActiveNews.length})
          </h2>
          <p className="text-sm text-red-600/80 mb-4">
            تظهر هذه الأخبار للزبائن كشريط &quot;مهم جداً&quot; في صفحة تتبع الشحنات.
          </p>
          <div className="grid gap-4">
            {trackingActiveNews.map((newsItem) => (
              <Card key={newsItem.id} className="p-6 border-red-200 hover:shadow-lg transition-shadow">
                {editingNews?.id === newsItem.id ? (
                  <div className="space-y-4">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الخبر" />
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="محتوى الخبر"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateNews} size="sm" className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>حفظ</span>
                      </Button>
                      <Button onClick={cancelEdit} size="sm" variant="outline" className="gap-2 bg-transparent">
                        <X className="w-4 h-4" />
                        <span>إلغاء</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{linkifyText(newsItem.title)}</h3>
                        <p className="text-muted-foreground">{linkifyText(newsItem.content)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-red-100">
                      <span className="text-sm text-muted-foreground">
                        {new Date(newsItem.created_at).toLocaleDateString("ar-EG")}
                      </span>
                      <div className="flex gap-2">
                        <Button onClick={() => startEdit(newsItem)} size="sm" variant="outline" className="gap-2">
                          <Edit2 className="w-4 h-4" />
                          <span>تعديل</span>
                        </Button>
                        <Button
                          onClick={() => handleArchiveNews(newsItem.id, newsItem.is_active)}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Archive className="w-4 h-4" />
                          <span>إلغاء التفعيل</span>
                        </Button>
                        <Button
                          onClick={() => handleDeleteNews(newsItem.id)}
                          size="sm"
                          variant="outline"
                          className="gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>حذف</span>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            ))}
            {trackingActiveNews.length === 0 && (
              <Card className="p-8 text-center border-dashed border-red-200 bg-transparent">
                <p className="text-muted-foreground">لا توجد أخبار لصفحة التتبع حالياً</p>
              </Card>
            )}

            {trackingArchivedNews.map((newsItem) => (
              <Card key={newsItem.id} className="p-6 opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{linkifyText(newsItem.title)}</h3>
                    <p className="text-muted-foreground">{linkifyText(newsItem.content)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm text-muted-foreground">غير مفعّل</span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleArchiveNews(newsItem.id, newsItem.is_active)}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>تفعيل</span>
                    </Button>
                    <Button
                      onClick={() => handleDeleteNews(newsItem.id)}
                      size="sm"
                      variant="outline"
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-8 bg-primary rounded-full"></span>
            الأخبار النشطة ({activeNews.length})
          </h2>
          <div className="grid gap-4">
            {activeNews.map((newsItem) => (
              <Card key={newsItem.id} className="p-6 hover:shadow-lg transition-shadow">
                {editingNews?.id === newsItem.id ? (
                  <div className="space-y-4">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الخبر" />
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="محتوى الخبر"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateNews} size="sm" className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>حفظ</span>
                      </Button>
                      <Button onClick={cancelEdit} size="sm" variant="outline" className="gap-2 bg-transparent">
                        <X className="w-4 h-4" />
                        <span>إلغاء</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{linkifyText(newsItem.title)}</h3>
                        <p className="text-muted-foreground">{linkifyText(newsItem.content)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-sm text-muted-foreground">
                        {new Date(newsItem.created_at).toLocaleDateString("ar-EG")}
                      </span>
                      <div className="flex gap-2">
                        <Button onClick={() => startEdit(newsItem)} size="sm" variant="outline" className="gap-2">
                          <Edit2 className="w-4 h-4" />
                          <span>تعديل</span>
                        </Button>
                        <Button
                          onClick={() => handleArchiveNews(newsItem.id, newsItem.is_active)}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Archive className="w-4 h-4" />
                          <span>إلغاء التفعيل</span>
                        </Button>
                        <Button
                          onClick={() => handleDeleteNews(newsItem.id)}
                          size="sm"
                          variant="outline"
                          className="gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>حذف</span>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            ))}
            {activeNews.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">لا توجد أخبار نشطة حالياً</p>
              </Card>
            )}
          </div>
        </div>

        {archivedNews.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-8 bg-muted rounded-full"></span>
              الأخبار الغير نشطة ({archivedNews.length})
            </h2>
            <div className="grid gap-4">
              {archivedNews.map((newsItem) => (
                <Card key={newsItem.id} className="p-6 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{linkifyText(newsItem.title)}</h3>
                      <p className="text-muted-foreground">{linkifyText(newsItem.content)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm text-muted-foreground">
                      {new Date(newsItem.created_at).toLocaleDateString("ar-EG")}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleArchiveNews(newsItem.id, newsItem.is_active)}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>تفعيل</span>
                      </Button>
                      <Button
                        onClick={() => handleDeleteNews(newsItem.id)}
                        size="sm"
                        variant="outline"
                        className="gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
