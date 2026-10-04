import type React from "react"

export default function DriverViewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {/* No navigation, sidebar, or header - just the content */}
      {children}
    </div>
  )
}
