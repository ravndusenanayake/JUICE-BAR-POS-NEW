import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplets } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-orange-400 dark:from-green-900 dark:to-orange-900 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/20 rounded-full blur-3xl mix-blend-overlay"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-black/20 rounded-full blur-3xl mix-blend-overlay"></div>
      
      <Card className="w-full max-w-md z-10 glass border-white/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-primary/20 p-4 rounded-full w-20 h-20 flex items-center justify-center">
            <Droplets className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Juice Bar POS</CardTitle>
          <CardDescription className="text-lg font-medium text-foreground/70">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Email Address
            </label>
            <Input 
              type="email" 
              placeholder="admin@juicebar.com" 
              className="bg-white/50 dark:bg-black/20 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Password
              </label>
              <a href="#" className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="bg-white/50 dark:bg-black/20 border-white/10"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 mt-6">
          <Button className="w-full text-lg h-12 shadow-lg transition-transform hover:scale-[1.02]">
            Sign In
          </Button>
          <p className="text-sm text-center text-foreground/60">
            By signing in, you agree to our Terms of Service.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
