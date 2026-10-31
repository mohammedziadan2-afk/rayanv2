import { getDriverById, getDriverSessions } from "@/app/actions/drivers"
import { DriverCollectionSummaries } from "@/components/driver-collection-summaries"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ driverId: string }>
}

export default async function DriverCollectionSummariesPage({ params }: PageProps) {
  const { driverId } = await params

  const [driver, sessions] = await Promise.all([getDriverById(driverId), getDriverSessions(driverId)])

  if (!driver) {
    notFound()
  }

  // Filter only approved sessions
  const approvedSessions = sessions.filter((s: any) => s.is_approved)

  return <DriverCollectionSummaries driver={driver} sessions={approvedSessions} />
}
