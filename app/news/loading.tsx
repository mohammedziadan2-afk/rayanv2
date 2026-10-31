import { Newspaper } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center animate-pulse">
            <Newspaper className="w-8 h-8 text-orange-600" />
          </div>
          <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full border-4 border-orange-500/30 border-t-orange-500 animate-spin" />
        </div>
        <p className="text-muted-foreground text-sm">جاري تحميل الأخبار...</p>
      </div>
    </div>
  )
}
