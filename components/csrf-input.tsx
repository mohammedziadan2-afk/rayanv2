"use client"

import { useEffect, useState } from "react"

interface CSRFInputProps {
  onTokenReady?: (token: string) => void
}

export function CSRFInput({ onTokenReady }: CSRFInputProps) {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch("/api/csrf-token", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setToken(data.token)
          setError(null)
          if (onTokenReady && data.token) {
            onTokenReady(data.token)
          }
        } else {
          console.error("[v0] Failed to fetch CSRF token:", response.status)
          setError("فشل في الحصول على رمز الأمان")
          const fallbackToken = "fallback-" + Math.random().toString(36).substring(2)
          setToken(fallbackToken)
          if (onTokenReady) {
            onTokenReady(fallbackToken)
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching CSRF token:", error)
        setError("خطأ في الاتصال")
        const fallbackToken = "fallback-" + Math.random().toString(36).substring(2)
        setToken(fallbackToken)
        if (onTokenReady) {
          onTokenReady(fallbackToken)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchToken()
  }, [onTokenReady])

  if (loading) {
    return (
      <>
        <input type="hidden" name="csrf_token" value="" />
        <input type="hidden" name="_csrf_loading" value="true" />
      </>
    )
  }

  return (
    <>
      <input type="hidden" name="csrf_token" value={token} />
      {error && <input type="hidden" name="_csrf_error" value={error} />}
    </>
  )
}
