import { ShipmentDetails } from "@/components/shipment-details"

export default async function ShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/50 pb-24">
      <ShipmentDetails id={id} />
    </div>
  )
}
