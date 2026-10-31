import { Receipt } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
            <Receipt className="w-8 h-8 text-red-600" />
          </div>
          <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full border-4 border-red-500/30 border-t-red-500 animate-spin" />
        </div>
        <p className="text-muted-foreground text-sm">جاري تحميل المصاريف...</p>
      </div>
    </div>
  )
}
