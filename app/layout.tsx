import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Cairo } from "next/font/google"
// import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "sonner"
import { AuthProvider } from "@/components/auth-provider"
import { VisitorTracker } from "@/components/visitor-tracker"
import "./globals.css"

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
})

export const metadata: Metadata = {
  title: "الريان واريان - توصيل طرود من الأردن إلى فلسطين | شحن سريع وآمن",
  description:
    "خدمة توصيل الطرود والشحنات من الأردن إلى فلسطين بأسعار منافسة وسرعة عالية. نوفر خدمات شحن موثوقة وآمنة لجميع المدن الفلسطينية مع تتبع مباشر للشحنات.",
  keywords:
    "توصيل طرود من الأردن إلى فلسطين, شحن من الأردن لفلسطين, توصيل شحنات فلسطين, خدمة شحن فلسطين, شحن سريع فلسطين, الريان للشحن, شحن آمن فلسطين, توصيل طرود الأردن, شركة شحن فلسطين",
  authors: [{ name: "مؤسسة الريان واريان للشحن" }],
  creator: "مؤسسة الريان واريان",
  publisher: "مؤسسة الريان واريان",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "الريان للشحن",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/logo.jpg", type: "image/jpeg" },
    ],
    apple: "/images/logo.jpg",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: "https://yourwebsite.com",
    title: "الريان واريان - توصيل طرود من الأردن إلى فلسطين",
    description: "خدمة توصيل الطرود والشحنات من الأردن إلى فلسطين بأسعار منافسة وسرعة عالية",
    siteName: "مؤسسة الريان واريان للشحن",
    images: [
      {
        url: "/images/logo.jpg",
        width: 1200,
        height: 630,
        alt: "الريان واريان للشحن",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "الريان واريان - توصيل طرود من الأردن إلى فلسطين",
    description: "خدمة توصيل الطرود والشحنات من الأردن إلى فلسطين بأسعار منافسة وسرعة عالية",
    images: ["/images/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "fdVFXkx2XsdH1IUmvNJaWfgz3rmalW0QIeHi3L5UZxw",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="application-name" content="الريان للشحن" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="الريان للشحن" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f4c81" />
        <link rel="apple-touch-icon" href="/images/logo.jpg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://yourwebsite.com" />
      </head>
      <body
        className={`font-sans ${cairo.variable} antialiased bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 overflow-x-hidden`}
      >
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </AuthProvider>
        <VisitorTracker />
        <Toaster position="top-center" richColors />
        {/* <Analytics /> */}
        <Script
          id="json-ld"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "مؤسسة الريان واريان للشحن",
            description: "خدمة توصيل الطرود والشحنات من الأردن إلى فلسطين",
            url: "https://yourwebsite.com",
            logo: "https://yourwebsite.com/images/logo.jpg",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "خدمة العملاء",
              areaServed: ["JO", "PS"],
              availableLanguage: ["ar"],
            },
            sameAs: [],
            address: {
              "@type": "PostalAddress",
              addressCountry: "JO",
              addressLocality: "الأردن",
            },
            areaServed: [
              { "@type": "Country", name: "فلسطين" },
              { "@type": "Country", name: "الأردن" },
            ],
            serviceType: "خدمات الشحن والتوصيل",
          })}
        </Script>
      </body>
    </html>
  )
}
