import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="glass-effect sticky top-0 z-50 shadow-lg border-b-2 border-primary/10">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48" />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </main>
    </div>
  )
}
