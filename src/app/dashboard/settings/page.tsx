"use client"
import { toast } from 'sonner';

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, AlertTriangle } from "lucide-react"

export default function SettingsPage() {
  const { role } = useAuth()
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Fields state
  const [storeName, setStoreName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [taxRate, setTaxRate] = useState("0")
  const [taxName, setTaxName] = useState("")
  const [packagingCharge, setPackagingCharge] = useState("0")
  const [receiptFooter, setReceiptFooter] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setStoreName(data.storeName || "")
        setAddress(data.address || "")
        setPhone(data.phone || "")
        setLogoUrl(data.logoUrl || "")
        setTaxRate(data.taxRate?.toString() || "0")
        setTaxName(data.taxName || "")
        setPackagingCharge(data.packagingCharge?.toString() || "0")
        setReceiptFooter(data.receiptFooter || "")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          address,
          phone,
          logoUrl,
          taxRate: parseFloat(taxRate) || 0,
          taxName,
          packagingCharge: parseFloat(packagingCharge) || 0,
          receiptFooter
        })
      })
      if (res.ok) {
        toast.success("Settings saved successfully!")
      } else {
        toast.error("Failed to save settings")
      }
    } catch (e) {
      console.error(e)
      toast.error("An error occurred while saving")
    } finally {
      setIsSaving(false)
    }
  }

  if (role !== "Admin" && role !== "Super Admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500">You do not have permission to view or modify business settings.</p>
      </div>
    )
  }

  if (isLoading) {
    return <div className="p-6">Loading settings...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Settings</h2>
          <p className="text-muted-foreground">Manage your store preferences, tax, and configurations.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-orange-600 hover:bg-orange-700">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 h-12 rounded-xl bg-gray-100 p-1">
          <TabsTrigger value="general" className="rounded-lg text-sm font-bold data-active:bg-white data-active:text-orange-600 data-active:shadow-sm">General Info</TabsTrigger>
          <TabsTrigger value="tax" className="rounded-lg text-sm font-bold data-active:bg-white data-active:text-orange-600 data-active:shadow-sm">Tax & Fees</TabsTrigger>
          <TabsTrigger value="receipt" className="rounded-lg text-sm font-bold data-active:bg-white data-active:text-orange-600 data-active:shadow-sm">Receipt</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card className="mt-6 border shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Update your juice bar's basic details and branding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input id="storeName" value={storeName} onChange={e => setStoreName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo Image URL</Label>
                <Input id="logoUrl" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                <p className="text-xs text-gray-500">Provide a direct URL to your business logo image.</p>
              </div>
              {logoUrl && (
                <div className="mt-2 border rounded p-2 inline-block bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Store Logo Preview" className="h-16 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tax">
          <Card className="mt-6 border shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle>Tax & Additional Fees</CardTitle>
              <CardDescription>Configure global tax rates and packaging charges applied to sales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                  <Input id="taxRate" type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} step="0.01" min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxName">Tax Name (Shown on receipt)</Label>
                  <Input id="taxName" value={taxName} onChange={e => setTaxName(e.target.value)} placeholder="e.g. VAT, Sales Tax" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packagingCharge">Default Packaging Charge (Rs.)</Label>
                  <Input id="packagingCharge" type="number" value={packagingCharge} onChange={e => setPackagingCharge(e.target.value)} step="0.01" min="0" />
                  <p className="text-xs text-gray-500">Amount automatically added to takeaways/deliveries if applicable.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="receipt">
          <Card className="mt-6 border shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle>Receipt Settings</CardTitle>
              <CardDescription>Customize messages printed on customer receipts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Message</Label>
                <textarea 
                  id="footerText" 
                  value={receiptFooter} 
                  onChange={e => setReceiptFooter(e.target.value)} 
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Thank you for your purchase!"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
