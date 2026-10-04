import { DriversPageClient } from "@/components/drivers-page-client"
import { AdminFooter } from "@/components/admin-footer"
import { Users, Clock } from "lucide-react"
import Link from "next/link"

export default function DriversPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-36">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl gradient-primary shadow-glow">
                <Users className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">إدارة السائقين</h1>
                <p className="text-sm text-muted-foreground mt-1">إدارة معلومات السائقين والمركبات</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <DriversPageClient />
      </main>

      {/* Active Sessions Button - Fixed above footer */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4">
        <div className="container mx-auto">
          <Link 
            href="/drivers/all-active-sessions"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
          >
            <Clock className="w-6 h-6" />
            <span>الجلسات الحالية</span>
          </Link>
        </div>
      </div>

      <AdminFooter backUrl="/admin" backLabel="الإدارة" previousUrl="/admin" />
    </div>
  )
}
