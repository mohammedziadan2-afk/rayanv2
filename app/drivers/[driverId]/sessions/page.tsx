"use client"

import { useParams } from "next/navigation"
import { DriverSessionsPageClient } from "@/components/driver-sessions-page-client"

export default function DriverSessionsPage() {
  const params = useParams()
  const driverId = params.driverId as string

  return <DriverSessionsPageClient driverId={driverId} />
}
