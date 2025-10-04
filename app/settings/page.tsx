"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { User, ArrowRight, Building2, Phone, MapPin, UserPlus, LogOut, Users, Clock } from "lucide-react"
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

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("مؤسسة الريان واريان للشحن")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { currentUser, users, logout, addUser, changePassword, deleteUser } = useAuth()
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState<"admin" | "user">("user")
  const [changePasswordUserId, setChangePasswordUserId] = useState("")
  const [newPasswordForUser, setNewPasswordForUser] = useState("")
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false)

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      localStorage.setItem(
        "appSettings",
        JSON.stringify({
          companyName,
          phone,
          address,
        }),
      )
      toast.success("تم حفظ الإعدادات بنجاح")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء حفظ الإعدادات")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()

    if (newUsername.length < 3) {
      toast.error("يجب أن يكون اسم المستخدم 3 أحرف على الأقل")
      return
    }

    if (newPassword.length < 6) {
      toast.error("يجب أن تكون كلمة السر 6 أحرف على الأقل")
      return
    }

    const success = addUser(newUsername, newPassword, newUserRole)
    if (success) {
      toast.success("تم إضافة المستخدم بنجاح")
      setNewUsername("")
      setNewPassword("")
      setNewUserRole("user")
      setIsAddUserDialogOpen(false)
    } else {
      toast.error("اسم المستخدم موجود بالفعل")
    }
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()

    if (newPasswordForUser.length < 6) {
      toast.error("يجب أن تكون كلمة السر 6 أحرف على الأقل")
      return
    }

    const success = changePassword(changePasswordUserId, newPasswordForUser)
    if (success) {
      toast.success("تم تغيير كلمة السر بنجاح")
      setChangePasswordUserId("")
      setNewPasswordForUser("")
      setIsChangePasswordDialogOpen(false)
    } else {
      toast.error("حدث خطأ أثناء تغيير كلمة السر")
    }
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      const success = deleteUser(userId)
      if (success) {
        toast.success("تم حذف المستخدم بنجاح")
      } else {
        toast.error("لا يمكن حذف المستخدم الحالي")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
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
          <Card className="glass-effect shadow-glow border-primary/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl gradient-primary">
                  <Clock className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">سجل الشحنات</CardTitle>
                  <CardDescription>عرض سجل جميع الشحنات السابقة</CardDescription>
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
                    <div className="p-3 rounded-xl gradient-primary">
                      <Users className="w-6 h-6 text-primary-foreground" />
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
                            placeholder="أدخل كلمة السر"
                            required
                          />
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
                              <div className="space-y-2">
                                <Label htmlFor="newPasswordForUser">كلمة السر الجديدة</Label>
                                <Input
                                  id="newPasswordForUser"
                                  type="password"
                                  value={newPasswordForUser}
                                  onChange={(e) => setNewPasswordForUser(e.target.value)}
                                  placeholder="أدخل كلمة السر الجديدة"
                                  required
                                />
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
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl gradient-primary">
                  <Building2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">معلومات الشركة</CardTitle>
                  <CardDescription>بيانات الشركة الأساسية</CardDescription>
                </div>
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
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-primary shadow-glow hover:shadow-glow-lg transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
                </Button>
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
    </div>
  )
}
