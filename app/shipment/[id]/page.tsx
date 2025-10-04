import { ShipmentDetails } from "@/components/shipment-details"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ShipmentPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للقائمة
          </Button>
        </Link>
        <ShipmentDetails id={params.id} />
      </div>
    </div>
  )
}
