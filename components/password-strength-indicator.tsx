"use client"

import { useMemo } from "react"
import { Progress } from "@/components/ui/progress"
import { validatePassword } from "@/lib/password-policy"

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) {
      return { score: 0, label: "", color: "" }
    }

    const validation = validatePassword(password)
    const score = Math.max(0, 100 - validation.errors.length * 25)

    let label = ""
    let color = ""

    if (score >= 100) {
      label = "قوية جداً"
      color = "bg-green-500"
    } else if (score >= 75) {
      label = "قوية"
      color = "bg-green-400"
    } else if (score >= 50) {
      label = "متوسطة"
      color = "bg-yellow-500"
    } else if (score >= 25) {
      label = "ضعيفة"
      color = "bg-orange-500"
    } else {
      label = "ضعيفة جداً"
      color = "bg-red-500"
    }

    return { score, label, color, errors: validation.errors }
  }, [password])

  if (!password) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">قوة كلمة المرور:</span>
        <span className={`text-sm font-medium ${strength.color.replace("bg-", "text-")}`}>{strength.label}</span>
      </div>
      <Progress value={strength.score} className={strength.color} />
      {strength.errors.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1 mt-2">
          {strength.errors.map((error, index) => (
            <li key={index} className="flex items-start gap-1">
              <span className="text-red-500 mt-0.5">•</span>
              <span>{error}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
