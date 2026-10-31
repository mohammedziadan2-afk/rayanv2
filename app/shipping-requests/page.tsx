"use client"

import { useEffect, useState } from "react"
import { type ShippingRequest, getAllShippingRequests, markRequestsAsRead } from "@/app/actions/shipping-requests"
import { ShippingRequestsContent } from "@/components/shipping-requests-content"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, Package } from "lucide-react"
import { AdminFooter } from "@/components/admin-footer"

export default function ShippingRequestsPage() {
  const [requests, setRequests] = useState<ShippingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    loadRequests()
    markRequestsAsRead()
    loadUnreadCounts()
    const interval = setInterval(loadUnreadCounts, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await getAllShippingRequests()
      setRequests(data)
    } catch (error) {
      console.error("[v0] Error loading requests:", error)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCounts = async () => {
    try {
      const { getUnreadCounts } = await import("@/app/actions/messages")
      const counts = await getUnreadCounts("admin")
      setUnreadCounts(counts)
    } catch (error) {
      console.error("[v0] Error loading unread counts:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl gradient-primary shadow-glow">
                <FileText className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">طلبات الشحن</h1>
                <p className="text-sm text-muted-foreground mt-1">عرض وإدارة جميع طلبات الشحن ({requests.length})</p>
              </div>
            </div>
            <Link href="/request-shipping">
              <Button
                variant="outline"
                className="gap-2 glass-effect hover:shadow-glow transition-all duration-300 bg-transparent"
              >
                <Package className="w-5 h-5" />
                <span className="hidden sm:inline">طلب شحن جديد</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ShippingRequestsContent requests={requests} onUpdate={loadRequests} unreadCounts={unreadCounts} />
        )}
      </main>

      <AdminFooter backUrl="/admin" backLabel="الإدارة" />
    </div>
  )
}
