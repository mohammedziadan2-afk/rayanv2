"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

interface User {
  id: string
  username: string
  password: string
  role: "admin" | "user"
  createdAt: string
}

interface AuthContextType {
  currentUser: User | null
  users: User[]
  login: (username: string, password: string) => boolean
  logout: () => void
  addUser: (username: string, password: string, role: "admin" | "user") => boolean
  changePassword: (userId: string, newPassword: string) => boolean
  deleteUser: (userId: string) => boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setIsClient(true)

    // تحميل المستخدمين
    const savedUsers = localStorage.getItem("appUsers")
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers))
    } else {
      // إنشاء مستخدم admin افتراضي عند أول استخدام
      const defaultAdmin: User = {
        id: Date.now().toString(),
        username: "admin",
        password: "admin123", // كلمة سر افتراضية
        role: "admin",
        createdAt: new Date().toISOString(),
      }
      setUsers([defaultAdmin])
      localStorage.setItem("appUsers", JSON.stringify([defaultAdmin]))
    }

    // تحميل المستخدم الحالي
    const savedCurrentUser = localStorage.getItem("currentUser")
    if (savedCurrentUser) {
      setCurrentUser(JSON.parse(savedCurrentUser))
    }
  }, [])

  useEffect(() => {
    if (!isClient) return

    // السماح بالوصول لصفحة تتبع الزبائن بدون مصادقة
    if (pathname === "/customer-track") return

    // إعادة التوجيه لصفحة تسجيل الدخول إذا لم يكن المستخدم مسجل دخول
    if (!currentUser && pathname !== "/login") {
      router.push("/login")
    }
  }, [currentUser, pathname, router, isClient])

  const login = (username: string, password: string): boolean => {
    const user = users.find((u) => u.username === username && u.password === password)
    if (user) {
      setCurrentUser(user)
      localStorage.setItem("currentUser", JSON.stringify(user))
      return true
    }
    return false
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem("currentUser")
    router.push("/login")
  }

  const addUser = (username: string, password: string, role: "admin" | "user"): boolean => {
    // التحقق من عدم وجود مستخدم بنفس الاسم
    if (users.some((u) => u.username === username)) {
      return false
    }

    const newUser: User = {
      id: Date.now().toString(),
      username,
      password,
      role,
      createdAt: new Date().toISOString(),
    }

    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    localStorage.setItem("appUsers", JSON.stringify(updatedUsers))
    return true
  }

  const changePassword = (userId: string, newPassword: string): boolean => {
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
    setUsers(updatedUsers)
    localStorage.setItem("appUsers", JSON.stringify(updatedUsers))

    // تحديث المستخدم الحالي إذا كان هو من غير كلمة السر
    if (currentUser?.id === userId) {
      const updatedCurrentUser = { ...currentUser, password: newPassword }
      setCurrentUser(updatedCurrentUser)
      localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser))
    }

    return true
  }

  const deleteUser = (userId: string): boolean => {
    // منع حذف المستخدم الحالي
    if (currentUser?.id === userId) {
      return false
    }

    const updatedUsers = users.filter((u) => u.id !== userId)
    setUsers(updatedUsers)
    localStorage.setItem("appUsers", JSON.stringify(updatedUsers))
    return true
  }

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  // السماح بعرض صفحة تسجيل الدخول وصفحة تتبع الزبائن بدون مصادقة
  if (!currentUser && (pathname === "/login" || pathname === "/customer-track")) {
    return (
      <AuthContext.Provider
        value={{
          currentUser,
          users,
          login,
          logout,
          addUser,
          changePassword,
          deleteUser,
          isAuthenticated: false,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  // عدم عرض أي شيء أثناء إعادة التوجيه
  if (!currentUser) {
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        addUser,
        changePassword,
        deleteUser,
        isAuthenticated: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
