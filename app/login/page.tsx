"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { Lock, User, Info } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = login(username, password)
      if (success) {
        toast.success("تم تسجيل الدخول بنجاح")
        router.push("/")
      } else {
        toast.error("اسم المستخدم أو كلمة السر غير صحيحة")
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء تسجيل الدخول")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 p-4">
      <Card className="w-full max-w-md glass-effect shadow-glow border-primary/10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto relative w-24 h-24 rounded-2xl overflow-hidden shadow-glow ring-2 ring-primary/20">
            <Image src="/images/logo.jpg" alt="شعار الريان" fill className="object-contain p-2" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-l from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              مرحباً بك
            </CardTitle>
            <CardDescription className="text-base mt-2">سجل دخولك للوصول إلى نظام إدارة الشحن</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-primary/5 border-primary/30">
            <Info className="h-5 w-5 text-primary" />
            <AlertDescription className="text-sm font-medium">
              <div className="space-y-1 mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">اسم المستخدم:</span>
                  <span className="font-bold text-primary">admin</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">كلمة السر:</span>
                  <span className="font-bold text-primary">admin123</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                اسم المستخدم
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="glass-effect"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                كلمة السر
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة السر"
                className="glass-effect"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full gradient-primary shadow-glow hover:shadow-glow-lg transition-all duration-300"
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
