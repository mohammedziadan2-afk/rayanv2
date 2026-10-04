import { Suspense } from "react"
import { InvoicesContent } from "@/components/invoices-content"
import { getShipments } from "@/app/actions/shipments"
import { AdminFooter } from "@/components/admin-footer"

export const dynamic = "force-dynamic"

export default async function InvoicesPage() {
  const result = await getShipments()
  const shipments = result.success ? result.data : []

  return (
    <div className="pb-24">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>جاري التحميل...</span>
            </div>
          </div>
        }
      >
        <InvoicesContent initialShipments={shipments} />
      </Suspense>
      <AdminFooter backUrl="/finance" backLabel="المالية" />
    </div>
  )
}
