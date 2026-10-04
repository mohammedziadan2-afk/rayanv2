"use client"

import { useState, useEffect } from "react"
import { DebtsContent } from "@/components/debts-content"
import { getDebts, type DebtData } from "@/app/actions/debts"
import { AdminFooter } from "@/components/admin-footer"

export default function DebtsPage() {
  const [debts, setDebts] = useState<DebtData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDebts()
  }, [])

  const loadDebts = async () => {
    setIsLoading(true)
    const result = await getDebts()
    if (result.success) {
      setDebts(result.data)
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>جاري التحميل...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <DebtsContent initialDebts={debts} />
      <AdminFooter backUrl="/finance" backLabel="المالية" />
    </div>
  )
}
