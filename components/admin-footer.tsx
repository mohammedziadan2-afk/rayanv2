"use client"

import React from "react"

import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRef } from "react"

interface AdminFooterProps {
  backUrl?: string
  backLabel?: string
  previousUrl?: string
  className?: string
}

function NavButton({ 
  href, 
  variant, 
  children 
}: { 
  href: string
  variant: "primary" | "outline"
  children: React.ReactNode 
}) {
  const navigatingRef = useRef(false)

  const navigate = () => {
    if (navigatingRef.current) return
    navigatingRef.current = true
    // Direct window.location for maximum iOS reliability
    window.location.href = href
  }

  const isPrimary = variant === "primary"

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        navigate()
      }}
      onTouchEnd={(e) => {
        e.preventDefault()
        navigate()
      }}
      className={cn(
        "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 min-w-[120px] h-12 px-4 py-2 rounded-md text-sm font-medium select-none cursor-pointer",
        "touch-manipulation active:opacity-70 transition-opacity",
        isPrimary
          ? "bg-primary text-primary-foreground"
          : "border border-input bg-background"
      )}
      style={{ 
        WebkitTapHighlightColor: "rgba(0,0,0,0.1)",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {children}
    </a>
  )
}

export function AdminFooter({ backUrl, backLabel = "العودة", previousUrl, className }: AdminFooterProps) {
  const prevHref = previousUrl || backUrl || "/admin"
  const mainHref = backUrl || "/admin"

  return (
    <>
      {/* Spacer to prevent content from hiding behind fixed footer */}
      <div className="h-20" />
      <footer
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-primary/10 shadow-lg",
          className,
        )}
        style={{ 
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
        }}
      >
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <NavButton href={prevHref} variant="outline">
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </NavButton>

            <NavButton href={mainHref} variant="primary">
              <ArrowLeft className="w-4 h-4" />
              <span>{backLabel}</span>
            </NavButton>
          </div>
        </div>
      </footer>
    </>
  )
}
