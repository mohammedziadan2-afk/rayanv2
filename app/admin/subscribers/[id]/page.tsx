"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  ArrowRight, 
  User, 
  Phone, 
  Building2, 
  Package,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Calendar,
  MessageSquareWarning,
  AlertTriangle,
  Printer,
  Wallet,
  Receipt,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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
}

interface Shipment {
  id: number
  tracking_number: string
  sender_name: string
  receiver_name: string
  receiver_phone: string
  receiver_address: string
  parcel_type: string
  status: string
  delivery_status: string
  total_amount: number
  price: number
  delivery_fee: number
  driver_fee: number
  current_tracking_stage: number | null
  issue_note: string | null
  created_at: string
  added_at: string
  session_id: number | null
  session_number: number | null
  session_date: string | null
  driver_name: string | null
}

interface AvailableShipment {
  id: number
  tracking_number: string
  receiver_name: string
  receiver_address: string
  total_amount: number
  status: string
}

interface CashItem {
  id: number
  task_id: number | null
  amount: number
  note: string | null
  driver_name: string | null
  added_at: string
}

export default function SubscriberDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  // Which shipment group is shown: null (none open), "pending", or "delivered"
  const [shipmentView, setShipmentView] = useState<null | "pending" | "delivered">(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedShipments, setSelectedShipments] = useState<number[]>([])
  const [adding, setAdding] = useState(false)
  // Step-based add flow: 1 = driver, 2 = session, 3 = shipments
  const [addStep, setAddStep] = useState<1 | 2 | 3>(1)
  const [drivers, setDrivers] = useState<{ id: number; name: string }[]>([])
  const [driverSessions, setDriverSessions] = useState<any[]>([])
  const [sessionTasks, setSessionTasks] = useState<any[]>([])
  const [selectedDriver, setSelectedDriver] = useState<{ id: number; name: string } | null>(null)
  const [selectedSession, setSelectedSession] = useState<any | null>(null)
  const [loadingStep, setLoadingStep] = useState(false)
  // Cash items available in the selected session, and the ones selected (by task id)
  const [sessionCashItems, setSessionCashItems] = useState<any[]>([])
  const [selectedCashItems, setSelectedCashItems] = useState<number[]>([])
  // Cash items already added to this subscriber
  const [cashItems, setCashItems] = useState<CashItem[]>([])
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [selectedShipmentForNote, setSelectedShipmentForNote] = useState<Shipment | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<string>("")
  
  const issueOptions = [
    { value: "no_response", label: "عدم الرد على وسائل الاتصال" },
    { value: "refused", label: "الزبون رفض الاستلام" },
    { value: "cancelled", label: "إلغاء الطلب من المرسل" }
  ]
  
  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [savingPayment, setSavingPayment] = useState(false)
  const [payments, setPayments] = useState<{id: number, amount: number, notes: string | null, amount_before_payment: number, amount_after_payment: number, created_at: string}[]>([])
  const [paymentsListOpen, setPaymentsListOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<{id: number, amount: number, notes: string | null, amount_before_payment: number, amount_after_payment: number, created_at: string} | null>(null)
  const [editingPayment, setEditingPayment] = useState(false)
  const [editPaymentAmount, setEditPaymentAmount] = useState("")
  const [editPaymentNotes, setEditPaymentNotes] = useState("")

  useEffect(() => {
    fetchSubscriberData()
    fetchPayments()
  }, [id])

  const fetchSubscriberData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subscribers/${id}`)
      const data = await response.json()
      
      if (data.subscriber) {
        setSubscriber(data.subscriber)

        // اعتماد أجرة السائق كأجرة التوصيل تلقائياً:
        // إذا لم يتم تعبئة أجرة التوصيل يدوياً (0) ووُجدت أجرة أدخلها السائق،
        // نستخدم أجرة السائق ونحفظها في الخادم حتى تبقى الحسابات متطابقة.
        const rawShipments: Shipment[] = data.shipments || []
        const syncedShipments = rawShipments.map((s) => {
          const driverFee = Number(s.driver_fee || 0)
          const currentFee = Number(s.delivery_fee || 0)
          if (currentFee === 0 && driverFee > 0) {
            // حفظ القيمة في الخلفية (بدون انتظار) لضمان الاستمرارية
            fetch(`/api/subscribers/${id}/shipments/${s.id}/delivery-fee`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ delivery_fee: driverFee }),
            }).catch((err) => console.error("[v0] auto delivery-fee sync failed:", err))
            return { ...s, delivery_fee: driverFee }
          }
          return s
        })

        setShipments(syncedShipments)
        setCashItems(data.cash_items || [])
      }
    } catch (error) {
      console.error('Error fetching subscriber:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/subscribers/${id}/payments`)
      const data = await response.json()
      setPayments(data.payments || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  const fetchDrivers = async () => {
    try {
      setLoadingStep(true)
      const response = await fetch(`/api/drivers`)
      const data = await response.json()
      setDrivers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
    } finally {
      setLoadingStep(false)
    }
  }

  const fetchDriverSessions = async (driverId: number) => {
    try {
      setLoadingStep(true)
      const response = await fetch(`/api/drivers/${driverId}/sessions`)
      const data = await response.json()
      setDriverSessions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching driver sessions:', error)
    } finally {
      setLoadingStep(false)
    }
  }

  const fetchSessionShipments = async (driverId: number, sessionId: number) => {
    try {
      setLoadingStep(true)
      const response = await fetch(`/api/drivers/${driverId}/sessions/${sessionId}/tasks`)
      const data = await response.json()
      const all = Array.isArray(data) ? data : []
      // Exclude shipments already assigned to this subscriber
      const assignedIds = new Set(shipments.map((s) => s.id))
      const tasks = all.filter(
        (t: any) => (t.task_type || "shipment") === "shipment" && t.shipment_id && !assignedIds.has(t.shipment_id)
      )
      setSessionTasks(tasks)
      // Cash receipts (financial amounts) that are not yet added to this subscriber
      const addedTaskIds = new Set(cashItems.map((c) => c.task_id))
      const cash = all.filter(
        (t: any) => t.task_type === "cash_receipt" && !addedTaskIds.has(t.id)
      )
      setSessionCashItems(cash)
    } catch (error) {
      console.error('Error fetching session shipments:', error)
    } finally {
      setLoadingStep(false)
    }
  }

  const resetAddFlow = () => {
    setAddStep(1)
    setDrivers([])
    setDriverSessions([])
    setSessionTasks([])
    setSessionCashItems([])
    setSelectedDriver(null)
    setSelectedSession(null)
    setSelectedShipments([])
    setSelectedCashItems([])
    setSearchQuery("")
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (open) {
      resetAddFlow()
      fetchDrivers()
    }
  }

  const selectDriver = (driver: { id: number; name: string }) => {
    setSelectedDriver(driver)
    setSelectedSession(null)
    setSelectedShipments([])
    setSelectedCashItems([])
    setAddStep(2)
    fetchDriverSessions(driver.id)
  }

  const selectSession = (session: any) => {
    setSelectedSession(session)
    setSelectedShipments([])
    setSelectedCashItems([])
    setAddStep(3)
    if (selectedDriver) {
      fetchSessionShipments(selectedDriver.id, session.id)
    }
  }

  const toggleShipmentSelection = (shipmentId: number) => {
    setSelectedShipments(prev => 
      prev.includes(shipmentId) 
        ? prev.filter(id => id !== shipmentId)
        : [...prev, shipmentId]
    )
  }

  const toggleCashItemSelection = (taskId: number) => {
    setSelectedCashItems(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const addShipmentsToSubscriber = async () => {
    if (selectedShipments.length === 0 && selectedCashItems.length === 0) return
    
    try {
      setAdding(true)
      // Build cash items payload from selected task ids
      const cash_items = sessionCashItems
        .filter((c: any) => selectedCashItems.includes(c.id))
        .map((c: any) => ({
          task_id: c.id,
          amount: Number(c.cash_amount) || 0,
          note: c.cash_note || null,
          driver_id: selectedDriver?.id ?? null,
          session_id: selectedSession?.id ?? null,
        }))

      const response = await fetch(`/api/subscribers/${id}/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipment_ids: selectedShipments, cash_items })
      })
      
      if (response.ok) {
        setDialogOpen(false)
        resetAddFlow()
        fetchSubscriberData()
      }
    } catch (error) {
      console.error('Error adding shipments:', error)
    } finally {
      setAdding(false)
    }
  }

  const removeCashItem = async (cashItemId: number) => {
    if (!confirm('هل تريد إزالة هذا المبلغ المالي من المشترك؟')) return
    try {
      await fetch(`/api/subscribers/${id}/cash-items/${cashItemId}`, {
        method: 'DELETE'
      })
      fetchSubscriberData()
    } catch (error) {
      console.error('Error removing cash item:', error)
    }
  }

  const removeShipment = async (shipmentId: number) => {
    if (!confirm('هل تريد إزالة هذه الشحنة من المشترك؟')) return
    
    try {
      await fetch(`/api/subscribers/${id}/shipments/${shipmentId}`, {
        method: 'DELETE'
      })
      fetchSubscriberData()
    } catch (error) {
      console.error('Error removing shipment:', error)
    }
  }
  
  const saveIssueNote = async () => {
    if (!selectedShipmentForNote || !selectedIssue) return
    
    try {
      const issueLabel = issueOptions.find(opt => opt.value === selectedIssue)?.label || selectedIssue
      await fetch(`/api/subscribers/${id}/shipments/${selectedShipmentForNote.id}/issue-note`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_note: issueLabel })
      })
      
      // Update local state
      setShipments(prev => prev.map(s => 
        s.id === selectedShipmentForNote.id ? { ...s, issue_note: issueLabel } : s
      ))
      setNoteDialogOpen(false)
      setSelectedShipmentForNote(null)
      setSelectedIssue("")
    } catch (error) {
      console.error('Error saving issue note:', error)
    }
  }
  
  const removeIssueNote = async (shipmentId: number) => {
    try {
      await fetch(`/api/subscribers/${id}/shipments/${shipmentId}/issue-note`, {
        method: 'DELETE'
      })
      
      // Update local state
      setShipments(prev => prev.map(s => 
        s.id === shipmentId ? { ...s, issue_note: null } : s
      ))
    } catch (error) {
      console.error('Error removing issue note:', error)
    }
  }
  
  // Calculate amount due for payment
  const calculateAmountDue = () => {
    const isDelivered = (s: Shipment) =>
      s.delivery_status === 'delivered' || (s.current_tracking_stage && s.current_tracking_stage >= 5)
    const shipVal = (s: Shipment) => parseFloat(String(s.price ?? s.total_amount ?? 0))
    const cashVal = (c: typeof cashItems[number]) => parseFloat(String(c.amount || 0))

    const deliveredShipments = shipments.filter(isDelivered)

    // إجمالي التحصيلات: القيم الموجبة فقط (شحنات مسلمة + مبالغ)
    const totalCollections =
      deliveredShipments.filter((s) => shipVal(s) > 0).reduce((sum, s) => sum + shipVal(s), 0) +
      cashItems.filter((c) => cashVal(c) > 0).reduce((sum, c) => sum + cashVal(c), 0)

    // دفعات للريان: مجموع القيم السالبة محوّلاً إلى رقم موجب
    const alrayanPayments = Math.abs(
      deliveredShipments.filter((s) => shipVal(s) < 0).reduce((sum, s) => sum + shipVal(s), 0) +
      cashItems.filter((c) => cashVal(c) < 0).reduce((sum, c) => sum + cashVal(c), 0)
    )

    const totalFees = shipments.reduce((sum, s) => sum + parseFloat(String(s.delivery_fee || 0)), 0)
    const totalPayments = payments.reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0)
    return totalCollections - totalFees - totalPayments - alrayanPayments
  }
  
  const getTotalPayments = () => {
    return payments.reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0)
  }
  
  const savePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return
    
    setSavingPayment(true)
    try {
      const amountBefore = calculateAmountDue()
      const amountAfter = amountBefore - parseFloat(paymentAmount)
      
      await fetch(`/api/subscribers/${id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          notes: paymentNotes,
          amount_before_payment: amountBefore,
          amount_after_payment: amountAfter
        })
      })
      
      setPaymentDialogOpen(false)
      setPaymentAmount("")
      setPaymentNotes("")
      fetchPayments() // Refresh payments list
    } catch (error) {
      console.error('Error saving payment:', error)
      alert('حدث خطأ أثناء حفظ الدفعة')
    } finally {
      setSavingPayment(false)
    }
  }
  
  const updatePayment = async () => {
    if (!selectedPayment || !editPaymentAmount || parseFloat(editPaymentAmount) <= 0) return
    
    setSavingPayment(true)
    try {
      await fetch(`/api/subscribers/${id}/payments/${selectedPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(editPaymentAmount),
          notes: editPaymentNotes
        })
      })
      
      setSelectedPayment(null)
      setEditingPayment(false)
      fetchPayments()
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('حدث خطأ أثناء تحديث الدفعة')
    } finally {
      setSavingPayment(false)
    }
  }
  
  const deletePayment = async (paymentId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return
    
    try {
      await fetch(`/api/subscribers/${id}/payments/${paymentId}`, {
        method: 'DELETE'
      })
      
      setSelectedPayment(null)
      fetchPayments()
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('حدث خطأ أثناء حذف الدفعة')
    }
  }

  const printSubscriberSummary = async () => {
    const isDelivered = (s: Shipment) =>
      s.delivery_status === 'delivered' || (s.current_tracking_stage && s.current_tracking_stage >= 5)
    const shipVal = (s: Shipment) => parseFloat(String(s.price ?? s.total_amount ?? 0))
    const cashVal = (c: typeof cashItems[number]) => parseFloat(String(c.amount || 0))

    const deliveredShipments = shipments.filter(isDelivered)
    const positiveShipments = deliveredShipments.filter((s) => shipVal(s) > 0)
    const positiveCash = cashItems.filter((c) => cashVal(c) > 0)
    const negativeCash = cashItems.filter((c) => cashVal(c) < 0)

    // إجمالي التحصيلات: القيم الموجبة فقط (شحنات مسلمة + مبالغ)
    const totalCollections =
      positiveShipments.reduce((sum, s) => sum + shipVal(s), 0) +
      positiveCash.reduce((sum, c) => sum + cashVal(c), 0)

    // مبالغ مدفوعة عن الريان: مجموع القيم السالبة (شحنات + مبالغ) محوّلاً إلى رقم موجب
    const alrayanPaidAmounts = Math.abs(
      deliveredShipments.filter((s) => shipVal(s) < 0).reduce((sum, s) => sum + shipVal(s), 0) +
      negativeCash.reduce((sum, c) => sum + cashVal(c), 0)
    )

    const totalFees = shipments.reduce((sum, s) => sum + parseFloat(String(s.delivery_fee || 0)), 0)
    // مجموع المسدد للريان (الدفعات المسددة للمشترك)
    const totalPaidToRayan = payments.reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0)
    const amountDue = totalCollections - alrayanPaidAmounts - totalFees - totalPaidToRayan

    const currency = (n: number) => `${n.toLocaleString()} د.أ`

    const printContent = `
        <style>
          .pdf-root * { margin: 0; padding: 0; box-sizing: border-box; }
          .pdf-root { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 16px; direction: rtl; background: #ffffff; color: #111; width: 100%; max-width: 800px; margin: 0 auto; }
          .pdf-root .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #0f4c81; padding-bottom: 16px; }
          .pdf-root .header h1 { color: #0f4c81; font-size: 22px; margin-bottom: 5px; }
          .pdf-root .header p { color: #666; font-size: 14px; }
          .pdf-root .subscriber-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .pdf-root .subscriber-info h2 { font-size: 18px; margin-bottom: 10px; color: #333; }
          .pdf-root .subscriber-info p { margin: 5px 0; font-size: 14px; }
          .pdf-root .summary-box { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px; }
          .pdf-root .summary-item { padding: 14px; border-radius: 8px; text-align: center; }
          .pdf-root .summary-item.total { background: #fef3c7; border: 1px solid #f59e0b; }
          .pdf-root .summary-item.alrayan { background: #ffedd5; border: 1px solid #f97316; }
          .pdf-root .summary-item.paid { background: #ede9fe; border: 1px solid #8b5cf6; }
          .pdf-root .summary-item.fees { background: #fee2e2; border: 1px solid #ef4444; }
          .pdf-root .summary-item.due { background: #dbeafe; border: 1px solid #3b82f6; }
          .pdf-root .summary-item label { display: block; font-size: 12px; color: #666; margin-bottom: 5px; }
          .pdf-root .summary-item span { font-size: 20px; font-weight: bold; }
          .pdf-root h3 { margin: 20px 0 10px; font-size: 15px; color: #0f4c81; }
          .pdf-root .table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .pdf-root table { width: 100%; border-collapse: collapse; margin-top: 8px; min-width: 560px; }
          .pdf-root th, .pdf-root td { border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px; }
          .pdf-root th { background: #0f4c81; color: white; }
          .pdf-root tbody tr:nth-child(even) { background: #f9f9f9; }
          .pdf-root .pos { color: #16a34a; font-weight: bold; }
          .pdf-root .neg { color: #dc2626; font-weight: bold; }
          .pdf-root .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 15px; }
          .pdf-root .print-date { font-size: 11px; color: #999; margin-top: 10px; }
        </style>
        <div class="header">
          <h1>مؤسسة الريان للشحن</h1>
          <p>ملخص حساب المشترك</p>
        </div>
        
        <div class="subscriber-info">
          <h2>${subscriber?.full_name}</h2>
          <p><strong>اسم المستخدم:</strong> ${subscriber?.username}</p>
          <p><strong>الهاتف:</strong> ${subscriber?.phone || 'غير محدد'}</p>
          <p><strong>الشركة:</strong> ${subscriber?.company_name || 'غير محدد'}</p>
          <p><strong>عدد الشحنات:</strong> ${shipments.length}</p>
        </div>
        
        <div class="summary-box">
          <div class="summary-item total">
            <label>إجمالي التحصيلات (${positiveShipments.length + positiveCash.length})</label>
            <span>${currency(totalCollections)}</span>
          </div>
          <div class="summary-item alrayan">
            <label>مبالغ مدفوعة عن الريان</label>
            <span>${currency(alrayanPaidAmounts)}</span>
          </div>
          <div class="summary-item paid">
            <label>المسدد للريان</label>
            <span>${currency(totalPaidToRayan)}</span>
          </div>
          <div class="summary-item fees">
            <label>أجور التوصيل</label>
            <span>${currency(totalFees)}</span>
          </div>
          <div class="summary-item due">
            <label>المبلغ المستحق للمشترك</label>
            <span>${currency(amountDue)}</span>
          </div>
        </div>
        
        <h3 style="margin-bottom: 10px;">تفاصيل الشحنات</h3>
        <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>رقم التتبع</th>
              <th>المستلم</th>
              <th>العنوان</th>
              <th>قيمة التحصيل</th>
              <th>أجور التوصيل</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${shipments.map((s, i) => {
              const v = shipVal(s)
              return `
              <tr>
                <td>${i + 1}</td>
                <td>${s.tracking_number}</td>
                <td>${s.receiver_name}</td>
                <td>${s.receiver_address}</td>
                <td class="${v < 0 ? 'neg' : 'pos'}">${currency(v)}</td>
                <td>${currency(parseFloat(String(s.delivery_fee || 0)))}</td>
                <td>${s.delivery_status === 'delivered' ? 'تم التسليم' : s.status === 'in_transit' ? 'في الطريق' : 'قيد الانتظار'}</td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
        </div>

        ${(cashItems.length > 0 || payments.length > 0) ? `
        <h3>المبالغ المالية والدفعات</h3>
        <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>البيان</th>
              <th>الجهة</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${cashItems.map((c, i) => {
              const v = cashVal(c)
              return `
              <tr>
                <td>${i + 1}</td>
                <td>${c.note || 'مبلغ مالي'}</td>
                <td>${c.driver_name || '-'}</td>
                <td class="${v < 0 ? 'neg' : 'pos'}">${currency(v)}</td>
              </tr>`
            }).join('')}
            ${payments.map((p, i) => {
              const v = -Math.abs(parseFloat(String(p.amount || 0)))
              return `
              <tr>
                <td>${cashItems.length + i + 1}</td>
                <td>مسدد للريان${p.notes ? ` - ${p.notes}` : ''}</td>
                <td>-</td>
                <td class="neg">${currency(v)}</td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
        </div>` : ''}
        
        <div class="footer">
          <p>مؤسسة الريان للشحن - خدمات الشحن والتوصيل</p>
          <p class="print-date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}</p>
        </div>
    `

    // فتح نافذة تعرض الملخص بنص عربي حقيقي ومتناسق مع كل الشاشات،
    // مع أزرار للطباعة (يمكن حفظه كـ PDF) والإغلاق
    const fullDocument = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <title>ملخص حساب ${subscriber?.full_name || 'مشترك'}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background: #f1f5f9; }
          .toolbar {
            position: sticky; top: 0; z-index: 10;
            display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
            padding: 12px 16px; background: #0f4c81;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          }
          .toolbar button {
            font-family: inherit; font-size: 15px; font-weight: 700;
            border: none; border-radius: 8px; padding: 12px 22px;
            cursor: pointer; min-height: 44px; min-width: 120px;
          }
          .toolbar .btn-print { background: #22c55e; color: #fff; }
          .toolbar .btn-close { background: #ffffff; color: #0f4c81; }
          .page { padding: 16px 8px 40px; }
          @media print {
            html, body { background: #ffffff; }
            .toolbar { display: none !important; }
            .page { padding: 0; }
            .pdf-root { max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button class="btn-print" onclick="window.print()">طباعة / حفظ PDF</button>
          <button class="btn-close" onclick="window.close()">إغلاق</button>
        </div>
        <div class="page">
          <div class="pdf-root">${printContent}</div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لعرض الملخص وطباعته أو حفظه كـ PDF')
      return
    }
    printWindow.document.open()
    printWindow.document.write(fullDocument)
    printWindow.document.close()
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

  const getDeliveryProgress = (status: string, deliveryStatus: string) => {
    if (deliveryStatus === 'delivered') return 100
    switch (status) {
      case 'pending': return 25
      case 'processing': return 50
      case 'in_transit': return 75
      default: return 0
    }
  }

  const isDelivered = (s: Shipment) =>
    s.delivery_status === 'delivered' || (!!s.current_tracking_stage && s.current_tracking_stage >= 5)

  const pendingShipments = shipments.filter((s) => !isDelivered(s))
  const deliveredShipments = shipments.filter((s) => isDelivered(s))

  // Group delivered shipments by their session
  const deliveredGroups = (() => {
    const map = new Map<string, { key: string; session_number: number | null; session_date: string | null; driver_name: string | null; items: Shipment[] }>()
    for (const s of deliveredShipments) {
      const key = s.session_id ? `s-${s.session_id}` : "no-session"
      if (!map.has(key)) {
        map.set(key, {
          key,
          session_number: s.session_number,
          session_date: s.session_date,
          driver_name: s.driver_name,
          items: [],
        })
      }
      map.get(key)!.items.push(s)
    }
    return Array.from(map.values())
  })()

  // Color palette to distinguish session groups
  const groupPalette = [
    { border: "border-r-4 border-r-blue-400", head: "bg-blue-50 text-blue-800" },
    { border: "border-r-4 border-r-emerald-400", head: "bg-emerald-50 text-emerald-800" },
    { border: "border-r-4 border-r-orange-400", head: "bg-orange-50 text-orange-800" },
    { border: "border-r-4 border-r-teal-400", head: "bg-teal-50 text-teal-800" },
    { border: "border-r-4 border-r-pink-400", head: "bg-pink-50 text-pink-800" },
    { border: "border-r-4 border-r-indigo-400", head: "bg-indigo-50 text-indigo-800" },
  ]

  const renderShipmentRow = (shipment: Shipment, rowClass = "") => {
    const stage = shipment.current_tracking_stage && shipment.current_tracking_stage > 0 ? shipment.current_tracking_stage : 1
    const progress = shipment.delivery_status === 'delivered' ? 100 : Math.min(stage * 20, 100)
    return (
      <TableRow key={shipment.id} className={rowClass}>
        <TableCell className="font-mono text-sm">{shipment.tracking_number}</TableCell>
        <TableCell>
          <div>
            <p className="font-medium">{shipment.receiver_name}</p>
            <p className="text-sm text-muted-foreground">{shipment.receiver_address}</p>
          </div>
        </TableCell>
        <TableCell className="font-bold text-green-600">
          {parseFloat(String(shipment.price ?? shipment.total_amount ?? 0)).toLocaleString()} د.أ
        </TableCell>
        <TableCell>
          <Input
            key={`fee-${shipment.id}-${shipment.delivery_fee}`}
            type="number"
            min="0"
            step="0.01"
            className="w-24 text-center"
            defaultValue={shipment.delivery_fee || 0}
            onBlur={async (e) => {
              const newFee = parseFloat(e.target.value) || 0
              if (newFee !== shipment.delivery_fee) {
                try {
                  await fetch(`/api/subscribers/${id}/shipments/${shipment.id}/delivery-fee`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ delivery_fee: newFee })
                  })
                  setShipments(prev => prev.map(s => 
                    s.id === shipment.id ? { ...s, delivery_fee: newFee } : s
                  ))
                } catch (error) {
                  console.error('Error updating delivery fee:', error)
                }
              }
            }}
          />
        </TableCell>
        <TableCell>{getStatusBadge(shipment.status, shipment.delivery_status)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm">{progress}%</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${shipment.issue_note ? 'text-red-500' : 'text-gray-400'}`}
              onClick={() => {
                setSelectedShipmentForNote(shipment)
                setSelectedIssue(issueOptions.find(opt => opt.label === shipment.issue_note)?.value || "")
                setNoteDialogOpen(true)
              }}
              title={shipment.issue_note || "إضافة ملاحظة"}
            >
              <MessageSquareWarning className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => removeShipment(shipment.id)}
            >
              <XCircle className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!subscriber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <p>المشترك غير موجود</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-500 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/subscribers">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Image src="/images/logo.jpg" alt="شعار الريان" width={40} height={40} className="rounded-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{subscriber.full_name}</h1>
              <p className="text-amber-100 text-sm">تفاصيل المشترك</p>
            </div>
          </div>
          
          <Badge className={subscriber.is_active ? "bg-green-500" : "bg-red-500"}>
            {subscriber.is_active ? "فعال" : "غير فعال"}
          </Badge>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Subscriber Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">اسم المستخدم</p>
                  <p className="font-medium font-mono">{subscriber.username}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-medium">{subscriber.phone || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الشركة</p>
                  <p className="font-medium">{subscriber.company_name || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الاشتراك</p>
                  <p className="font-medium">
                    {new Date(subscriber.created_at).toLocaleDateString('ar-IQ')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
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
              <p className="text-2xl font-bold">
                {shipments.filter(s => s.delivery_status === 'pending').length}
              </p>
              <p className="text-sm opacity-80">قيد الانتظار</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4 text-center">
              <Truck className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">
                {shipments.filter(s => s.status === 'in_transit').length}
              </p>
              <p className="text-sm opacity-80">في الطريق</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold">
                {shipments.filter(s => s.delivery_status === 'delivered').length}
              </p>
              <p className="text-sm opacity-80">تم التسليم</p>
            </CardContent>
          </Card>
        </div>

        {/* Shipments Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              شحنات المشترك
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Print Button */}
              <Button 
                variant="outline" 
                onClick={printSubscriberSummary}
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                طباعة الملخص
              </Button>
              
              <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-500 hover:bg-amber-600">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة شحنات
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة شحنات للمشترك</DialogTitle>
                </DialogHeader>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  {[
                    { step: 1, label: "السائق" },
                    { step: 2, label: "الجلسة" },
                    { step: 3, label: "الشحنات" },
                  ].map((s, idx) => (
                    <div key={s.step} className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium ${
                          addStep === s.step
                            ? "bg-amber-500 text-white"
                            : addStep > s.step
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs">
                          {s.step}
                        </span>
                        {s.label}
                      </div>
                      {idx < 2 && <div className="w-4 h-px bg-gray-300" />}
                    </div>
                  ))}
                </div>

                {/* Breadcrumb of current selection */}
                {(selectedDriver || selectedSession) && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground border rounded-lg p-2 bg-gray-50">
                    {selectedDriver && (
                      <span className="flex items-center gap-1">
                        <Truck className="w-4 h-4 text-amber-600" />
                        {selectedDriver.name}
                      </span>
                    )}
                    {selectedSession && (
                      <span className="flex items-center gap-1">
                        <span className="text-gray-300">/</span>
                        <Calendar className="w-4 h-4 text-amber-600" />
                        جلسة #{selectedSession.session_number}
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {loadingStep ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                    </div>
                  ) : addStep === 1 ? (
                    /* Step 1: Select driver */
                    drivers.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">لا يوجد سائقون</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {drivers.map((driver) => (
                          <button
                            key={driver.id}
                            onClick={() => selectDriver(driver)}
                            className="w-full flex items-center justify-between p-3 border rounded-lg text-right hover:bg-amber-50 hover:border-amber-300 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <Truck className="w-5 h-5 text-amber-600" />
                              </div>
                              <span className="font-medium">{driver.name}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
                          </button>
                        ))}
                      </div>
                    )
                  ) : addStep === 2 ? (
                    /* Step 2: Select session */
                    driverSessions.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">لا توجد جلسات لهذا السائق</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {driverSessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => selectSession(session)}
                            className="w-full flex items-center justify-between p-3 border rounded-lg text-right hover:bg-amber-50 hover:border-amber-300 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-medium">جلسة #{session.session_number}</p>
                                <p className="text-sm text-muted-foreground">
                                  {session.session_date
                                    ? new Date(session.session_date).toLocaleDateString("ar-EG")
                                    : ""}
                                  {session.trip_number ? ` • رحلة ${session.trip_number}` : ""}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
                          </button>
                        ))}
                      </div>
                    )
                  ) : (
                    /* Step 3: Select shipments from session */
                    <>
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="بحث برقم التتبع أو اسم المستلم..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-10"
                        />
                      </div>

                      {(() => {
                        const q = searchQuery.trim().toLowerCase()
                        const filtered = sessionTasks.filter(
                          (t: any) =>
                            !q ||
                            String(t.tracking_number || "").toLowerCase().includes(q) ||
                            String(t.receiver_name || "").toLowerCase().includes(q)
                        )
                        const filteredCash = sessionCashItems.filter(
                          (c: any) =>
                            !q ||
                            String(c.cash_note || "").toLowerCase().includes(q) ||
                            String(c.cash_amount || "").toLowerCase().includes(q)
                        )
                        if (filtered.length === 0 && filteredCash.length === 0) {
                          return (
                            <p className="text-center py-8 text-muted-foreground">
                              لا توجد عناصر متاحة في هذه الجلسة
                            </p>
                          )
                        }
                        return (
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {filtered.map((task: any) => (
                              <div
                                key={`ship-${task.shipment_id}`}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedShipments.includes(task.shipment_id)
                                    ? "border-amber-500 bg-amber-50"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() => toggleShipmentSelection(task.shipment_id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-mono text-sm">{task.tracking_number}</p>
                                    <p className="font-medium">{task.receiver_name}</p>
                                    <p className="text-sm text-muted-foreground">{task.receiver_address}</p>
                                  </div>
                                  <div className="text-left">
                                    <p className="font-bold text-green-600">
                                      {Number(task.amount || 0).toLocaleString()} د.أ
                                    </p>
                                    <input
                                      type="checkbox"
                                      checked={selectedShipments.includes(task.shipment_id)}
                                      onChange={() => {}}
                                      className="w-5 h-5 mt-2"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}

                            {filteredCash.map((cash: any) => (
                              <div
                                key={`cash-${cash.id}`}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedCashItems.includes(cash.id)
                                    ? "border-emerald-500 bg-emerald-50"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() => toggleCashItemSelection(cash.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Badge className="bg-emerald-600 gap-1 mb-1">
                                      <Wallet className="w-3 h-3" />
                                      مبلغ مالي
                                    </Badge>
                                    <p className="text-sm text-muted-foreground">
                                      {cash.cash_note || "استلام نقدي"}
                                    </p>
                                  </div>
                                  <div className="text-left">
                                    <p className="font-bold text-emerald-600">
                                      {Number(cash.cash_amount || 0).toLocaleString()} د.أ
                                    </p>
                                    <input
                                      type="checkbox"
                                      checked={selectedCashItems.includes(cash.id)}
                                      onChange={() => {}}
                                      className="w-5 h-5 mt-2"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    {addStep === 3 ? (
                      <Button
                        onClick={addShipmentsToSubscriber}
                        disabled={(selectedShipments.length === 0 && selectedCashItems.length === 0) || adding}
                        className="flex-1 bg-amber-500 hover:bg-amber-600"
                      >
                        {adding ? (
                          <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 ml-2" />
                        )}
                        إضافة ({selectedShipments.length + selectedCashItems.length})
                      </Button>
                    ) : (
                      <div className="flex-1" />
                    )}
                    {addStep > 1 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedShipments([])
                          setSelectedCashItems([])
                          setAddStep((prev) => (prev === 3 ? 2 : 1) as 1 | 2 | 3)
                        }}
                      >
                        رجوع
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent>
            {shipments.length === 0 && cashItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-muted-foreground">لا توجد شحنات لهذا المشترك</p>
              </div>
            ) : (
              <>
                {/* Toggle buttons for pending / delivered */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant={shipmentView === "pending" ? "default" : "outline"}
                    className={shipmentView === "pending" ? "bg-amber-500 hover:bg-amber-600" : "border-amber-300 text-amber-700"}
                    onClick={() => setShipmentView((v) => (v === "pending" ? null : "pending"))}
                  >
                    <Clock className="w-4 h-4 ml-2" />
                    قيد الانتظار ({pendingShipments.length})
                  </Button>
                  <Button
                    variant={shipmentView === "delivered" ? "default" : "outline"}
                    className={shipmentView === "delivered" ? "bg-green-600 hover:bg-green-700" : "border-green-300 text-green-700"}
                    onClick={() => setShipmentView((v) => (v === "delivered" ? null : "delivered"))}
                  >
                    <CheckCircle className="w-4 h-4 ml-2" />
                    تم التسليم ({deliveredShipments.length + cashItems.length})
                  </Button>
                </div>

                {shipmentView === null && (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg bg-gray-50">
                    اختر "قيد الانتظار" أو "تم التسليم" لعرض الشحنات
                  </div>
                )}

                {/* Pending view */}
                {shipmentView === "pending" && (
                  <div className="overflow-x-auto">
                    {pendingShipments.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">لا توجد شحنات قيد الانتظار</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">رقم التتبع</TableHead>
                            <TableHead className="text-right">المستلم</TableHead>
                            <TableHead className="text-right">قيمة التحصيل</TableHead>
                            <TableHead className="text-right">أجور التوصيل</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">نسبة التوصيل</TableHead>
                            <TableHead className="text-right">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingShipments.map((shipment) => renderShipmentRow(shipment))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}

                {/* Delivered view — grouped by session */}
                {shipmentView === "delivered" && (
                  <div className="space-y-6">
                    {deliveredGroups.length === 0 && cashItems.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">لا توجد شحنات تم تسليمها</p>
                    ) : (
                      <>
                        {deliveredGroups.map((group, idx) => {
                          const palette = groupPalette[idx % groupPalette.length]
                          return (
                            <div key={group.key} className={`rounded-lg border overflow-hidden ${palette.border}`}>
                              <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2 ${palette.head}`}>
                                <div className="flex items-center gap-2 font-semibold">
                                  <Calendar className="w-4 h-4" />
                                  {group.session_number != null ? `جلسة #${group.session_number}` : "بدون جلسة"}
                                  {group.driver_name && (
                                    <span className="flex items-center gap-1 text-sm font-normal">
                                      <Truck className="w-3.5 h-3.5" />
                                      {group.driver_name}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  {group.session_date && (
                                    <span>{new Date(group.session_date).toLocaleDateString("ar-EG")}</span>
                                  )}
                                  <Badge variant="secondary">{group.items.length} شحنة</Badge>
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-right">رقم التتبع</TableHead>
                                      <TableHead className="text-right">المستلم</TableHead>
                                      <TableHead className="text-right">قيمة التحصيل</TableHead>
                                      <TableHead className="text-right">أجور التوصيل</TableHead>
                                      <TableHead className="text-right">الحالة</TableHead>
                                      <TableHead className="text-right">نسبة التوصيل</TableHead>
                                      <TableHead className="text-right">الإجراءات</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {group.items.map((shipment) => renderShipmentRow(shipment))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )
                        })}

                        {/* Cash items (financial amounts) */}
                        {cashItems.length > 0 && (
                          <div className="rounded-lg border overflow-hidden border-r-4 border-r-emerald-500">
                            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-emerald-50 text-emerald-800">
                              <div className="flex items-center gap-2 font-semibold">
                                <Wallet className="w-4 h-4" />
                                مبالغ مالية
                              </div>
                              <Badge variant="secondary">{cashItems.length} عنصر</Badge>
                            </div>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableBody>
                                  {cashItems.map((cash) => (
                                    <TableRow key={`cash-${cash.id}`} className="bg-emerald-50/50">
                                      <TableCell>
                                        <Badge className="bg-emerald-600 gap-1">
                                          <Wallet className="w-3 h-3" />
                                          مبلغ مالي
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <div>
                                          <p className="font-medium">{cash.note || "استلام نقدي"}</p>
                                          {cash.driver_name && (
                                            <p className="text-sm text-muted-foreground">السائق: {cash.driver_name}</p>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-bold text-emerald-600">
                                        {parseFloat(String(cash.amount || 0)).toLocaleString()} د.أ
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">-</TableCell>
                                      <TableCell>
                                        <Badge className="bg-emerald-600">مستلم</Badge>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">-</TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => removeCashItem(cash.id)}
                                        >
                                          <XCircle className="w-4 h-4 text-red-500" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {/* Financial Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <Button 
                      onClick={() => setPaymentDialogOpen(true)}
                      className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      المسددة للمشترك
                    </Button>
                    <h3 className="font-bold text-lg text-right">ملخص الحساب</h3>
                  </div>
                  {(() => {
                    const isDelivered = (s: Shipment) =>
                      s.delivery_status === 'delivered' || (s.current_tracking_stage && s.current_tracking_stage >= 5)
                    const shipVal = (s: Shipment) => parseFloat(String(s.price ?? s.total_amount ?? 0))
                    const cashVal = (c: typeof cashItems[number]) => parseFloat(String(c.amount || 0))

                    const deliveredShipments = shipments.filter(isDelivered)

                    // إجمالي التحصيلات: الشحنات المسلمة والمبالغ ذات القيمة الموجبة فقط
                    const positiveShipments = deliveredShipments.filter((s) => shipVal(s) > 0)
                    const positiveCash = cashItems.filter((c) => cashVal(c) > 0)
                    const positiveCashTotal = positiveCash.reduce((sum, c) => sum + cashVal(c), 0)
                    const totalCollections =
                      positiveShipments.reduce((sum, s) => sum + shipVal(s), 0) + positiveCashTotal

                    // دفعات للريان: مجموع القيم السالبة محوّلاً إلى رقم موجب
                    const negativeTotal =
                      deliveredShipments.filter((s) => shipVal(s) < 0).reduce((sum, s) => sum + shipVal(s), 0) +
                      cashItems.filter((c) => cashVal(c) < 0).reduce((sum, c) => sum + cashVal(c), 0)
                    const alrayanPayments = Math.abs(negativeTotal)

                    const totalFees = shipments.reduce((sum, s) => sum + parseFloat(String(s.delivery_fee || 0)), 0)
                    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0)
                    const amountDue = totalCollections - totalFees - totalPaid - alrayanPayments

                    const totalPaidToRayan = totalPaid

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                          <p className="text-sm text-muted-foreground mb-1">إجمالي التحصيلات ({positiveShipments.length + positiveCash.length})</p>
                          <p className="text-2xl font-bold text-amber-600">
                            {totalCollections.toLocaleString()} د.أ
                          </p>
                          {positiveCashTotal > 0 && (
                            <p className="text-xs text-emerald-600 mt-1">منها مبالغ مالية: {positiveCashTotal.toLocaleString()} د.أ</p>
                          )}
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                          <p className="text-sm text-muted-foreground mb-1">مبالغ مدفوعة عن الريان</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {alrayanPayments.toLocaleString()} د.أ
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">(مجموع المبالغ السالبة)</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                          <p className="text-sm text-muted-foreground mb-1">المسدد للريان</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {totalPaidToRayan.toLocaleString()} د.أ
                          </p>
                          {payments.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">عدد الفواتير: {payments.length}</p>
                          )}
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                          <p className="text-sm text-muted-foreground mb-1">إجمالي أجور التوصيل</p>
                          <p className="text-2xl font-bold text-red-500">
                            {totalFees.toLocaleString()} د.أ
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center border-2 border-blue-200">
                          <p className="text-sm text-muted-foreground mb-1">المبلغ المستحق للمشترك</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {amountDue.toLocaleString()} د.أ
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">(التحصيلات - مبالغ الريان - الأجور - المسدد)</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
                
                {/* Payments Summary */}
                {payments.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPaymentsListOpen(!paymentsListOpen)}
                        className="text-green-700 hover:text-green-800"
                      >
                        {paymentsListOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-700">إجمالي المسدد: {getTotalPayments().toLocaleString()} د.أ</p>
                        <p className="text-xs text-green-600">{payments.length} دفعة</p>
                      </div>
                    </div>
                    
                    {paymentsListOpen && (
                      <div className="space-y-2 mt-3 border-t border-green-200 pt-3">
                        {payments.map((payment, index) => (
                          <div 
                            key={payment.id} 
                            className="p-2 bg-white rounded border cursor-pointer hover:bg-green-50 transition-colors"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {new Date(payment.created_at).toLocaleDateString('en-GB')}
                              </span>
                              <span className="font-medium text-green-700">
                                فاتورة #{index + 1} - {parseFloat(String(payment.amount)).toLocaleString()} د.أ
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 justify-end text-green-600">
              <span>تفاصيل الدفعة</span>
              <Receipt className="w-5 h-5" />
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 py-4">
              {editingPayment ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-right block">المبلغ</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPaymentAmount}
                      onChange={(e) => setEditPaymentAmount(e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-right block">ملاحظات</Label>
                    <Input
                      value={editPaymentNotes}
                      onChange={(e) => setEditPaymentNotes(e.target.value)}
                      className="text-right"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 mb-1">المبلغ المسدد</p>
                    <p className="text-3xl font-bold text-green-700">{parseFloat(String(selectedPayment.amount)).toLocaleString()} د.أ</p>
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    {new Date(selectedPayment.created_at).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  
                  {selectedPayment.notes && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-muted-foreground text-right">
                        <span className="font-medium">ملاحظات:</span> {selectedPayment.notes}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">المستحق قبل السداد</p>
                      <p className="font-bold text-blue-700">{parseFloat(String(selectedPayment.amount_before_payment)).toLocaleString()} د.أ</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600 mb-1">المستحق بعد السداد</p>
                      <p className="font-bold text-green-700">{parseFloat(String(selectedPayment.amount_after_payment)).toLocaleString()} د.أ</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          <div className="flex gap-2 justify-between">
            {editingPayment ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditingPayment(false)}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={updatePayment}
                  disabled={savingPayment}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {savingPayment ? "جاري الحفظ..." : "حفظ التعديلات"}
                </Button>
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => selectedPayment && deletePayment(selectedPayment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (selectedPayment) {
                        setEditPaymentAmount(String(selectedPayment.amount))
                        setEditPaymentNotes(selectedPayment.notes || "")
                        setEditingPayment(true)
                      }
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline" onClick={() => {
                  setSelectedPayment(null)
                  setEditingPayment(false)
                }}>
                  إغلاق
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Issue Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 justify-end">
              <span>إضافة ملاحظة للشحنة</span>
              <MessageSquareWarning className="w-5 h-5 text-amber-500" />
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-right">
              رقم التتبع: {selectedShipmentForNote?.tracking_number}
            </p>
            
            <div className="space-y-3">
              {issueOptions.map((option) => (
                <div key={option.value} className="flex items-center justify-end gap-3 p-3 rounded-lg border hover:bg-gray-50">
                  <Label htmlFor={option.value} className="cursor-pointer flex-1 text-right">
                    {option.label}
                  </Label>
                  <Checkbox
                    id={option.value}
                    checked={selectedIssue === option.value}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIssue(option.value)
                      } else {
                        setSelectedIssue("")
                      }
                    }}
                  />
                </div>
              ))}
            </div>
            
            {selectedShipmentForNote?.issue_note && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 text-right">
                  الملاحظة الحالية: {selectedShipmentForNote.issue_note}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            {selectedShipmentForNote?.issue_note && (
              <Button
                variant="outline"
                className="text-red-500 border-red-200"
                onClick={() => {
                  if (selectedShipmentForNote) {
                    removeIssueNote(selectedShipmentForNote.id)
                    setNoteDialogOpen(false)
                    setSelectedShipmentForNote(null)
                    setSelectedIssue("")
                  }
                }}
              >
                إزالة الملاحظة
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setNoteDialogOpen(false)
                setSelectedShipmentForNote(null)
                setSelectedIssue("")
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={saveIssueNote}
              disabled={!selectedIssue}
              className="bg-amber-500 hover:bg-amber-600"
            >
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 justify-end">
              <span>تسديد مبلغ للمشترك</span>
              <Wallet className="w-5 h-5 text-green-600" />
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 text-right">
                المبلغ المستحق حالياً: <span className="font-bold">{calculateAmountDue().toLocaleString()} د.أ</span>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-amount" className="text-right block">المبلغ المراد تسديده</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="أدخل المبلغ"
                className="text-right"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-notes" className="text-right block">ملاحظات (اختياري)</Label>
              <Input
                id="payment-notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="أضف ملاحظة..."
                className="text-right"
              />
            </div>
            
            {paymentAmount && parseFloat(paymentAmount) > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 text-right">
                  المبلغ المستحق بعد السداد: <span className="font-bold">{(calculateAmountDue() - parseFloat(paymentAmount)).toLocaleString()} د.أ</span>
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setPaymentDialogOpen(false)
                setPaymentAmount("")
                setPaymentNotes("")
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={savePayment}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || savingPayment}
              className="bg-green-600 hover:bg-green-700"
            >
              {savingPayment ? "جاري الحفظ..." : "تسديد"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
