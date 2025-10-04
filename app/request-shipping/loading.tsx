export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
        <p className="text-lg text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  )
}
