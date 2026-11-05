import { Suspense } from "react"
import { notFound } from "next/navigation"
import WarehouseDetailsClient from "@/components/warehouse-details-client"

export default async function WarehousePage({
  params,
}: {
  params: Promise<{ warehouseName: string }>
}) {
  const { warehouseName } = await params
  const decodedName = decodeURIComponent(warehouseName)

  if (!decodedName) {
    notFound()
  }

  return (
    <Suspense fallback={<div className="p-6">جاري التحميل...</div>}>
      <WarehouseDetailsClient warehouseName={decodedName} />
    </Suspense>
  )
}
