"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Phone, ChevronLeft, Truck } from "lucide-react"
import Link from "next/link"
import { DriverShipmentDialog } from "@/components/driver-shipment-dialog"
import { useRouter } from "next/navigation"

interface CurrentShipmentsClientProps {
  tasksByDriver: Record<string, any[]>
  driverInfo: Record<string, { name: string; phone: string }>
  totalTasks: number
}

export function CurrentShipmentsClient({ tasksByDriver, driverInfo, totalTasks }: CurrentShipmentsClientProps) {
  const router = useRouter()
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const handleTasksUpdated = () => {
      router.refresh()
    }

    window.addEventListener("driverTasksUpdated", handleTasksUpdated)
    return () => {
      window.removeEventListener("driverTasksUpdated", handleTasksUpdated)
    }
  }, [router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "from-amber-400 to-orange-500"
      case "in_transit":
        return "from-blue-400 to-blue-600"
      case "delivered":
        return "from-green-400 to-green-600"
      case "rejected":
      case "refused":
        return "from-red-400 to-red-600"
      case "postponed":
        return "from-purple-400 to-purple-600"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { text: "قيد الانتظار", variant: "secondary" as const, className: "bg-amber-100 text-amber-800" }
      case "in_transit":
        return { text: "في الطريق", variant: "secondary" as const, className: "bg-blue-100 text-blue-800" }
      case "delivered":
        return { text: "تم التسليم", variant: "secondary" as const, className: "bg-green-100 text-green-800" }
      case "rejected":
        return { text: "مرفوض", variant: "destructive" as const, className: "" }
      case "refused":
        return { text: "مرتجع", variant: "destructive" as const, className: "" }
      case "postponed":
        return { text: "مؤجل", variant: "secondary" as const, className: "bg-purple-100 text-purple-800" }
      default:
        return { text: status, variant: "outline" as const, className: "" }
    }
  }

  const handleTaskClick = (task: any) => {
    setSelectedTask(task)
    setDialogOpen(true)
  }

  const handleUpdate = () => {
    router.refresh()
  }

  const driverIds = Object.keys(tasksByDriver)

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <Package className="w-8 h-8" />
          <h1 className="text-2xl font-bold">الشحنات الحالية</h1>
        </div>
        <p className="text-center text-cyan-100 mt-2">جميع الشحنات النشطة لدى السائقين</p>
        <div className="flex justify-center mt-3">
          <Badge className="bg-white/20 text-white text-lg px-4 py-1">{totalTasks} شحنة</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{totalTasks}</div>
              <div className="text-sm text-muted-foreground">إجمالي الشحنات</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{driverIds.length}</div>
              <div className="text-sm text-muted-foreground">عدد السائقين</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drivers and their shipments */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {driverIds.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg text-muted-foreground">لا توجد شحنات حالية لدى السائقين</p>
            </CardContent>
          </Card>
        ) : (
          driverIds.map((driverId) => {
            const tasks = tasksByDriver[driverId]
            const driver = driverInfo[driverId]

            return (
              <div key={driverId} className="space-y-3">
                {/* Driver Header */}
                <div className="flex items-center gap-3 bg-gradient-to-r from-slate-100 to-slate-50 p-3 rounded-xl">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-gray-800">{driver.name}</h2>
                    {driver.phone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span dir="ltr">{driver.phone}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {tasks.length} شحنة
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {tasks.map((task) => {
                    const collectionMethod = task.shipments?.collection_method || "driver"
                    const driverCollects = collectionMethod === "driver"
                    const shipmentAmount = Number(task.shipments?.amount || 0)
                    const displayAmount = driverCollects ? shipmentAmount : 0
                    const statusBadge = getStatusBadge(task.status)

                    return (
                      <Card
                        key={task.id}
                        className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 border-2 hover:border-blue-500"
                        onClick={() => handleTaskClick(task)}
                      >
                        <CardContent className="p-4 text-center space-y-2">
                          <div
                            className={`w-14 h-14 mx-auto bg-gradient-to-br ${getStatusColor(task.status)} rounded-2xl flex items-center justify-center shadow-lg`}
                          >
                            <Package className="w-7 h-7 text-white" />
                          </div>

                          <p className="font-bold text-sm leading-tight whitespace-pre-line break-words">
                            {task.shipments?.description || "شحنة بدون وصف"}
                          </p>

                          <p className="text-xs text-muted-foreground break-words leading-snug line-clamp-2">
                            {task.shipments?.receiver_address || "لا يوجد عنوان"}
                          </p>

                          {!driverCollects ? (
                            <>
                              <div className="text-base font-bold text-gray-700 bg-gray-100 px-2 py-1.5 rounded">
                                0 دينار
                              </div>
                              <div className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium">
                                لا يوجد عليها تحصيل
                              </div>
                            </>
                          ) : (
                            <>
                              {displayAmount > 0 ? (
                                <>
                                  <div className="text-base font-bold text-purple-900 bg-purple-100 px-2 py-1.5 rounded">
                                    {displayAmount} دينار
                                  </div>
                                  <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">
                                    يحصلها السائق
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded font-medium">
                                  لم يتم تحديد المبلغ
                                </div>
                              )}
                            </>
                          )}

                          {task.delivery_type === "not_included" && task.driver_fee && (
                            <div className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-medium">
                              غير شامل التوصيل - {task.driver_fee} د.أ
                            </div>
                          )}

                          <Badge variant={statusBadge.variant} className={`text-xs ${statusBadge.className}`}>
                            {statusBadge.text}
                          </Badge>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {selectedTask && (
        <DriverShipmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          task={selectedTask}
          sessionId={selectedTask.session_id}
          onUpdate={handleUpdate}
        />
      )}

      {/* Fixed footer with back button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 z-40">
        <div className="container mx-auto">
          <Link href="/admin">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-bold">
              <ChevronLeft className="w-5 h-5 ml-2" />
              العودة للإدارة
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
