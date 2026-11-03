"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Users, 
  Plus, 
  ArrowRight, 
  Phone, 
  Building2, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  Package,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Subscriber {
  id: number
  username: string
  full_name: string
  phone: string | null
  company_name: string | null
  is_active: boolean
  created_at: string
  shipments_count?: number
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null)
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [settingUp, setSettingUp] = useState(false)
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    phone: "",
    company_name: "",
    is_active: true
  })

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const fetchSubscribers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscribers')
      const data = await response.json()
      
      if (data.error && data.error.includes('does not exist')) {
        setSetupNeeded(true)
        setSubscribers([])
      } else {
        setSubscribers(data.subscribers || [])
        setSetupNeeded(false)
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error)
      setSetupNeeded(true)
    } finally {
      setLoading(false)
    }
  }

  const setupTables = async () => {
    try {
      setSettingUp(true)
      const response = await fetch('/api/setup/subscribers', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setSetupNeeded(false)
        fetchSubscribers()
      } else {
        alert('خطأ في إنشاء الجداول: ' + data.error)
      }
    } catch (error) {
      console.error('Setup error:', error)
    } finally {
      setSettingUp(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingSubscriber 
        ? `/api/subscribers/${editingSubscriber.id}`
        : '/api/subscribers'
      
      const method = editingSubscriber ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setDialogOpen(false)
        resetForm()
        fetchSubscribers()
      } else {
        const data = await response.json()
        alert(data.error || 'حدث خطأ')
      }
    } catch (error) {
      console.error('Error saving subscriber:', error)
    }
  }

  const toggleActive = async (subscriber: Subscriber) => {
    try {
      const response = await fetch(`/api/subscribers/${subscriber.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !subscriber.is_active })
      })
      
      if (response.ok) {
        fetchSubscribers()
      }
    } catch (error) {
      console.error('Error toggling active:', error)
    }
  }

  const deleteSubscriber = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشترك؟')) return
    
    try {
      const response = await fetch(`/api/subscribers/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchSubscribers()
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      full_name: "",
      phone: "",
      company_name: "",
      is_active: true
    })
    setEditingSubscriber(null)
  }

  const openEditDialog = (subscriber: Subscriber) => {
    setEditingSubscriber(subscriber)
    setFormData({
      username: subscriber.username,
      password: "",
      full_name: subscriber.full_name,
      phone: subscriber.phone || "",
      company_name: subscriber.company_name || "",
      is_active: subscriber.is_active
    })
    setDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-500 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Image src="/images/logo.jpg" alt="شعار الريان" width={40} height={40} className="rounded-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold">أصحاب الطلبات</h1>
              <p className="text-amber-100 text-sm">إدارة المشتركين</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={fetchSubscribers}
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Setup Banner */}
        {setupNeeded && (
          <Card className="border-orange-300 bg-orange-50">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <h3 className="text-lg font-bold mb-2">إعداد قسم المشتركين</h3>
              <p className="text-muted-foreground mb-4">يجب إنشاء جداول قاعدة البيانات أولاً</p>
              <Button 
                onClick={setupTables} 
                disabled={settingUp}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {settingUp ? (
                  <>
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    جاري الإعداد...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 ml-2" />
                    إنشاء الجداول
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {!setupNeeded && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-80" />
                  <p className="text-2xl font-bold">{subscribers.length}</p>
                  <p className="text-sm opacity-80">إجمالي المشتركين</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
                  <p className="text-2xl font-bold">
                    {subscribers.filter(s => s.is_active).length}
                  </p>
                  <p className="text-sm opacity-80">مشتركين فعالين</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardContent className="p-4 text-center">
                  <XCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
                  <p className="text-2xl font-bold">
                    {subscribers.filter(s => !s.is_active).length}
                  </p>
                  <p className="text-sm opacity-80">مشتركين غير فعالين</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4 text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-80" />
                  <p className="text-2xl font-bold">
                    {subscribers.reduce((sum, s) => sum + (s.shipments_count || 0), 0)}
                  </p>
                  <p className="text-sm opacity-80">إجمالي الشحنات</p>
                </CardContent>
              </Card>
            </div>

            {/* Add New Subscriber Button */}
            <div className="flex justify-end">
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open)
                if (!open) resetForm()
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة مشترك جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSubscriber ? 'تعديل مشترك' : 'إضافة مشترك جديد'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">الاسم الكامل *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        required
                        placeholder="أدخل الاسم الكامل"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">اسم المستخدم *</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        required
                        placeholder="اسم المستخدم للدخول"
                        disabled={!!editingSubscriber}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        كلمة المرور {editingSubscriber ? '(اتركها فارغة للإبقاء على القديمة)' : '*'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          required={!editingSubscriber}
                          placeholder="كلمة المرور"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="رقم الهاتف"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company_name">اسم الشركة</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                        placeholder="اسم الشركة أو المؤسسة"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_active">الحساب فعال</Label>
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600">
                        {editingSubscriber ? 'تحديث' : 'إضافة'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setDialogOpen(false)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Subscribers Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  قائمة المشتركين
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-amber-500" />
                    <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
                  </div>
                ) : subscribers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-muted-foreground">لا يوجد مشتركين حتى الآن</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الاسم</TableHead>
                          <TableHead className="text-right">اسم المستخدم</TableHead>
                          <TableHead className="text-right">الهاتف</TableHead>
                          <TableHead className="text-right">الشركة</TableHead>
                          <TableHead className="text-right">الشحنات</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscribers.map((subscriber) => (
                          <TableRow key={subscriber.id}>
                            <TableCell>
                              <Link 
                                href={`/admin/subscribers/${subscriber.id}`}
                                className="font-medium text-amber-600 hover:text-amber-700 hover:underline"
                              >
                                {subscriber.full_name}
                              </Link>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {subscriber.username}
                            </TableCell>
                            <TableCell>
                              {subscriber.phone ? (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {subscriber.phone}
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {subscriber.company_name ? (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {subscriber.company_name}
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm">
                                {subscriber.shipments_count || 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={subscriber.is_active}
                                onCheckedChange={() => toggleActive(subscriber)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Link href={`/admin/subscribers/${subscriber.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Package className="w-4 h-4 text-blue-500" />
                                  </Button>
                                </Link>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => openEditDialog(subscriber)}
                                >
                                  <Pencil className="w-4 h-4 text-amber-500" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => deleteSubscriber(subscriber.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
