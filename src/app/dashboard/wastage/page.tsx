"use client"
import { toast } from 'sonner';

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Trash2, AlertTriangle, AlertCircle } from "lucide-react"

const REASONS = ["Expired", "Rotten", "Damaged", "Spillage"]

export default function WastagePage() {
  const { user, role } = useAuth()
  const defaultBranch = user?.branch === "All Branches" ? "Colombo 07" : (user?.branch || "Colombo 07")
  const canSelectBranch = role === "Super Admin" || role === "Admin"
  
  const [wastages, setWastages] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBranch, setSelectedBranch] = useState(defaultBranch)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItemName, setSelectedItemName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("Expired")

  useEffect(() => {
    fetchWastages()
    fetchInventory()
  }, [selectedBranch])

  const fetchWastages = async () => {
    try {
      const res = await fetch(`/api/wastage?branch=${selectedBranch}`)
      if (res.ok) {
        setWastages(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchInventory = async () => {
    try {
      const res = await fetch(`/api/branch-inventory?branch=${selectedBranch}`)
      if (res.ok) {
        setInventory(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filteredWastages = wastages.filter(w => 
    w.item?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.reason.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedItemName || !quantity || !reason) {
      toast.error("Please fill all fields")
      return
    }

    const qty = parseFloat(quantity)
    if (qty <= 0) return

    const invItem = inventory.find(i => i.name === selectedItemName)
    if (!invItem) {
      toast.error("Item not found in inventory")
      return
    }

    if (invItem.quantity < qty) {
      toast.error(`Not enough stock to record this wastage. Available: ${invItem.quantity} ${invItem.unit}`)
      return
    }

    try {
      // 1. Record Wastage
      const res = await fetch('/api/wastage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: selectedBranch,
          sku: invItem.sku,
          quantity: qty,
          reason,
          createdBy: user?.email
        })
      })

      if (res.ok) {
        // 2. Deduct from inventory
        await fetch('/api/inventory/adjust', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branch: selectedBranch,
            sku: invItem.sku,
            quantity: qty,
            type: 'OUT',
            reference: 'Wastage',
            remarks: `Wastage - ${reason}`
          })
        })

        fetchWastages()
        fetchInventory()
        setIsModalOpen(false)
        setSelectedItemName("")
        setQuantity("")
      } else {
        toast.error("Failed to save wastage")
      }
    } catch (e) {
      console.error(e)
      toast.error("An error occurred")
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-red-500 w-6 h-6" /> Wastage Management
          </h2>
          <p className="text-gray-500">Log spoiled, expired, or damaged stock.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-4">
          <Plus className="w-4 h-4 mr-2" /> Record Wastage
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="search" placeholder="Search item or reason..." 
              className="pl-9 bg-white border-gray-200 h-10 shadow-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-64">
            <Select value={selectedBranch} onValueChange={(v) => setSelectedBranch(v || "")} disabled={!canSelectBranch}>
              <SelectTrigger className="border-gray-200 h-10 bg-white">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Colombo 07">Colombo 07</SelectItem>
                <SelectItem value="Kandy Branch">Kandy Branch</SelectItem>
                <SelectItem value="Galle Branch">Galle Branch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <TableHead className="py-4">Item Details</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWastages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No wastage records found.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredWastages.map((w) => (
                <TableRow key={w.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <TableCell className="py-4">
                    <div className="font-bold text-gray-900">{w.item?.name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{w.item?.sku}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                      {w.reason}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-black text-red-600 text-base">{w.quantity}</div>
                    <div className="text-xs text-gray-400 font-bold uppercase">{w.item?.unit}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm font-medium text-gray-700">{new Date(w.createdAt).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">{new Date(w.createdAt).toLocaleTimeString()}</div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-red-500 w-5 h-5" /> Record Wastage
            </DialogTitle>
            <DialogDescription>
              Deduct spoiled or damaged stock from {selectedBranch}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Item *</Label>
              <Select value={selectedItemName} onValueChange={(v) => setSelectedItemName(v || "")} required>
                <SelectTrigger><SelectValue placeholder="Choose inventory item..." /></SelectTrigger>
                <SelectContent>
                  {inventory.map(i => (
                    <SelectItem key={i._id || i.sku} value={i.name}>
                      {i.name} <span className="text-gray-400 text-xs ml-2">(Max: {i.quantity} {i.unit})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" step="0.01" min="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Select value={reason} onValueChange={(v) => setReason(v || "")} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">Confirm Wastage</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
