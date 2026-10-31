import { ShipmentDetails } from "@/components/shipment-details"

export default function ShipmentPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/50 pb-24">
      <ShipmentDetails id={params.id} />
    </div>
  )
}
