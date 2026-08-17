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
              <div className="grid grid-cols-2 gap-6">
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
              <div className="grid grid-cols-2 gap-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card className="border shadow-sm">
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
                  <p className="text-xs text-gray-500">This message will appear at the very bottom of the printed receipt.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-gray-50/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-center">Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pt-2 pb-8">
                {/* Simulated Thermal Receipt */}
                <div className="w-[300px] bg-white p-6 shadow-md border-t-4 border-t-gray-900 border-x border-b border-gray-200 font-mono text-sm relative">
                   {/* Jagged Bottom Edge Effect */}
                   <div className="absolute bottom-[-6px] left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIGZpbGw9IiNmZmYiIHBvaW50cz0iMCA4IDQgMCA4IDgiLz48L3N2Zz4=')] bg-repeat-x shadow-[0_4px_4px_rgba(0,0,0,0.05)]"></div>
                   
                   <div className="text-center space-y-1 mb-6">
                     {logoUrl && (
                        <div className="flex justify-center mb-3">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={logoUrl} alt="Logo" className="max-h-12 object-contain grayscale" />
                        </div>
                     )}
                     <h3 className="font-bold text-lg uppercase tracking-wider">{storeName || "JUICE BAR POS"}</h3>
                     {address && <p className="text-xs whitespace-pre-wrap">{address}</p>}
                     {phone && <p className="text-xs">Tel: {phone}</p>}
                     <p className="text-xs mt-2">--------------------------------</p>
                     <p className="text-xs">TAX INVOICE</p>
                     <p className="text-xs">--------------------------------</p>
                   </div>
                   
                   <div className="space-y-2 mb-4 text-xs">
                     <div className="flex justify-between"><span>Date: {new Date().toLocaleDateString()}</span><span>Time: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                     <div>Receipt #: INV-0001</div>
                     <div>Cashier: Super Admin</div>
                     <p>--------------------------------</p>
                   </div>
                   
                   <div className="space-y-2 text-xs mb-4">
                     <div className="flex justify-between font-bold">
                       <span className="w-8">Qty</span>
                       <span className="flex-1">Item</span>
                       <span className="text-right">Amount</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="w-8">1x</span>
                       <span className="flex-1">Mango Juice (L)</span>
                       <span className="text-right">500.00</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="w-8">2x</span>
                       <span className="flex-1">Chicken Sub</span>
                       <span className="text-right">1200.00</span>
                     </div>
                   </div>
                   
                   <div className="space-y-1 text-xs mb-6 border-t border-dashed border-gray-400 pt-2">
                     <div className="flex justify-between"><span>Subtotal</span><span>1700.00</span></div>
                     {(parseFloat(packagingCharge) > 0) && <div className="flex justify-between"><span>Packaging</span><span>{parseFloat(packagingCharge).toFixed(2)}</span></div>}
                     {(parseFloat(taxRate) > 0) && <div className="flex justify-between"><span>{taxName || "Tax"} ({taxRate}%)</span><span>{((1700 * parseFloat(taxRate)) / 100).toFixed(2)}</span></div>}
                     <div className="flex justify-between font-bold text-base mt-2"><span>TOTAL</span><span>Rs. {(1700 + (parseFloat(packagingCharge) || 0) + ((1700 * (parseFloat(taxRate) || 0)) / 100)).toFixed(2)}</span></div>
                   </div>
                   
                   <div className="text-center text-xs space-y-2">
                     <p>--------------------------------</p>
                     <p className="whitespace-pre-wrap">{receiptFooter || "Thank you for your purchase!"}</p>
                     <p>--------------------------------</p>
                     <p className="text-[10px] text-gray-500 mt-4">Powered by Antigravity</p>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
