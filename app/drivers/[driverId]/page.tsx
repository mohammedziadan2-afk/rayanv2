"use client"

import { useParams } from "next/navigation"
import { DriverDetailClient } from "@/components/driver-detail-client"

export default function DriverDetailPage() {
  const params = useParams()
  const driverId = params.driverId as string

  return <DriverDetailClient driverId={driverId} />
}
