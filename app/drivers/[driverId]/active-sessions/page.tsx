"use client"

import { useParams } from "next/navigation"
import { ActiveSessionsClient } from "@/components/active-sessions-client"

export default function ActiveSessionsPage() {
  const params = useParams()
  const driverId = params.driverId as string

  return <ActiveSessionsClient driverId={driverId} />
}
