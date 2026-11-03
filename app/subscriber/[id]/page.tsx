"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Package,
  CheckCircle,
  Clock,
  Truck,
  LogOut,
  User,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calculator,
  AlertTriangle,
  Coins,
  Receipt
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface Shipment {
  id: number
  tracking_number: string
  receiver_name: string
  receiver_address: string
  total_amount: number
  status: string
  delivery_status: string
  current_tracking_stage: number | null
  delivery_fee: number
  issue_note: string | null
  created_at: string
}

interface Payment {
  id: number
  amount: number
  notes: string | null
  amount_before_payment: number
  amount_after_payment: number
  created_at: string
}

export default function SubscriberDashboardPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [subscriberName, setSubscriberName] = useState("")
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [showAccountDetails, setShowAccountDetails] = useState(false)
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [selectedIssueNote, setSelectedIssueNote] = useState<string | null>(null)
  const [shekelRate, setShekelRate] = useState<number>(0)
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [expandedShipments, setExpandedShipments] = useState<number[]>([])
  
  const toggleShipmentExpand = (shipmentId: number) => {
    setExpandedShipments(prev => 
      prev.includes(shipmentId) 
        ? prev.filter(id => id !== shipmentId)
        : [...prev, shipmentId]
    )
  }

  useEffect(() => {
    // Check authorization
    const storedId = sessionStorage.getItem('subscriber_id')
    const storedName = sessionStorage.getItem('subscriber_name')
    
    if (!storedId || storedId !== id) {
      // Clear any remaining data
      sessionStorage.clear()
      localStorage.removeItem('subscriber_id')
      localStorage.removeItem('subscriber_name')
      
      // Redirect to login
      window.location.replace('/subscriber-login')
      return
    }
    
    setSubscriberName(storedName || '')
    setAuthorized(true)
    fetchShipments()
  }, [id, router])
  
  // Prevent back button from returning after logout
  useEffect(() => {
    const handlePopState = () => {
      const storedId = sessionStorage.getItem('subscriber_id')
      if (!storedId || storedId !== id) {
        sessionStorage.clear()
        window.location.replace('/subscriber-login')
      }
    }
    
    window.addEventListener('popstate', handlePopState)
    
    // Push a new state to prevent going back
    window.history.pushState(null, '', window.location.href)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [id])

  const fetchShipments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subscriber/${id}/shipments`)
      const data = await response.json()
      
      if (data.shipments) {
        setShipments(data.shipments)
      }
    } catch (error) {
      console.error('Error fetching shipments:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchShekelRate = async () => {
    try {
      const response = await fetch('/api/settings/shekel-rate')
      const data = await response.json()
      if (data.rate) {
        setShekelRate(data.rate)
      }
    } catch (error) {
      console.error('Error fetching shekel rate:', error)
    }
  }
  
  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/subscriber/${id}/payments`)
      const data = await response.json()
      if (data.payments) {
        setPayments(data.payments)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }
  
  useEffect(() => {
    fetchShekelRate()
    if (authorized) {
      fetchPayments()
    }
  }, [authorized, id])

  const handleLogout = () => {
    // Clear all session data
    sessionStorage.removeItem('subscriber_id')
    sessionStorage.removeItem('subscriber_name')
    sessionStorage.clear()
    localStorage.removeItem('subscriber_id')
    localStorage.removeItem('subscriber_name')
    
    // Replace current history entry to prevent back button
    window.history.replaceState(null, '', '/subscriber-login')
    
    // Navigate to login page
    window.location.href = '/subscriber-login'
  }

  const getStatusBadge = (status: string, deliveryStatus: string) => {
    if (deliveryStatus === 'delivered') {
      return <Badge className="bg-green-500">تم التسليم</Badge>
    }
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">قيد الانتظار</Badge>
      case 'in_transit':
        return <Badge className="bg-blue-500">في الطريق</Badge>
      case 'processing':
        return <Badge className="bg-purple-500">قيد المعالجة</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

// نسبة التوصيل تعتمد على مراحل التتبع - 5 مراحل وكل مرحلة = 20%
  // إذا الشحنة موجودة = على الأقل المرحلة الأولى (استلام) مكتملة
  const getDeliveryProgress = (currentStage: number | null, deliveryStatus: string) => {
    if (deliveryStatus === 'delivered') return 100
    // current_tracking_stage: 1-5، كل مرحلة = 20%
    // إذا لم يتم تحديد المرحلة، نعتبرها المرحلة الأولى (تم الاستلام)
    const stage = currentStage && currentStage > 0 ? currentStage : 1
    return Math.min(stage * 20, 100)
  }
  
  const getProgressSteps = (currentStage: number | null, deliveryStatus: string) => {
    // إذا الشحنة موجودة = على الأقل المرحلة الأولى مكتملة
    const stage = currentStage && currentStage > 0 ? currentStage : 1
    const isDelivered = deliveryStatus === 'delivered'
    
    const steps = [
      { label: 'استلام', completed: stage >= 1 || isDelivered },
      { label: 'فرز', completed: stage >= 2 || isDelivered },
      { label: 'شحن', completed: stage >= 3 || isDelivered },
      { label: 'توزيع', completed: stage >= 4 || isDelivered },
      { label: 'تسليم', completed: stage >= 5 || isDelivered }
    ]
    return steps
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  const pendingCount = shipments.filter(s => s.delivery_status === 'pending').length
  const inTransitCount = shipments.filter(s => s.status === 'in_transit').length
  const deliveredCount = shipments.filter(s => s.delivery_status === 'delivered').length
  
  // الشحنات المسلمة فقط (المرحلة 5 أو delivery_status = delivered)
  const deliveredShipments = shipments.filter(s => 
    s.delivery_status === 'delivered' || (s.current_tracking_stage && s.current_tracking_stage >= 5)
  )
  
  // إجمالي قيمة التحصيل لكل الشحنات
  const totalAmount = shipments.reduce((sum, s) => {
    const amount = parseFloat(String(s.total_amount || 0))
    return sum + (isNaN(amount) ? 0 : amount)
  }, 0)
  
  // مجموع التحصيلات للشحنات المسلمة فقط
  const deliveredAmount = deliveredShipments.reduce((sum, s) => {
    const amount = parseFloat(String(s.total_amount || 0))
    return sum + (isNaN(amount) ? 0 : amount)
  }, 0)
  
  // حساب إجمالي أجور التوصيل لكل الشحنات
  const totalDeliveryFees = shipments.reduce((sum, s) => {
    const fee = parseFloat(String(s.delivery_fee || 0))
    return sum + (isNaN(fee) ? 0 : fee)
  }, 0)
  
  // إجمالي الدفعات المسددة
  const totalPayments = payments.reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0)
  
  // المبلغ المستحق للمشترك = تحصيلات الشحنات المسلمة - أجور التوصيل - المسدد
  const amountDue = deliveredAmount - totalDeliveryFees - totalPayments

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-500 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Image src="/images/logo.jpg" alt="شعار الريان" width={40} height={40} className="rounded-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold">شحناتي</h1>
              <p className="text-amber-100 text-sm flex items-center gap-1">
                <User className="w-3 h-3" />
                {subscriberName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchShipments}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost"
              onClick={handleLogout}
              className="text-white hover:bg-white/20 gap-2"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{shipments.length}</p>
              <p className="text-sm opacity-80">إجمالي الشحنات</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm opacity-80">قيد الانتظار</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4 text-center">
              <Truck className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{inTransitCount}</p>
              <p className="text-sm opacity-80">في الطريق</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">{deliveredCount}</p>
              <p className="text-sm opacity-80">تم التسليم</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary - Collapsible */}
        <Card className="overflow-hidden">
          <button 
            onClick={() => setShowAccountDetails(!showAccountDetails)}
            className="w-full p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5" />
              <span className="font-bold text-lg">تفاصيل الحساب</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                المستحق: {amountDue.toLocaleString()} د.أ
              </span>
              {showAccountDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>
          
          {showAccountDetails && (
            <CardContent className="p-4 space-y-3 bg-gray-50">
              {/* Total Collections - All Shipments */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-lg text-center">
                <p className="text-sm opacity-80 mb-1">إجمالي قيمة التحصيل (كل الشحنات)</p>
                <p className="text-2xl font-bold">{totalAmount.toLocaleString()} د.أ</p>
              </div>
              
              {/* Delivered Amount */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg text-center">
                <p className="text-sm opacity-80 mb-1">تحصيلات الشحنات المسلمة ({deliveredCount} شحنة)</p>
                <p className="text-2xl font-bold">{deliveredAmount.toLocaleString()} د.أ</p>
              </div>
              
              {/* Delivery Fees */}
              <div className="bg-gradient-to-r from-red-400 to-red-500 text-white p-4 rounded-lg text-center">
                <p className="text-sm opacity-80 mb-1">إجمالي أجور التوصيل</p>
                <p className="text-2xl font-bold">{totalDeliveryFees.toLocaleString()} د.أ</p>
              </div>
              
              {/* Amount Due - Only from delivered shipments */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg text-center border-2 border-blue-300">
                <p className="text-sm opacity-80 mb-1">المبلغ المستحق لك (المسلمة - الأجور - المسدد)</p>
                <p className="text-2xl font-bold">{amountDue.toLocaleString()} د.أ</p>
                {payments.length > 0 && (
                  <p className="text-xs opacity-70 mt-2">
                    عدد الفواتير المسددة: {payments.length} فاتورة
                  </p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
        
        {/* Payments Button */}
        <Button 
          onClick={() => setPaymentsDialogOpen(true)}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white gap-2 py-6"
        >
          <Receipt className="w-5 h-5" />
          <span className="font-bold">فواتير مسددة</span>
          {payments.length > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">{payments.length}</span>
          )}
        </Button>
        
        {/* Shekel Rate */}
        {shekelRate > 0 && (
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <Coins className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-700 font-medium">سعر الشيكل اليوم</p>
                    <p className="text-xs text-emerald-600/70">مقابل الدينار الأردني</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-emerald-700">{shekelRate.toFixed(2)}</p>
                  <p className="text-xs text-emerald-600">د.أ / شيكل</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              هذه الصفحة للمشاهدة فقط. للاستفسار عن شحناتك، تواصل مع الإدارة.
            </p>
          </CardContent>
        </Card>

        {/* Shipments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              قائمة شحناتي
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-amber-500" />
                <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
              </div>
            ) : shipments.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-muted-foreground">لا توجد شحنات حتى الآن</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {shipments.map((shipment) => {
                    const progress = getDeliveryProgress(shipment.current_tracking_stage, shipment.delivery_status)
                    const steps = getProgressSteps(shipment.current_tracking_stage, shipment.delivery_status)
                    const isExpanded = expandedShipments.includes(shipment.id)
                    
                    return (
                      <Card key={shipment.id} className={`border-2 ${shipment.issue_note ? 'border-red-300 bg-red-50/50' : ''}`}>
                        <CardContent className="p-0">
                          {/* Issue Warning */}
                          {shipment.issue_note && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedIssueNote(shipment.issue_note)
                                setIssueDialogOpen(true)
                              }}
                              className="w-full flex items-center justify-center gap-2 p-2 bg-red-100 text-red-600 border-b border-red-200 hover:bg-red-200 transition-colors"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              <span className="font-bold text-sm">هناك مشكلة</span>
                            </button>
                          )}
                          
                          {/* Collapsed View - Compact Single Line */}
                          <button 
                            onClick={() => toggleShipmentExpand(shipment.id)}
                            className="w-full p-3 text-right hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-1 rounded ${
                                progress === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {progress}%
                              </span>
                              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                            <div className="flex items-center gap-3 flex-1 justify-end">
                              <span className="font-bold text-sm">{shipment.receiver_name}</span>
                              <span className="font-mono text-xs text-muted-foreground">{shipment.tracking_number}</span>
                            </div>
                          </button>
                          
                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="p-4 space-y-4 border-t">
                              <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">{shipment.receiver_address}</p>
                                {getStatusBadge(shipment.status, shipment.delivery_status)}
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{progress}%</span>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${
                                      progress === 100 ? 'bg-green-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                              
                              {/* Progress Steps */}
                              <div className="flex justify-between items-center">
                                {steps.map((step, index) => (
                                  <div key={index} className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                      step.completed 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-gray-200 text-gray-500'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <p className={`text-xs mt-1 ${step.completed ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                      {step.label}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="space-y-2 pt-2 border-t">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">قيمة التحصيل</span>
                                  <span className="font-bold text-green-600">
                                    {parseFloat(String(shipment.total_amount || 0)).toLocaleString()} د.أ
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">أجور التوصيل</span>
                                  <span className="font-bold text-red-500">
                                    {parseFloat(String(shipment.delivery_fee || 0)).toLocaleString()} د.أ
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم التتبع</TableHead>
                        <TableHead className="text-right">المستلم</TableHead>
                        <TableHead className="text-right">قيمة التحصيل</TableHead>
                        <TableHead className="text-right">أجور التوصيل</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">نسبة التوصيل</TableHead>
                        <TableHead className="text-right">المرحلة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipments.map((shipment) => {
                        const progress = getDeliveryProgress(shipment.current_tracking_stage, shipment.delivery_status)
                        const steps = getProgressSteps(shipment.current_tracking_stage, shipment.delivery_status)
                        const currentStep = steps.filter(s => s.completed).length
                        
                        return (
                          <TableRow key={shipment.id}>
                            <TableCell className="font-mono text-sm">
                              {shipment.tracking_number}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{shipment.receiver_name}</p>
                                <p className="text-sm text-muted-foreground">{shipment.receiver_address}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-green-600">
                              {shipment.total_amount?.toLocaleString()} د.أ
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(shipment.status, shipment.delivery_status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      progress === 100 ? 'bg-green-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-sm">{progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {currentStep} / {steps.length}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Issue Note Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 justify-end text-red-600">
              <span>مشكلة في الشحنة</span>
              <AlertTriangle className="w-5 h-5" />
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-center text-red-700 font-medium text-lg">
                {selectedIssueNote}
              </p>
            </div>
            
            <p className="text-center text-muted-foreground text-sm mt-4">
              يرجى التواصل مع الإدارة لحل هذه المشكلة
            </p>
          </div>
          
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setIssueDialogOpen(false)
                setSelectedIssueNote(null)
              }}
            >
              حسناً
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Payments Dialog */}
      <Dialog open={paymentsDialogOpen} onOpenChange={setPaymentsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 justify-end text-green-600">
              <span>فواتير مسددة</span>
              <Receipt className="w-5 h-5" />
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-3">
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-muted-foreground">لا توجد فواتير مسددة حتى الآن</p>
              </div>
            ) : (
              payments.map((payment, index) => (
                <button
                  key={payment.id}
                  onClick={() => {
                    setSelectedPayment(payment)
                    setPaymentsDialogOpen(false)
                  }}
                  className="w-full p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-right transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString('en-GB')}
                    </span>
                    <span className="font-bold text-green-700">
                      فاتورة #{index + 1}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-green-600 mt-1">
                    {parseFloat(String(payment.amount)).toLocaleString()} د.أ
                  </div>
                </button>
              ))
            )}
          </div>
          
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setPaymentsDialogOpen(false)}
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 justify-end text-green-600">
              <span>تفاصيل الفاتورة</span>
              <Receipt className="w-5 h-5" />
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 mb-1">المبلغ المسدد</p>
                <p className="text-3xl font-bold text-green-700">{parseFloat(String(selectedPayment.amount)).toLocaleString()} د.أ</p>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>تاريخ السداد</p>
                <p className="font-medium">
                  {new Date(selectedPayment.created_at).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })} - {new Date(selectedPayment.created_at).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              {selectedPayment.notes && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-muted-foreground text-right">
                    <span className="font-medium">ملاحظات:</span> {selectedPayment.notes}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">المستحق قبل السداد</p>
                  <p className="font-bold text-blue-700">{parseFloat(String(selectedPayment.amount_before_payment)).toLocaleString()} د.أ</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 mb-1">المستحق بعد السداد</p>
                  <p className="font-bold text-green-700">{parseFloat(String(selectedPayment.amount_after_payment)).toLocaleString()} د.أ</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setSelectedPayment(null)}
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
