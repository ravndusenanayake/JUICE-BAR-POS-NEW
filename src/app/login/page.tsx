"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Droplets, Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }

    setLoading(true)
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (res?.error) {
        setError("Invalid email or password.")
      } else {
        router.push("/dashboard")
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
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-orange-100 p-4 rounded-full w-20 h-20 flex items-center justify-center border-4 border-white shadow-sm">
              <Droplets className="w-10 h-10 text-orange-500" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Juice Bar POS</CardTitle>
            <CardDescription className="text-lg font-medium text-gray-600">
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 mt-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm font-medium text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 leading-none">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input 
                  type="email" 
                  placeholder="admin@juicebar.com" 
                  className="pl-10 h-12 text-base bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 leading-none">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-12 text-base bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 mt-4 pb-8">
            <Button 
              type="submit"
              className="w-full text-lg h-14 bg-orange-500 hover:bg-orange-600 text-white shadow-lg transition-transform hover:scale-[1.02] rounded-xl font-bold"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Secure Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
