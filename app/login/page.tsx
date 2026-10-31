"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { Lock, User, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { CSRFInput } from "@/components/csrf-input"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement)
      const csrfToken = formData.get("csrf_token") as string

      const result = await login(username, password, csrfToken)

      if (result === true) {
        toast.success("تم تسجيل الدخول بنجاح")
        router.push("/admin")
      } else if (typeof result === "string") {
        toast.error(result)
      } else {
        toast.error("اسم المستخدم أو كلمة السر غير صحيحة")
      }
    } catch (error) {
      console.error("[v0] Login error:", error)
      toast.error("حدث خطأ أثناء تسجيل الدخول")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="mx-auto relative w-32 h-32 rounded-2xl overflow-hidden shadow-lg">
            <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-2" />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <CSRFInput />
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" />
                اسم المستخدم
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="h-12 text-base"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-base">
                <Lock className="w-4 h-4" />
                كلمة السر
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة السر"
                  className="h-12 text-base pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base gradient-primary shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
