import { getDriverById, getDriverTasks, getSessionById, getDriverSessions } from "@/app/actions/drivers"
import { notFound } from "next/navigation"
import { DriverViewClient } from "@/components/driver-view-client"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: { driverId: string }
}): Promise<Metadata> {
  const driver = await getDriverById(params.driverId)

  if (!driver) {
    return {
      title: "السائق غير موجود",
    }
  }

  const imageUrl = "/delivery-truck-icon-orange.jpg"

  return {
    title: `${driver.name} - طرود`,
    description: `مهام التوصيل للسائق ${driver.name} - مؤسسة الريان واريان للخدمات اللوجستية`,
    openGraph: {
      title: `${driver.name} - طرود`,
      description: `مهام التوصيل للسائق ${driver.name}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "أيقونة توصيل",
        },
      ],
      locale: "ar_AR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${driver.name} - طرود`,
      description: `مهام التوصيل للسائق ${driver.name}`,
      images: [imageUrl],
    },
  }
}

export default async function DriverViewPage({
  params,
  searchParams,
}: {
  params: { driverId: string }
  searchParams: { sessionId?: string }
}) {
  const driver = await getDriverById(params.driverId)

  if (!driver) {
    notFound()
  }

  let session = null
  let tasks: any[] = []

  if (searchParams.sessionId) {
    session = await getSessionById(searchParams.sessionId)
    const allTasks = await getDriverTasks(params.driverId)
    tasks = allTasks.filter(
      (task: any) =>
        task.session_id && task.session_id.toString() === searchParams.sessionId && task.status !== "postponed",
    )
  } else {
    const allTasks = await getDriverTasks(params.driverId)
    tasks = allTasks.filter((task: any) => !task.session_id || task.status === "postponed")
  }

  const allSessions = await getDriverSessions(params.driverId)
  const approvedSessions = allSessions.filter((s: any) => s.is_approved === true)

  return <DriverViewClient driver={driver} initialTasks={tasks} session={session} approvedSessions={approvedSessions} />
}
