"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your store preferences and configurations.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="tax">Tax & Fees</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Update your juice bar's basic details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="storeName">Store Name</Label>
                <Input id="storeName" defaultValue="Fresh Squeeze Juice Bar" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue="123 Health Ave, Wellness City" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue="+1 (555) 123-4567" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="tax">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tax Configuration</CardTitle>
              <CardDescription>Set the default tax rates for your sales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                <Input id="taxRate" type="number" defaultValue="8.0" step="0.1" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="taxName">Tax Name (Shown on receipt)</Label>
                <Input id="taxName" defaultValue="Sales Tax" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Configuration</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="receipt">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Receipt Settings</CardTitle>
              <CardDescription>Customize the footer message on customer receipts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="footerText">Footer Message</Label>
                <Input id="footerText" defaultValue="Thank you for choosing Fresh Squeeze! Stay healthy." />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Update Receipt</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
