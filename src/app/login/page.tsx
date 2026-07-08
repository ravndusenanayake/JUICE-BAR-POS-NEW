"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Droplets, UserCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

type Role = "Super Admin" | "Admin" | "Branch Manager" | "Store Keeper" | "Cashier" | null

export default function LoginPage() {
  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = useState<Role>(null)

  const handleLogin = () => {
    if (selectedRole) {
      login(selectedRole)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-orange-400 dark:from-green-900 dark:to-orange-900 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/20 rounded-full blur-3xl mix-blend-overlay"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-black/20 rounded-full blur-3xl mix-blend-overlay"></div>
      
      <Card className="w-full max-w-md z-10 bg-white/95 backdrop-blur-md shadow-2xl border-white/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-orange-100 p-4 rounded-full w-20 h-20 flex items-center justify-center border-4 border-white shadow-sm">
            <Droplets className="w-10 h-10 text-orange-500" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Juice Bar POS</CardTitle>
          <CardDescription className="text-lg font-medium text-gray-600">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 mt-4">
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
              <UserCircle className="w-5 h-5" /> Test Mode: Select your role below
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 leading-none">
              Login As
            </label>
            <Select onValueChange={(value) => setSelectedRole(value as Role)}>
              <SelectTrigger className="w-full h-12 bg-white text-base">
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Super Admin">Super Admin (All Access + Settings)</SelectItem>
                <SelectItem value="Admin">Admin (Full Access)</SelectItem>
                <SelectItem value="Branch Manager">Branch Manager</SelectItem>
                <SelectItem value="Store Keeper">Store Keeper</SelectItem>
                <SelectItem value="Cashier">Cashier</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 mt-2 pb-8">
          <Button 
            className="w-full text-lg h-14 bg-orange-500 hover:bg-orange-600 text-white shadow-lg transition-transform hover:scale-[1.02] rounded-xl font-bold"
            disabled={!selectedRole}
            onClick={handleLogin}
          >
            Enter System
          </Button>
          <p className="text-sm text-center text-gray-500">
            Role-Based Access Control Simulation
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
