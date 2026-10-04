import { Suspense } from "react"
import { notFound } from "next/navigation"
import WarehouseDetailsClient from "@/components/warehouse-details-client"

export default function WarehousePage({
  params,
}: {
  params: { warehouseName: string }
}) {
  const decodedName = decodeURIComponent(params.warehouseName)

  if (!decodedName) {
    notFound()
  }

  return (
    <Suspense fallback={<div className="p-6">جاري التحميل...</div>}>
      <WarehouseDetailsClient warehouseName={decodedName} />
    </Suspense>
  )
}
