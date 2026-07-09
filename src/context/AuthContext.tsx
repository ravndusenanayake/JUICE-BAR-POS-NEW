"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { logAudit } from "@/lib/auditLogger"

type Role = "Super Admin" | "Admin" | "Branch Manager" | "Store Keeper" | "Cashier" | null

interface User {
  id: string
  name: string
  email: string
  role: Role
  branch: string
}

interface AuthContextType {
  user: User | null
  role: Role
  login: (selectedRole: Role, branch?: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem("authUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (selectedRole: Role, branch: string = "Colombo 07") => {
    if (!selectedRole) return

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole })
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      
      const realUser: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        branch: (data.user.role === "Super Admin" || data.user.role === "Admin") ? "All Branches" : branch
      }

      setUser(realUser)
      localStorage.setItem("authUser", JSON.stringify(realUser))
      localStorage.setItem("token", data.token)
      
      logAudit(realUser.name, realUser.branch, "Logged into the system successfully.", "Login")
      
      // Set cookie for middleware access (expires in 1 day)
      document.cookie = `userRole=${selectedRole}; path=/; max-age=86400; SameSite=Lax`

      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      alert("Failed to connect to backend for login.")
    }
  }

  const logout = () => {
    if (user) {
      logAudit(user.name, user.branch, "Logged out of the system.", "Logout")
    }
    setUser(null)
    localStorage.removeItem("authUser")
    
    // Remove cookie
    document.cookie = `userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`
    
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
