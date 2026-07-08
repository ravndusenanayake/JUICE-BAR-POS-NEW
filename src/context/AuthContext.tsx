"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

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

  const login = (selectedRole: Role, branch: string = "Colombo 07") => {
    if (!selectedRole) return

    const mockUser: User = {
      id: "USR-MOCK-001",
      name: `${selectedRole} User`,
      email: `${selectedRole.replace(/\s+/g, '').toLowerCase()}@juicebar.com`,
      role: selectedRole,
      branch: (selectedRole === "Super Admin" || selectedRole === "Admin") ? "All Branches" : branch
    }

    setUser(mockUser)
    localStorage.setItem("authUser", JSON.stringify(mockUser))
    router.push("/dashboard")
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("authUser")
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
