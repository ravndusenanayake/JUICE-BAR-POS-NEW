"use client"
import { toast } from 'sonner';

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Save, AlertCircle, AlertTriangle } from "lucide-react"

export default function SystemSettingsPage() {
  const { role } = useAuth()
  const [maxBranches, setMaxBranches] = useState("3")
  const [maxUsers, setMaxUsers] = useState("10")
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (role === "Super Admin") {
      fetchSettings()
    }
  }, [role])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setMaxBranches(data.maxBranches?.toString() || "3")
        setMaxUsers(data.maxUsers?.toString() || "10")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (parseInt(maxBranches) < 1 || parseInt(maxUsers) < 1) {
      toast.error("Limits must be at least 1")
      return
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxBranches: parseInt(maxBranches),
          maxUsers: parseInt(maxUsers)
        })
      })

      if (res.ok) {
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 3000)
      } else {
        toast.error("Failed to save settings")
      }
    } catch (e) {
      console.error(e)
      toast.error("An error occurred while saving")
    }
  }

  if (role !== "Super Admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500">Only Super Admins can access System & Licensing configurations.</p>
      </div>
    )
  }

  if (isLoading) {
    return <div className="p-6">Loading system settings...</div>
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-gray-500" />
            System Settings & Limits
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure SaaS licensing limits for the tenant. Restricted to Super Admin only.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Super Admin Access Only:</strong> The limits configured here directly affect the Juice Bar Owner (Admin). 
          They will not be able to create branches or users beyond these limits.
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-800 border-b pb-2">Tenant Licensing Limits</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="grid gap-2">
                <Label htmlFor="maxBranches" className="text-sm font-medium text-gray-700">Maximum Branches Allowed</Label>
                <div className="relative flex items-center">
                  <Input 
                    id="maxBranches" 
                    type="number" 
                    min="1"
                    value={maxBranches} 
                    onChange={(e) => setMaxBranches(e.target.value)} 
                    required 
                    className="border-gray-300 font-semibold pr-20" 
                  />
                  <div className="absolute right-8 text-xs text-gray-400 pointer-events-none">Branches</div>
                </div>
                <p className="text-xs text-gray-500">The total number of branches the Admin can create.</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxUsers" className="text-sm font-medium text-gray-700">Maximum Users Allowed</Label>
                <div className="relative flex items-center">
                  <Input 
                    id="maxUsers" 
                    type="number" 
                    min="1"
                    value={maxUsers} 
                    onChange={(e) => setMaxUsers(e.target.value)} 
                    required 
                    className="border-gray-300 font-semibold pr-16" 
                  />
                  <div className="absolute right-8 text-xs text-gray-400 pointer-events-none">Users</div>
                </div>
                <p className="text-xs text-gray-500">The total number of staff accounts the Admin can create.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex items-center justify-between">
            <div>
              {isSaved && <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded">Settings saved successfully!</span>}
            </div>
            <Button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white min-w-[120px]">
              <Save className="mr-2 h-4 w-4" /> Save Settings
            </Button>
          </div>
          
        </form>
      </div>
    </div>
  )
}
