"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import {
  User,
  Building2,
  Phone,
  MapPin,
  UserPlus,
  LogOut,
  Clock,
  Database,
  Download,
  Upload,
  Trash2,
  Edit,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBackups, createBackup, deleteBackup, restoreBackup, type Backup } from "@/app/actions/backups"
import { getCompanyInfo, updateCompanyInfo } from "@/app/actions/company"
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator"
import { CSRFInput } from "@/components/csrf-input"
import { AdminFooter } from "@/components/admin-footer"

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("مؤسسة الريان واريان للشحن")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoringBackup, setIsRestoringBackup] = useState(false)
  const [backups, setBackups] = useState<Backup[]>([])
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState<"admin" | "user">("user")
  const [changePasswordUserId, setChangePasswordUserId] = useState("")
  const [newPasswordForUser, setNewPasswordForUser] = useState("")
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string>("")

  const { currentUser, users, logout, addUser, changePassword, deleteUser } = useAuth()

  useEffect(() => {
    const loadBackups = async () => {
      const backupsData = await getBackups()
      setBackups(backupsData)
    }
    const loadCompanyInfo = async () => {
      const companyInfo = await getCompanyInfo()
      if (companyInfo) {
        setCompanyName(companyInfo.name || "مؤسسة الريان واريان للشحن")
        setPhone(companyInfo.phone || "")
        setAddress(companyInfo.address || "")
      }
    }
    const loadSettings = async () => {
      Promise.all([loadBackups(), loadCompanyInfo()])
    }

    const fetchCsrfToken = async () => {
      try {
        const response = await fetch("/api/csrf-token")
        const data = await response.json()
        if (data.token) {
          setCsrfToken(data.token)
        }
      } catch (error) {
        console.error("[v0] Error fetching CSRF token:", error)
      }
    }
    fetchCsrfToken()

    loadSettings()
  }, [])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await updateCompanyInfo({
        name: companyName,
        phone: phone,
        address: address,
      })

      setIsEditingCompanyInfo(false)
      toast.success("تم حفظ الإعدادات بنجاح")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء حفظ الإعدادات")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)

    try {
      const result = await createBackup()

      if (!result.success || !result.backup) {
        throw new Error(result.error || "فشل إنشاء النسخة الاحتياطية")
      }

      const backupsData = await getBackups()
      setBackups(backupsData)

      const blob = new Blob([JSON.stringify(result.backup, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `backup-${result.backup.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("تم إنشاء النسخة الاحتياطية وتحميلها بنجاح")
    } catch (error: any) {
      console.error("[v0] Backup error:", error)
      toast.error(`حدث خطأ أثناء إنشاء النسخة الاحتياطية: ${error.message}`)
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleRestoreBackup = async (backup: Backup) => {
    if (!confirm(`هل أنت متأكد من استرجاع النسخة الاحتياطية "${backup.name}"؟ سيتم استبدال جميع البيانات الحالية.`)) {
      return
    }

    setIsRestoringBackup(true)

    try {
      const result = await restoreBackup(backup)

      if (!result.success) {
        throw new Error(result.error || "فشل استرجاع النسخة الاحتياطية")
      }

      toast.success("تم استرجاع النسخة الاحتياطية بنجاح! يرجى تحديث الصفحة.")
      setTimeout(() => window.location.reload(), 2000)
    } catch (error: any) {
      console.error("[v0] Restore error:", error)
      toast.error(`حدث خطأ أثناء استرجاع النسخة الاحتياطية: ${error.message}`)
    } finally {
      setIsRestoringBackup(false)
    }
  }

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string) as Backup

        const result = await restoreBackup(backup)

        if (!result.success) {
          throw new Error(result.error || "فشل رفع النسخة الاحتياطية")
        }

        const backupsData = await getBackups()
        setBackups(backupsData)

        toast.success("تم رفع النسخة الاحتياطية بنجاح")
      } catch (error) {
        toast.error("ملف النسخة الاحتياطية غير صالح")
      }
    }
    reader.readAsText(file)
  }

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه النسخة الاحتياطية؟")) {
      return
    }

    const result = await deleteBackup(backupId)

    if (result.success) {
      const backupsData = await getBackups()
      setBackups(backupsData)
      toast.success("تم حذف النسخة الاحتياطية")
    } else {
      toast.error("حدث خطأ أثناء حذف النسخة الاحتياطية")
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()

    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    const csrfTokenFromForm = formData.get("csrf_token") as string

    if (!newUsername || !newPassword) {
      toast.error("يرجى إدخال جميع البيانات")
      return
    }

    try {
      const success = await addUser(newUsername, newPassword, newUserRole, csrfTokenFromForm)

      if (success) {
        setNewUsername("")
        setNewPassword("")
        setNewUserRole("user")
        setIsAddUserDialogOpen(false)
        toast.success("تمت إضافة المستخدم بنجاح")
      } else {
        toast.error("فشل في إضافة المستخدم")
      }
    } catch (error) {
      console.error("[v0] Error adding user:", error)
      if (error instanceof Error && error.message.includes("CSRF")) {
        toast.error("خطأ أمني: رمز الحماية غير صحيح")
      } else {
        toast.error("حدث خطأ أثناء إضافة المستخدم")
      }
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    const csrfTokenFromForm = formData.get("csrf_token") as string

    if (!newPasswordForUser) {
      toast.error("يرجى إدخال كلمة السر الجديدة")
      return
    }

    try {
      const success = await changePassword(changePasswordUserId, newPasswordForUser, csrfTokenFromForm)

      if (success) {
        setNewPasswordForUser("")
        setChangePasswordUserId("")
        setIsChangePasswordDialogOpen(false)
        toast.success("تم تغيير كلمة السر بنجاح")
      } else {
        toast.error("فشل في تغيير كلمة السر")
      }
    } catch (error) {
      console.error("[v0] Error changing password:", error)
      if (error instanceof Error && error.message.includes("CSRF")) {
        toast.error("خطأ أمني: رمز الحماية غير صحيح")
      } else {
        toast.error("حدث خطأ أثناء تغيير كلمة السر")
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      const success = await deleteUser(userId, csrfToken)
      if (success) {
        toast.success("تم حذف المستخدم بنجاح")
      } else {
        toast.error("فشل حذف المستخدم")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-glow ring-2 ring-primary/20">
                <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-2" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                  الإعدادات
                </h1>
                <p className="text-sm text-muted-foreground font-semibold mt-1">إدارة إعدادات التطبيق</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline" className="gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto space-y-6">
          {currentUser?.role === "admin" && (
            <Card className="glass-effect shadow-glow border-primary/10 border-2 border-blue-500/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/20">
                    <Database className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">النسخ الاحتياطية</CardTitle>
                    <CardDescription>إنشاء واسترجاع نسخ احتياطية من جميع البيانات</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white gap-2"
                  >
                    <Download className="w-5 h-5" />
                    {isCreatingBackup ? "جاري الإنشاء..." : "إنشاء نسخة احتياطية"}
                  </Button>
                  <Button
                    onClick={() => document.getElementById("backup-upload")?.click()}
                    variant="outline"
                    className="gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    رفع نسخة
                  </Button>
                  <input
                    id="backup-upload"
                    type="file"
                    accept=".json"
                    onChange={handleUploadBackup}
                    className="hidden"
                  />
                </div>

                {backups.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">النسخ الاحتياطية المحفوظة</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {backups.map((backup) => (
                        <div
                          key={backup.id}
                          className="flex items-center justify-between p-3 rounded-lg glass-effect border border-primary/10"
                        >
                          <div>
                            <p className="font-semibold text-sm">{backup.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(backup.date).toLocaleString("ar-SA")} • {backup.size}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleRestoreBackup(backup)}
                              disabled={isRestoringBackup}
                              size="sm"
                              variant="outline"
                              className="gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              استرجاع
                            </Button>
                            <Button
                              onClick={() => handleDeleteBackup(backup.id)}
                              size="sm"
                              variant="destructive"
                              className="gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>ملاحظة:</strong> النسخة الاحتياطية تشمل:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>جميع الشحنات</li>
                    <li>المصروفات والإيرادات</li>
                    <li>طلبات الشحن</li>
                    <li>بيانات المستودع</li>
                    <li>رحلات الشحن</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="glass-effect shadow-glow border-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg gradient-primary">
                    <Clock className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">سجل الشحنات</CardTitle>
                    <CardDescription>عرض سجل جميع الشحنات السابقة</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/history">
                <Button className="w-full gradient-primary shadow-glow hover:shadow-glow-lg transition-all duration-300 gap-2">
                  <Clock className="w-5 h-5" />
                  عرض سجل الشحنات
                </Button>
              </Link>
            </CardContent>
          </Card>

          {currentUser?.role === "admin" && (
            <Card className="glass-effect shadow-glow border-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">إدارة المستخدمين</CardTitle>
                      <CardDescription>إضافة وتعديل وحذف المستخدمين</CardDescription>
                    </div>
                  </div>
                  <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 gradient-primary">
                        <UserPlus className="w-4 h-4" />
                        إضافة مستخدم
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                        <DialogDescription>أدخل بيانات المستخدم الجديد</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddUser} className="space-y-4">
                        <CSRFInput />
                        <div className="space-y-2">
                          <Label htmlFor="newUsername">اسم المستخدم</Label>
                          <Input
                            id="newUsername"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder="أدخل اسم المستخدم"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">كلمة السر</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="أدخل كلمة السر (10 أحرف على الأقل)"
                            required
                          />
                          <PasswordStrengthIndicator password={newPassword} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newUserRole">الصلاحية</Label>
                          <Select
                            value={newUserRole}
                            onValueChange={(value: "admin" | "user") => setNewUserRole(value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">مدير</SelectItem>
                              <SelectItem value="user">مستخدم</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full gradient-primary">
                          إضافة
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg glass-effect border border-primary/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{user.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.role === "admin" ? "مدير" : "مستخدم"}
                            {user.id === currentUser?.id && " (أنت)"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog
                          open={isChangePasswordDialogOpen && changePasswordUserId === user.id}
                          onOpenChange={(open) => {
                            setIsChangePasswordDialogOpen(open)
                            if (open) setChangePasswordUserId(user.id)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                              تغيير كلمة السر
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>تغيير كلمة السر</DialogTitle>
                              <DialogDescription>أدخل كلمة السر الجديدة لـ {user.username}</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                              <CSRFInput />
                              <div className="space-y-2">
                                <Label htmlFor="newPasswordForUser">كلمة السر الجديدة</Label>
                                <Input
                                  id="newPasswordForUser"
                                  type="password"
                                  value={newPasswordForUser}
                                  onChange={(e) => setNewPasswordForUser(e.target.value)}
                                  placeholder="أدخل كلمة السر الجديدة (10 أحرف على الأقل)"
                                  required
                                />
                                <PasswordStrengthIndicator password={newPasswordForUser} />
                              </div>
                              <Button type="submit" className="w-full gradient-primary">
                                حفظ
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="gap-2"
                          >
                            حذف
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="glass-effect shadow-glow border-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl gradient-primary">
                    <Building2 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">معلومات الشركة</CardTitle>
                    <CardDescription>بيانات الشركة الأساسية</CardDescription>
                  </div>
                </div>
                {!isEditingCompanyInfo && (
                  <Button onClick={() => setIsEditingCompanyInfo(true)} variant="outline" className="gap-2">
                    <Edit className="w-4 h-4" />
                    تعديل
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyName" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    اسم الشركة
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="glass-effect"
                    readOnly={!isEditingCompanyInfo}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    className="glass-effect"
                    readOnly={!isEditingCompanyInfo}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    العنوان
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="المدينة، الحي، الشارع"
                    className="glass-effect"
                    readOnly={!isEditingCompanyInfo}
                  />
                </div>
                {isEditingCompanyInfo && (
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1 gradient-primary shadow-glow hover:shadow-glow-lg transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingCompanyInfo(false)}
                      disabled={isLoading}
                    >
                      إلغاء
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="glass-effect shadow-glow border-primary/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl gradient-primary">
                  <Building2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">معلومات التطبيق</CardTitle>
                  <CardDescription>تفاصيل النسخة والدعم</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-muted-foreground">إصدار التطبيق</Label>
                <div className="p-3 rounded-lg glass-effect">
                  <p className="font-semibold">1.0.0</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground">تطوير</Label>
                <div className="p-3 rounded-lg glass-effect">
                  <p className="font-semibold">مؤسسة الريان واريان</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <AdminFooter backUrl="/admin" backLabel="الإدارة" />
    </div>
  )
}
