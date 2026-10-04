"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Globe } from "lucide-react"
import { useState, useEffect } from "react"

const PRESET_COUNTRIES = ["الأردن", "فلسطين"]

interface CountrySelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  size?: "default" | "sm"
}

export function CountrySelect({ value, onChange, placeholder = "اختر الدولة", className, size = "default" }: CountrySelectProps) {
  const isPreset = PRESET_COUNTRIES.includes(value)
  const [mode, setMode] = useState<"select" | "custom">(
    value && !isPreset && value !== "" ? "custom" : "select"
  )
  const [customValue, setCustomValue] = useState(!isPreset ? value : "")

  useEffect(() => {
    if (PRESET_COUNTRIES.includes(value)) {
      setMode("select")
      setCustomValue("")
    } else if (value && value !== "أخرى") {
      setMode("custom")
      setCustomValue(value)
    }
  }, [value])

  const handleSelectChange = (selected: string) => {
    if (selected === "أخرى") {
      setMode("custom")
      setCustomValue("")
      onChange("")
    } else {
      setMode("select")
      setCustomValue("")
      onChange(selected)
    }
  }

  const handleCustomChange = (text: string) => {
    setCustomValue(text)
    onChange(text)
  }

  const selectValue = isPreset ? value : (mode === "custom" ? "أخرى" : "")

  const isSmall = size === "sm"

  return (
    <div className={`space-y-2 ${className || ""}`}>
      <div className="relative">
        <Globe className={`absolute right-3 top-1/2 -translate-y-1/2 ${isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} text-muted-foreground z-10 pointer-events-none`} />
        <Select value={selectValue} onValueChange={handleSelectChange}>
          <SelectTrigger className={`pr-10 ${isSmall ? "text-sm" : ""}`}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="الأردن">الأردن</SelectItem>
            <SelectItem value="فلسطين">فلسطين</SelectItem>
            <SelectItem value="أخرى">أخرى</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {mode === "custom" && (
        <Input
          value={customValue}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="اكتب اسم الدولة"
          className={isSmall ? "text-sm" : ""}
          autoFocus
        />
      )}
    </div>
  )
}
