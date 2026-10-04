"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Eye, Trash2, Search, ChevronDown, ChevronUp, Edit, FileText, Banknote, Globe, Tag, Loader2, AlertTriangle, Truck } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CountrySelect } from "@/components/country-select" // Import CountrySelect component
import {
  getShipments,
  deleteShipment as deleteShipmentAction,
  updateShipmentStatus as updateStatusAction,
  updateShipment as updateShipmentAction,
} from "@/app/actions/shipments"

interface ShipmentItem {
  id: string
  trackingNumber: string
  senderName: string
  senderPhone: string
  senderAddress: string
  senderCountry: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  receiverCountry: string
  description: string
  totalAmount: number
  deposit: number
  amount: number
  weight: number
  receivedDate: string
  status: string
  paymentStatus: string
  createdAt: string
  location?: {
    x: number
    y: number
    label?: string
  }
  deletedAt?: string
  notes?: string
  collectionMethod?: string
  isInDriverSession?: boolean
  driverName?: string
}

interface ShipmentListProps {
  initialShipments?: ShipmentItem[]
}

const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: "قيد الانتظار", color: "text-yellow-700", bgColor: "bg-yellow-100 border-yellow-300" },
    processing: { label: "قيد المعالجة", color: "text-blue-700", bgColor: "bg-blue-100 border-blue-300" },
    "in-transit": { label: "في الطريق", color: "text-purple-700", bgColor: "bg-purple-100 border-purple-300" },
    "out-for-delivery": { label: "خارج للتوصيل", color: "text-indigo-700", bgColor: "bg-indigo-100 border-indigo-300" },
    delivered: { label: "تم التوصيل", color: "text-green-700", bgColor: "bg-green-100 border-green-300" },
    cancelled: { label: "ملغي", color: "text-red-700", bgColor: "bg-red-100 border-red-300" },
    returned: { label: "مرتجع", color: "text-orange-700", bgColor: "bg-orange-100 border-orange-300" },
  }

  return statusMap[status] || { label: status, color: "text-gray-700", bgColor: "bg-gray-100 border-gray-300" }
}

const getShortDescription = (description: string | undefined): string => {
  if (!description) return "-"
  const words = description.trim().split(/\s+/)
  return words.slice(0, 2).join(" ")
}

const CACHE_KEY = "shipments_cache"
const CACHE_DURATION = 30000 // 30 seconds

export function ShipmentList({ initialShipments }: ShipmentListProps) {
  const [shipments, setShipments] = useState<ShipmentItem[]>(initialShipments || [])
  const [searchTerm, setSearchTerm] = useState("")
  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set())
  const [editingShipment, setEditingShipment] = useState<ShipmentItem | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const [csrfToken, setCsrfToken] = useState<string>("")

  const loadShipments = async () => {
    try {
      setIsLoading(true)
      const result = await getShipments()
      if (result.success) {
        setShipments(result.data)
      } else {
        toast({
          title: "خطأ",
          description: "فشل في تحميل الشحنات",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الشحنات",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadShipments()

    const handleUpdate = () => loadShipments()
    window.addEventListener("shipmentsUpdated", handleUpdate)

    return () => {
      window.removeEventListener("shipmentsUpdated", handleUpdate)
    }
  }, [])

  useEffect(() => {
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
  }, [])

  const deleteShipment = async (id: string) => {
    const result = await deleteShipmentAction(id, csrfToken)

    if (result.success) {
      window.dispatchEvent(new CustomEvent("shipmentsUpdated"))
      await loadShipments()
      toast({
        title: "تم النقل إلى سلة المحذوفات",
        description: result.message || "تم نقل الشحنة إلى سلة المحذوفات بنجاح",
      })
    } else {
      toast({
        title: "خطأ",
        description: result.error || "فشل في نقل الشحنة إلى سلة المحذوفات",
        variant: "destructive",
      })
    }
  }

  const updateShipmentStatus = async (id: string, newStatus: string) => {
    const result = await updateStatusAction(id, newStatus, csrfToken)

    if (result.success) {
      window.dispatchEvent(new CustomEvent("shipmentsUpdated"))
      await loadShipments()
      toast({
        title: "نجح",
        description: "تم تحديث حالة الشحنة بنجاح",
      })
    } else {
      toast({
        title: "خطأ",
        description: result.error || "فشل في تحديث الحالة",
        variant: "destructive",
      })
    }
  }

  const handleEditSubmit = useCallback(async () => {
    if (!editingShipment || isSaving) return

    setIsSaving(true)

    try {
      const totalAmount = Number(editingShipment.totalAmount) || 0
      const deposit = Number(editingShipment.deposit) || 0
      const remainingAmount = totalAmount - deposit

      const updateData = {
        senderName: editingShipment.senderName,
        senderPhone: editingShipment.senderPhone,
        senderAddress: editingShipment.senderAddress,
        senderCountry: editingShipment.senderCountry,
        receiverName: editingShipment.receiverName,
        receiverPhone: editingShipment.receiverPhone,
        receiverAddress: editingShipment.receiverAddress,
        receiverCountry: editingShipment.receiverCountry,
        description: editingShipment.description,
        totalAmount: totalAmount,
        deposit: deposit,
        amount: remainingAmount,
        weight: editingShipment.weight,
        receivedDate: editingShipment.receivedDate,
        status: editingShipment.status,
        paymentStatus: editingShipment.paymentStatus,
        notes: editingShipment.notes,
        collectionMethod: editingShipment.collectionMethod,
      }

      const result = await updateShipmentAction(editingShipment.id, updateData, csrfToken)

      if (result.success) {
        // Update local state immediately for fast feedback
        setShipments(prev => prev.map(s => 
          s.id === editingShipment.id 
            ? { ...s, ...updateData }
            : s
        ))
        
        setIsEditDialogOpen(false)
        setEditingShipment(null)
        
        toast({
          title: "نجح",
          description: "تم تحديث الشحنة بنجاح",
        })

        // Refresh data in background
        window.dispatchEvent(new CustomEvent("shipmentsUpdated"))
      } else {
        toast({
          title: "خطأ",
          description: result.error || "فشل في تحديث الشحنة",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving shipment:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحفظ",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [editingShipment, isSaving, csrfToken, toast])

  const printLabel = async (shipment: ShipmentItem) => {
    const canvas = document.createElement("canvas")
    // Phomemo label size ~50mm x 40mm at 8px/mm = 400x320
    const W = 400
    const H = 320
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // White background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, W, H)

    // Border
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, W - 2, H - 2)

    // Tracking number - large and bold at top
    ctx.fillStyle = "#000000"
    ctx.font = "bold 32px -apple-system, Arial, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(shipment.trackingNumber || "", W / 2, 45)

    // Divider line
    ctx.beginPath()
    ctx.moveTo(15, 62)
    ctx.lineTo(W - 15, 62)
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Receiver city/address
    ctx.font = "bold 52px -apple-system, Arial, sans-serif"
    ctx.textAlign = "center"
    ctx.fillStyle = "#000000"
    const city = shipment.receiverAddress || ""
    const maxChars = 30
    const displayCity = city.length > maxChars ? city.substring(0, maxChars) + "..." : city
    ctx.fillText(displayCity, W / 2, 105)

    // Phone number
    ctx.font = "bold 26px -apple-system, Arial, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(shipment.receiverPhone || "", W / 2, 150)

    // Divider line
    ctx.beginPath()
    ctx.moveTo(15, 170)
    ctx.lineTo(W - 15, 170)
    ctx.lineWidth = 0.5
    ctx.strokeStyle = "#999"
    ctx.stroke()

    // Description - truncated to 5 words
    const desc = shipment.description || ""
    const words = desc.split(/\s+/).filter(Boolean)
    const shortDesc = words.length > 5 ? words.slice(0, 5).join(" ") + "..." : words.join(" ")
    if (shortDesc) {
      ctx.font = "22px -apple-system, Arial, sans-serif"
      ctx.fillStyle = "#333333"
      ctx.textAlign = "center"
      ctx.fillText(shortDesc, W / 2, 210)
    }

    // Convert canvas to blob and share
    canvas.toBlob(async (blob) => {
      if (!blob) return

      const file = new File([blob], `label-${shipment.trackingNumber}.png`, { type: "image/png" })

      // Try Web Share API first (works on iOS Safari)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: `ليبل ${shipment.trackingNumber}`,
            files: [file],
          })
          return
        } catch {
          // User cancelled or share failed - fall through to download
        }
      }

      // Fallback: download the image
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `label-${shipment.trackingNumber}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, "image/png")
  }

  const openEditDialog = (shipment: ShipmentItem) => {
    setEditingShipment({ ...shipment })
    setIsEditDialogOpen(true)
  }

  const toggleShipmentExpansion = (shipmentId: string) => {
    setExpandedShipments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(shipmentId)) {
        newSet.delete(shipmentId)
      } else {
        newSet.add(shipmentId)
      }
      return newSet
    })
  }

  const filteredShipments = useMemo(() => {
    const term = searchTerm.toLowerCase()
    const filtered = shipments.filter(
      (shipment) =>
        shipment.senderName.toLowerCase().includes(term) ||
        shipment.receiverName.toLowerCase().includes(term) ||
        shipment.trackingNumber.toLowerCase().includes(term) ||
        (shipment.description || "").toLowerCase().includes(term) ||
        (shipment.senderAddress || "").toLowerCase().includes(term) ||
        String(shipment.id).includes(searchTerm),
    )

    // Sort: pending first, then by createdAt descending
    return filtered.sort((a, b) => {
      // Pending shipments come first
      if (a.status === "pending" && b.status !== "pending") return -1
      if (a.status !== "pending" && b.status === "pending") return 1
      // Then sort by createdAt descending
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [shipments, searchTerm])

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader
          className="bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors p-3 sm:p-6"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <div>
                <CardTitle className="text-base sm:text-lg">قائمة الشحنات</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  عرض وإدارة جميع الشحنات ({filteredShipments.length})
                </CardDescription>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="mb-3 sm:mb-4 relative">
              <Search className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن شحنة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8 sm:pr-10 text-sm"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm sm:text-base text-muted-foreground">جاري التحميل...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredShipments.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد شحنات"}
                    </p>
                  </div>
                ) : (
                  <>
                    {filteredShipments.map((shipment) => {
                      const statusInfo = getStatusInfo(shipment.status)
                      const isExpanded = expandedShipments.has(shipment.id)

                      return (
                        <div
                          key={shipment.id}
                          className="rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between gap-2 p-3 sm:p-4">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleShipmentExpansion(shipment.id)}
                                className="h-8 w-8 p-0 shrink-0"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>

                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
                                <span className="text-[10px] sm:text-xs font-mono text-primary-foreground bg-primary px-2 py-1 rounded w-fit">
                                  {shipment.trackingNumber}
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                  {shipment.senderName} → {shipment.receiverName}
                                </span>
<span
                                                  className={`text-[10px] sm:text-xs font-semibold px-2 py-1 rounded border ${statusInfo.bgColor} ${statusInfo.color} w-fit`}
                                                >
                                                  {statusInfo.label}
                                                </span>
                                                {shipment.isInDriverSession && shipment.status !== "delivered" && (
                                                  <span
                                                    className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded border bg-orange-100 border-orange-300 text-orange-700 w-fit"
                                                    title={shipment.driverName ? `مع السائق: ${shipment.driverName}` : "مع السائق"}
                                                  >
                                                    <Truck className="w-3 h-3" />
                                                    {shipment.driverName ? `مع ${shipment.driverName}` : "مع السائق"}
                                                  </span>
                                                )}
                                                {shipment.description && (
                                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[200px]">
                                    {shipment.description}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-1.5 shrink-0">
                              <Link href={`/shipment/${shipment.id}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title="عرض التفاصيل"
                                  className="h-8 w-8 p-0 bg-transparent"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                              <Link href={`/invoices/${shipment.id}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title="فاتورة عربي"
                                  className="h-8 w-8 p-0 bg-transparent"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                              <Link href={`/invoices/${shipment.id}/en`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title="فاتورة إنجليزي"
                                  className="h-8 w-8 p-0 bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                                >
                                  <Globe className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="outline"
                                title="طباعة ليبل"
                                className="h-8 w-8 p-0 bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100"
                                onClick={() => printLabel(shipment)}
                              >
                                <Tag className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                title="تعديل الشحنة"
                                className="h-8 w-8 p-0 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                                onClick={() => openEditDialog(shipment)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-border p-3 sm:p-4 space-y-3 animate-in slide-in-from-top-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">المبلغ الإجمالي</span>
                                  <p className="text-sm font-semibold">{Number(shipment.totalAmount || 0).toFixed(2)} د.أ</p>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">حالة الدفع</span>
                                  <p className="text-sm font-semibold">
                                    {shipment.paymentStatus === "paid" ? "مدفوع" : "غير مدفوع"}
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">الحالة</span>
                                  <Select
                                    value={shipment.status}
                                    onValueChange={(value) => updateShipmentStatus(shipment.id, value)}
                                  >
                                    <SelectTrigger className="text-xs h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                                      <SelectItem value="processing">قيد المعالجة</SelectItem>
                                      <SelectItem value="in-transit">في الطريق</SelectItem>
                                      <SelectItem value="out-for-delivery">خارج للتوصيل</SelectItem>
                                      <SelectItem value="delivered">تم التوصيل</SelectItem>
                                      <SelectItem value="cancelled">ملغي</SelectItem>
                                      <SelectItem value="returned">مرتجع</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">المرسل</span>
                                  <p className="text-sm font-semibold">{shipment.senderName}</p>
                                  <p className="text-xs text-muted-foreground">{shipment.senderPhone}</p>
                                  <p className="text-xs text-muted-foreground">{shipment.senderCountry}</p>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">المستلم</span>
                                  <p className="text-sm font-semibold">{shipment.receiverName}</p>
                                  <p className="text-xs text-muted-foreground">{shipment.receiverPhone}</p>
                                  <p className="text-xs text-muted-foreground">{shipment.receiverCountry}</p>
                                </div>
                              </div>

                              {shipment.description && (
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">الوصف</span>
                                  <p className="text-sm">{shipment.description}</p>
                                </div>
                              )}

                              {shipment.notes && (
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">ملاحظات</span>
                                  <p className="text-sm">{shipment.notes}</p>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(shipment)}
                                  className="text-xs"
                                >
                                  <Edit className="w-3.5 h-3.5 ml-1" />
                                  تعديل
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive" className="text-xs">
                                      <Trash2 className="w-3.5 h-3.5 ml-1" />
                                      حذف
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-base sm:text-lg">
                                        نقل إلى سلة المحذوفات
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-xs sm:text-sm">
                                        سيتم نقل هذه الشحنة إلى سلة المحذوفات. يمكنك استرجاعها خلال 30 يوماً قبل الحذف
                                        النهائي.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="text-xs sm:text-sm">إلغاء</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteShipment(shipment.id)}
                                        className="text-xs sm:text-sm"
                                      >
                                        نقل إلى سلة المحذوفات
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">تعديل الشحنة</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">قم بتعديل تفاصيل الشحنة</DialogDescription>
          </DialogHeader>

          {editingShipment && (
            <div className="space-y-3 sm:space-y-4">
              {/* Warning if shipment is in active driver session */}
              {editingShipment.isInDriverSession && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">هذه الشحنة مضافة لجلسة سائق نشطة</p>
                    <p className="text-amber-700 text-xs mt-1">
                      السائق: {editingShipment.driverName || "غير معروف"} - التعديلات ستنعكس على جلسة السائق
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg bg-secondary/50">
                <h3 className="font-semibold text-xs sm:text-sm">معلومات المرسل</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">الاسم</Label>
                    <Input
                      value={editingShipment.senderName}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderName: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">رقم الهاتف</Label>
                    <Input
                      value={editingShipment.senderPhone}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderPhone: e.target.value })}
                      className="text-sm"
                      inputMode="tel"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">الدولة</Label>
                    <CountrySelect
                      value={editingShipment.senderCountry}
                      onChange={(val) => setEditingShipment({ ...editingShipment, senderCountry: val })}
                      placeholder="اختر دولة المرسل"
                      size="sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                    <Label className="text-xs sm:text-sm">العنوان</Label>
                    <Textarea
                      value={editingShipment.senderAddress || ""}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderAddress: e.target.value })}
                      className="text-sm min-h-[60px]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg bg-accent/10">
                <h3 className="font-semibold text-xs sm:text-sm">معلومات المستقبل</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">الاسم</Label>
                    <Input
                      value={editingShipment.receiverName}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverName: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">رقم الهاتف</Label>
                    <Input
                      value={editingShipment.receiverPhone}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverPhone: e.target.value })}
                      className="text-sm"
                      inputMode="tel"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">الدولة</Label>
                    <CountrySelect
                      value={editingShipment.receiverCountry}
                      onChange={(val) => setEditingShipment({ ...editingShipment, receiverCountry: val })}
                      placeholder="اختر دولة المستقبل"
                      size="sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                    <Label className="text-xs sm:text-sm">العنوان</Label>
                    <Textarea
                      value={editingShipment.receiverAddress || ""}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverAddress: e.target.value })}
                      className="text-sm min-h-[60px]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">وصف الشحنة</Label>
                  <Textarea
                    value={editingShipment.description || ""}
                    onChange={(e) => setEditingShipment({ ...editingShipment, description: e.target.value })}
                    className="text-sm min-h-[60px]"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">ملاحظات</Label>
                  <Textarea
                    value={editingShipment.notes || ""}
                    onChange={(e) => setEditingShipment({ ...editingShipment, notes: e.target.value })}
                    placeholder="أضف ملاحظات إضافية عن الشحنة..."
                    className="text-sm min-h-[80px]"
                  />
                </div>
                <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg bg-green-50 border border-green-200">
                  <h3 className="font-semibold text-xs sm:text-sm text-green-800">تفاصيل المبالغ</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm text-blue-700">المبلغ الكلي للشحنة (د.أ) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      value={editingShipment.totalAmount || 0}
                        onChange={(e) => {
                          const newTotal = Number.parseFloat(e.target.value) || 0
                          const deposit = Number(editingShipment.deposit) || 0
                          setEditingShipment({ 
                            ...editingShipment, 
                            totalAmount: newTotal,
                            amount: newTotal - deposit
                          })
                        }}
                        className="text-sm border-blue-300 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm text-amber-700">الدفعة (د.أ)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      value={editingShipment.deposit || 0}
                        onChange={(e) => {
                          const newDeposit = Number.parseFloat(e.target.value) || 0
                          const totalAmount = Number(editingShipment.totalAmount) || 0
                          setEditingShipment({ 
                            ...editingShipment, 
                            deposit: newDeposit,
                            amount: totalAmount - newDeposit
                          })
                        }}
                        className="text-sm border-amber-300 focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className="text-xs sm:text-sm text-green-700">باقي قيمة الشحن (د.أ)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={((Number(editingShipment.totalAmount) || 0) - (Number(editingShipment.deposit) || 0)).toFixed(2)}
                        readOnly
                        className="text-sm bg-green-100 border-green-300 font-semibold text-green-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">الوزن (كجم)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={editingShipment.weight}
                      onChange={(e) =>
                        setEditingShipment({ ...editingShipment, weight: Number.parseFloat(e.target.value) })
                      }
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">تاريخ الاستلام</Label>
                    <Input
                      type="date"
                      value={editingShipment.receivedDate}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receivedDate: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">الحالة</Label>
                    <Select
                      value={editingShipment.status}
                      onValueChange={(value) => setEditingShipment({ ...editingShipment, status: value })}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                        <SelectItem value="processing">قيد المعالجة</SelectItem>
                        <SelectItem value="in-transit">في الطريق</SelectItem>
                        <SelectItem value="out-for-delivery">خارج للتوصيل</SelectItem>
                        <SelectItem value="delivered">تم التوصيل</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                        <SelectItem value="returned">مرتجع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 col-span-2">
                    <Label className="text-xs sm:text-sm">حالة الدفع</Label>
                    <Select
                      value={editingShipment.paymentStatus}
                      onValueChange={(value) => setEditingShipment({ ...editingShipment, paymentStatus: value })}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">مدفوع</SelectItem>
                        <SelectItem value="unpaid">غير مدفوع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 col-span-2">
                    <Label className="text-xs sm:text-sm">طريقة التحصيل *</Label>
                    <div className="relative">
                      <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                      <Select
                        value={editingShipment.collectionMethod || "driver"}
                        onValueChange={(value) => setEditingShipment({ ...editingShipment, collectionMethod: value })}
                      >
                        <SelectTrigger className="text-sm pr-10">
                          <SelectValue placeholder="اختر طريقة التحصيل" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="driver">يحصلها السائق</SelectItem>
                          <SelectItem value="office">حصلت في المكتب</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 sm:pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  size="sm"
                  className="text-xs sm:text-sm"
                  disabled={isSaving}
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleEditSubmit} 
                  size="sm" 
                  className="text-xs sm:text-sm min-w-[120px]"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ التغييرات"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
