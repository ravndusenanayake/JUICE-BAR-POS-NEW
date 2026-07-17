"use client"
import { toast } from 'sonner';

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"

export default function InventoryPage() {
  const { user } = useAuth()
  const [inventory, setInventory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Adjustment State
  const [selectedSku, setSelectedSku] = useState("")
  const [adjustType, setAdjustType] = useState("IN")
  const [quantity, setQuantity] = useState("")
  const [remarks, setRemarks] = useState("")

  useEffect(() => {
    fetchStock()
  }, [user])

  const fetchStock = async () => {
    try {
      setIsLoading(true)
      const branch = user?.branch || 'Colombo 07'
      const res = await fetch(`/api/inventory/stock?branch=${branch}`)
      if (res.ok) {
        const data = await res.json()
        setInventory(data)
      }
    } catch (error) {
      console.error("Error fetching stock:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSku || !quantity) return

    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: user?.branch || 'Colombo 07',
          sku: selectedSku,
          quantity: Number(quantity),
          type: adjustType, // IN, OUT, WASTAGE
          reference: 'Manual Adjustment',
          remarks: remarks
        })
      })

      if (res.ok) {
        setIsDialogOpen(false)
        setQuantity("")
        setRemarks("")
        fetchStock() // Refresh list
      } else {
        toast.error("Failed to adjust stock")
      }
    } catch (error) {
      console.error("Error adjusting stock:", error)
    }
  }

  const filteredInventory = inventory.filter(item => 
    item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory Stock</h2>
          <p className="text-muted-foreground">Monitor real-time stock levels for your branch.</p>
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <ArrowDownToLine className="mr-2 h-4 w-4" /> Adjust Stock
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAdjustStock}>
              <DialogHeader>
                <DialogTitle>Adjust Stock Levels</DialogTitle>
                <DialogDescription>
                  Manually increase or decrease stock (e.g. for Wastage or manual GRN).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Select Product</Label>
                  <Select onValueChange={(v: any) => setSelectedSku(v || "")} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.map(item => (
                        <SelectItem key={item.sku} value={item.sku}>
                          {item.productName} ({item.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Adjustment Type</Label>
                  <Select value={adjustType} onValueChange={(v) => setAdjustType(v || "")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">Stock IN (Add)</SelectItem>
                      <SelectItem value="OUT">Stock OUT (Remove)</SelectItem>
                      <SelectItem value="WASTAGE">Wastage (Remove)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Quantity</Label>
                  <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label>Remarks</Label>
                  <Input placeholder="e.g. Spilled milk" value={remarks} onChange={e => setRemarks(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">Save Adjustment</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search products..." 
            className="pl-8" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading stock...</TableCell>
              </TableRow>
            ) : filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">No stock items found for this branch.</TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium text-xs text-gray-500">{item.sku}</TableCell>
                  <TableCell className="font-bold">{item.productName}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right font-black text-lg">
                    {item.quantity}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.quantity > 20 ? 'bg-green-100 text-green-700' : item.quantity > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {item.quantity > 20 ? 'In Stock' : item.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
