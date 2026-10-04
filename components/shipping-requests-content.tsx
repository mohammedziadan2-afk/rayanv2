"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, Eye, CheckCircle, XCircle, Clock, Trash2, Package, MapPin, User, Phone } from "lucide-react"
import type { ShippingRequest } from "@/app/actions/shipping-requests"
import { updateShippingRequestStatus, deleteShippingRequest } from "@/app/actions/shipping-requests"
import { toast } from "sonner"
import { ChatDialog } from "@/components/chat-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ShippingRequestsContentProps {
  requests: ShippingRequest[]
  onUpdate: () => void
  unreadCounts?: { [key: string]: number }
}

export function ShippingRequestsContent({ requests, onUpdate, unreadCounts = {} }: ShippingRequestsContentProps) {
  const [selectedRequest, setSelectedRequest] = useState<ShippingRequest | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: {
        label: "قيد الانتظار",
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
      approved: { label: "تمت الموافقة", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      processing: { label: "قيد المعالجة", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      rejected: { label: "مرفوض", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
      completed: { label: "مكتمل", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
    }
    const info = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
        {info.label}
      </span>
    )
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    const result = await updateShippingRequestStatus(id, status)
    if (result.success) {
      toast.success("تم تحديث الحالة بنجاح")
      onUpdate()
    } else {
      toast.error("فشل تحديث الحالة")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) return

    const result = await deleteShippingRequest(id)
    if (result.success) {
      toast.success("تم حذف الطلب بنجاح")
      onUpdate()
    } else {
      toast.error("فشل حذف الطلب")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-JO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!requests || requests.length === 0) {
    return (
      <Card className="glass-effect">
        <CardContent className="py-20">
          <div className="text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">لا توجد طلبات شحن</p>
            <p className="text-sm text-muted-foreground mt-2">عندما يقوم العملاء بطلب شحن، ستظهر هنا</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {requests.map((request) => {
          const unreadCount = unreadCounts[String(request.id)] || 0

          return (
            <Card
              key={request.id}
              className={`glass-effect transition-all hover:shadow-lg ${!request.is_read ? "ring-2 ring-primary/50" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 flex-shrink-0 text-primary" />
                      <span className="truncate">{request.customer_name}</span>
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      طلب #{request.id} • {formatDate(request.created_at)}
                    </CardDescription>
                  </div>
                  {!request.is_read && (
                    <Badge variant="default" className="bg-red-500 text-white flex-shrink-0">
                      جديد
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* معلومات العميل */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <User className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-muted-foreground min-w-0 flex-1 break-words">
                      {request.customer_name}
                    </span>
                  </div>
                  {request.customer_phone && (
                    <div className="flex items-start gap-2 text-sm">
                      <Phone className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span dir="ltr" className="font-mono text-muted-foreground">
                        {request.customer_phone}
                      </span>
                    </div>
                  )}
                </div>

                {/* العناوين */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">الاستلام</p>
                      <p className="font-medium line-clamp-2 break-words">{request.pickup_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">التسليم</p>
                      <p className="font-medium line-clamp-2 break-words">{request.delivery_address}</p>
                    </div>
                  </div>
                </div>

                {/* وصف الطرد */}
                {request.package_description && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">وصف الطرد</p>
                    <p className="text-sm line-clamp-2 break-words">{request.package_description}</p>
                  </div>
                )}

                {/* الحالة */}
                <div className="pt-2 border-t">{getStatusBadge(request.status)}</div>

                {/* الإجراءات */}
                <div className="flex flex-wrap gap-2 pt-3 border-t">
                  <Dialog open={isDetailsOpen && selectedRequest?.id === request.id} onOpenChange={setIsDetailsOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => {
                          setSelectedRequest(request)
                          setIsDetailsOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        التفاصيل
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>تفاصيل الطلب #{request.id}</DialogTitle>
                        <DialogDescription>معلومات كاملة عن طلب الشحن</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">العميل</p>
                            <p className="font-semibold">{request.customer_name}</p>
                          </div>
                          {request.customer_phone && (
                            <div>
                              <p className="text-sm text-muted-foreground">الهاتف</p>
                              <p className="font-semibold font-mono" dir="ltr">
                                {request.customer_phone}
                              </p>
                            </div>
                          )}
                          <div className="sm:col-span-2">
                            <p className="text-sm text-muted-foreground">عنوان الاستلام</p>
                            <p className="font-semibold">{request.pickup_address}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-sm text-muted-foreground">عنوان التسليم</p>
                            <p className="font-semibold">{request.delivery_address}</p>
                          </div>
                        </div>
                        {request.package_description && (
                          <div>
                            <p className="text-sm text-muted-foreground">وصف الطرد</p>
                            <p className="font-semibold">{request.package_description}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">الحالة</p>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                          <Button
                            onClick={() => {
                              handleUpdateStatus(request.id, "approved")
                              setIsDetailsOpen(false)
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            قبول
                          </Button>
                          <Button
                            onClick={() => {
                              handleUpdateStatus(request.id, "processing")
                              setIsDetailsOpen(false)
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            قيد المعالجة
                          </Button>
                          <Button
                            onClick={() => {
                              handleUpdateStatus(request.id, "rejected")
                              setIsDetailsOpen(false)
                            }}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            رفض
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request)
                      setIsChatOpen(true)
                    }}
                    className="relative"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(request.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedRequest && (
        <ChatDialog
          open={isChatOpen}
          onOpenChange={setIsChatOpen}
          requestId={String(selectedRequest.id)}
          requestNumber={String(selectedRequest.id)}
          customerName={selectedRequest.customer_name}
          isAdmin={true}
        />
      )}
    </div>
  )
}
