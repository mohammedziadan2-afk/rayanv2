import type React from "react"
import type { Metadata } from "next"
import { Cairo } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "sonner"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
})

export const metadata: Metadata = {
  title: "مؤسسة الريان واريان للشحن",
  description: "الريان للخدمات اللوجستية وحلول الشحن والتوصيل",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`font-sans ${cairo.variable} antialiased bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30`}
      >
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </AuthProvider>
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}
