"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, Mail, Store } from "lucide-react"

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
    <div className="min-h-screen w-full flex bg-[#F8FAFC]">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10 mix-blend-overlay"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Store className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Juice Bar POS</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight mb-4 text-white">
            Advanced Point of Sale System
          </h1>
          <p className="text-slate-400 text-lg">
            Streamline your operations, manage inventory in real-time, and serve your customers faster with our enterprise-grade POS platform.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-sm text-slate-500">
          <span>&copy; {new Date().getFullYear()} Juice Bar System</span>
          <span>v2.4.1</span>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F8FAFC]">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
            <p className="text-sm text-slate-500 mt-2">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            {error && (
              <div className="bg-red-50 text-red-600 rounded-md p-3 text-sm font-medium border border-red-100 text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit"
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
