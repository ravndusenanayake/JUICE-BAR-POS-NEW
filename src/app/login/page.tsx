"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplets, Lock, User } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function LoginPage() {
  const router = useRouter()
  const { refreshAuth } = useAuth()
  
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (res.ok) {
        await refreshAuth()
        router.push("/dashboard")
      } else {
        setError(data.error || "Login failed")
      }
    } catch (err) {
      setError("An unexpected error occurred.")
    } finally {
      setLoading(false)
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
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 mt-2">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-semibold text-center border border-red-100">
                {error}
              </div>
            )}
            
            <div className="space-y-2 relative">
              <label className="text-sm font-semibold text-gray-700 leading-none">
                Username (Email)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                  type="text"
                  placeholder="admin"
                  className="pl-10 h-12 bg-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-sm font-semibold text-gray-700 leading-none">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 mt-4 pb-8">
            <Button 
              type="submit"
              className="w-full text-lg h-14 bg-orange-500 hover:bg-orange-600 text-white shadow-lg transition-transform hover:scale-[1.02] rounded-xl font-bold"
              disabled={loading || !username || !password}
            >
              {loading ? "Authenticating..." : "Enter System"}
            </Button>
            <p className="text-sm text-center text-gray-500">
              Default Super Admin: <span className="font-semibold text-gray-700">admin</span> / <span className="font-semibold text-gray-700">admin123</span>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
