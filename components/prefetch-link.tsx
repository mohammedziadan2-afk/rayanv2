"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, type ReactNode, type MouseEvent } from "react"

interface PrefetchLinkProps {
  href: string
  children: ReactNode
  className?: string
  prefetch?: boolean
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

export function PrefetchLink({ 
  href, 
  children, 
  className, 
  prefetch = true,
  onClick 
}: PrefetchLinkProps) {
  const router = useRouter()

  const handleMouseEnter = useCallback(() => {
    if (prefetch) {
      router.prefetch(href)
    }
  }, [href, prefetch, router])

  return (
    <Link 
      href={href} 
      className={className}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleMouseEnter}
      onClick={onClick}
      prefetch={prefetch}
    >
      {children}
    </Link>
  )
}
