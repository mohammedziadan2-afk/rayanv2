export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-700 text-white p-6">
        <div className="container mx-auto">
          <div className="h-10 w-20 bg-white/20 rounded animate-pulse mb-4" />
          <div className="h-8 w-64 bg-white/20 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-white/20 rounded animate-pulse" />
        </div>
      </div>
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-4">
              <div className="h-8 w-8 mx-auto bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-20 mx-auto bg-muted rounded animate-pulse mb-2" />
              <div className="h-6 w-16 mx-auto bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Table Skeleton */}
        <div className="bg-card rounded-lg border p-4">
          <div className="h-6 w-40 bg-muted rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
