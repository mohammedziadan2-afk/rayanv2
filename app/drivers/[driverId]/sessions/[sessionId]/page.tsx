import { notFound } from "next/navigation"
import { getDriverById, getSessionById, getSessionTasks } from "@/app/actions/drivers"
import { SessionDetailPageClient } from "@/components/session-detail-page-client"

export const revalidate = 10

interface PageProps {
  params: Promise<{
    driverId: string
    sessionId: string
  }>
}

export default async function SessionDetailsPage({ params }: PageProps) {
  const { driverId, sessionId } = await params

  const [driver, session, tasks] = await Promise.all([
    getDriverById(driverId),
    getSessionById(sessionId),
    getSessionTasks(sessionId),
  ])

  if (!driver || !session) {
    notFound()
  }

  return <SessionDetailPageClient driverId={driverId} sessionId={sessionId} />
}
