"use client"

import { useEffect, useState } from "react"
import { NotificationsContent } from "@/components/notifications-content"
import { getNotifications, type Notification } from "@/app/actions/notifications"
import { AdminFooter } from "@/components/admin-footer"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    setLoading(true)
    const data = await getNotifications()
    setNotifications(data)
    setLoading(false)
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  return (
    <div className="pb-24">
      <NotificationsContent notifications={notifications} loading={loading} onUpdate={loadNotifications} />
      <AdminFooter backUrl="/admin" backLabel="الإدارة" />
    </div>
  )
}
