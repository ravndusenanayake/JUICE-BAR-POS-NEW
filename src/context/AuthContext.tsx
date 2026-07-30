"use client"

import React, { createContext, useContext, ReactNode } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

type Role = "Super Admin" | "Admin" | "Branch Manager" | "Store Keeper" | "Cashier" | null

interface User {
  id: string
  name: string
  email: string
  role: Role
  branch: string
  permissions: string[]
}

interface AuthContextType {
  user: User | null
  role: Role
  login: () => void
  logout: () => void
  isAuthenticated: boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession()
  const router = useRouter()

  const user: User | null = session?.user ? {
    id: (session.user as any).id || '',
    name: session.user.name || '',
    email: session.user.email || '',
    role: (session.user as any).role || null,
    branch: (session.user as any).branch || '',
    permissions: (session.user as any).permissions || []
  } : null

  const login = () => {
    router.push("/login")
  }

  const logout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  const hasPermission = (permission: string) => {
    if (!user) return false;
    // Super Admin gets implicit full access
    if (user.role === "Super Admin") return true;
    return user.permissions.includes(permission);
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      role: user?.role || null, 
      login, 
      logout, 
      isAuthenticated: status === "authenticated",
      hasPermission
    }}>
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
