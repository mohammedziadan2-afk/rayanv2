"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  getUsers,
  loginUser,
  createUser,
  updateUserPassword,
  deleteUser,
  initializeDefaultAdmin,
  type User,
} from "@/app/actions/auth"

interface AuthContextType {
  currentUser: User | null
  users: User[]
  login: (username: string, password: string, csrfToken?: string) => Promise<boolean | string>
  logout: () => void
  addUser: (username: string, password: string, role: "admin" | "user", csrfToken?: string) => Promise<boolean>
  changePassword: (userId: string, newPassword: string, csrfToken?: string) => Promise<boolean>
  deleteUser: (userId: string, csrfToken?: string) => Promise<boolean>
  isAuthenticated: boolean
  refreshUsers: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_STORAGE_KEY = "shipping_management_session"
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours instead of 24 for better security
const SESSION_FINGERPRINT_KEY = "shipping_session_fp"

interface SessionData {
  user: Omit<User, "password">
  timestamp: number
  fingerprint: string
}

// Generate a simple browser fingerprint for session binding (optimized - no WebGL)
function generateFingerprint(): string {
  // Use only fast, non-blocking properties - skip WebGL which is slow
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown'
  ].join('|')
  
  // Simple hash
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const loadUsers = async (forceLoad = false) => {
    // Skip loading users on public pages to improve performance
    const publicPages = [
      "/",
      "/customer-track",
      "/customers",
      "/track",
      "/track-shipment",
      "/request-shipping",
      "/subscriber-login",
    ]
    const isPublicPage =
      publicPages.includes(pathname) ||
      pathname.startsWith("/track-request") ||
      pathname.startsWith("/shipment") ||
      pathname.startsWith("/driver-view") ||
      pathname.startsWith("/subscriber")

    // Don't load users on public pages unless forced
    if (isPublicPage && !forceLoad) {
      return
    }

    try {
      const usersData = await getUsers()
      if (usersData.length === 0) {
        await initializeDefaultAdmin()
        const refreshedUsers = await getUsers()
        setUsers(refreshedUsers)
      } else {
        setUsers(usersData)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      setUsers([])
    }
  }

  const saveSession = (user: User) => {
    try {
      const fingerprint = generateFingerprint()
      const sessionData: SessionData = {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          full_name: user.full_name,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        timestamp: Date.now(),
        fingerprint,
      }
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
    } catch (error) {
      console.error("Error saving session:", error)
    }
  }

  const loadSession = (): User | null => {
    try {
      const sessionDataStr = localStorage.getItem(SESSION_STORAGE_KEY)
      if (sessionDataStr) {
        const sessionData: SessionData = JSON.parse(sessionDataStr)

        // Check session timeout
        if (Date.now() - sessionData.timestamp > SESSION_TIMEOUT) {
          clearSession()
          return null
        }

        // Validate fingerprint to prevent session hijacking
        const currentFingerprint = generateFingerprint()
        if (sessionData.fingerprint && sessionData.fingerprint !== currentFingerprint) {
          clearSession()
          return null
        }

        return { ...sessionData.user, password: "" } as User
      }
    } catch (error) {
      console.error("Error loading session:", error)
    }
    return null
  }

  const clearSession = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (error) {
      console.error("Error clearing session:", error)
    }
  }

  useEffect(() => {
    setIsClient(true)

    const init = async () => {
      try {
        const savedSession = loadSession()
        if (savedSession) {
          setCurrentUser(savedSession)
        }

        await loadUsers()
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  useEffect(() => {
    if (!isClient || isLoading) return

    const publicPages = [
      "/",
      "/customer-track",
      "/customers",
      "/track",
      "/track-shipment",
      "/request-shipping",
      "/driver-view",
      "/subscriber-login",
    ]
    const isPublicPage =
      publicPages.includes(pathname) ||
      pathname.startsWith("/track-request") ||
      pathname.startsWith("/shipment") ||
      pathname.startsWith("/driver-view") ||
      pathname.startsWith("/subscriber")

    if (isPublicPage) return

    if (!currentUser && pathname !== "/login") {
      router.push("/login")
    }
  }, [currentUser, pathname, router, isClient, isLoading])

  const login = async (username: string, password: string, csrfToken?: string): Promise<boolean | string> => {
    try {
      const result = await loginUser(username, password, csrfToken)

      // Handle error responses
      if (result && typeof result === "object" && "error" in result) {
        return result.error
      }

      // Handle successful login
      if (result && "id" in result) {
        setCurrentUser(result)
        saveSession(result)
        return true
      }

      // Default error message
      return "اسم المستخدم أو كلمة السر غير صحيحة"
    } catch (error) {
      console.error("[v0] Login error:", error)
      if (error instanceof Error && error.message.includes("CSRF")) {
        return "خطأ أمني: رمز الحماية غير صحيح"
      }
      return "حدث خطأ في الاتصال بالخادم"
    }
  }

  const logout = () => {
    setCurrentUser(null)
    clearSession()

    router.replace("/")

    setTimeout(() => {
      if (window.location.pathname !== "/") {
        window.location.href = "/"
      }
    }, 100)
  }

  const addUser = async (
    username: string,
    password: string,
    role: "admin" | "user",
    csrfToken?: string,
  ): Promise<boolean> => {
    const result = await createUser(username, password, role, undefined, csrfToken)
    if (result.success) {
      await loadUsers()
      return true
    }
    return false
  }

  const changePassword = async (userId: string, newPassword: string, csrfToken?: string): Promise<boolean> => {
    const result = await updateUserPassword(userId, newPassword, csrfToken)
    if (result.success) {
      await loadUsers()

      if (currentUser?.id === userId) {
        const updatedCurrentUser = { ...currentUser }
        setCurrentUser(updatedCurrentUser)
        saveSession(updatedCurrentUser)
      }

      return true
    }
    return false
  }

  const deleteUserFunc = async (userId: string, csrfToken?: string): Promise<boolean> => {
    if (currentUser?.id === userId) {
      return false
    }

    const result = await deleteUser(userId, csrfToken)
    if (result.success) {
      await loadUsers()
      return true
    }
    return false
  }

  const refreshUsers = async () => {
    await loadUsers()
  }

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (
    !currentUser &&
    (pathname === "/login" ||
      pathname === "/customer-track" ||
      pathname === "/" ||
      pathname === "/customers" ||
      pathname === "/track" ||
      pathname === "/track-shipment" ||
      pathname === "/request-shipping" ||
      pathname === "/subscriber-login" ||
      pathname.startsWith("/track-request") ||
      pathname.startsWith("/shipment") ||
      pathname.startsWith("/driver-view") ||
      pathname.startsWith("/subscriber"))
  ) {
    return (
      <AuthContext.Provider
        value={{
          currentUser,
          users,
          login,
          logout,
          addUser,
          changePassword,
          deleteUser: deleteUserFunc,
          isAuthenticated: false,
          refreshUsers,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التوجيه...</p>
        </div>
      </div>
    )
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
        deleteUser: deleteUserFunc,
        isAuthenticated: true,
        refreshUsers,
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
