"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ArrowRightLeft, Plus, CheckCircle, PackageOpen, Download, AlertTriangle } from "lucide-react"

export interface TransferItem {
  id: string
  rawMaterialName: string
  sku: string
  quantity: number
  unit: string
}

export interface StockTransfer {
  id: string
  _id?: string
  transferNumber: string
  sourceBranch: string
  destinationBranch: string
  createdDate: string
  items: TransferItem[]
  status: "Draft" | "Pending Approval" | "Approved" | "Received" | "Completed"
  createdBy: string
}

const BRANCHES = ["Colombo 07", "Kandy Branch", "Galle Branch"]

export default function StockTransfersPage() {
  const { user, role } = useAuth()
  
  const canApprove = role === "Super Admin" || role === "Admin"
  const defaultBranch = user?.branch === "All Branches" ? "Colombo 07" : (user?.branch || "Colombo 07")

  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [sourceBranch, setSourceBranch] = useState(defaultBranch)
  const [destBranch, setDestBranch] = useState("")
  
  // Item Selection State for Transfer
  const [selectedItemName, setSelectedItemName] = useState("")
  const [transferQty, setTransferQty] = useState("")
  const [transferItems, setTransferItems] = useState<TransferItem[]>([])

  useEffect(() => {
    fetchTransfers()
    fetchInventory()
  }, [])

  const fetchTransfers = async () => {
    try {
      const res = await fetch('/api/stock-transfers')
      if (res.ok) {
        const data = await res.json()
        setTransfers(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchInventory = async () => {
    try {
      // Fetch for all branches or selected branch. For transfer, we need to know source branch inventory.
      // We will fetch based on sourceBranch
      const res = await fetch(`/api/branch-inventory?branch=${sourceBranch}`)
      if (res.ok) {
        const data = await res.json()
        setInventory(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [sourceBranch])

  const filteredTransfers = transfers.filter(t => 
    t.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sourceBranch.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.destinationBranch.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getSourceInventory = () => {
    return inventory // already filtered by sourceBranch in fetch
  }

  const handleAddItem = () => {
    if (!selectedItemName || !transferQty) return
    const qty = parseFloat(transferQty)
    if (qty <= 0) return

    const invItem = inventory.find(i => i.name === selectedItemName)
    if (!invItem) {
      alert("Item not found in source branch inventory.")
      return
    }

    // Check if source has enough stock (assuming qty entered is in baseUnit)
    if (invItem.quantity < qty) {
      alert(`Not enough stock! Available: ${invItem.quantity} ${invItem.unit}`)
      return
    }

    const newItem: TransferItem = {
      id: `TRF-ITEM-${Date.now()}`,
      rawMaterialName: invItem.name,
      sku: invItem.sku,
      quantity: qty,
      unit: invItem.unit
    }
    
    setTransferItems([...transferItems, newItem])
    setSelectedItemName("")
    setTransferQty("")
  }

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destBranch || sourceBranch === destBranch) {
      alert("Please select a valid destination branch different from the source.")
      return
    }
    if (transferItems.length === 0) {
      alert("Please add at least one item to transfer.")
      return
    }

    const transferNumber = `TRF-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
    
    // If Manager creates it, it goes to Pending. If Admin, it's Approved immediately.
    const initialStatus = canApprove ? "Approved" : "Pending Approval"

    const payload = {
      transferNumber,
      sourceBranch,
      destinationBranch: destBranch,
      items: transferItems,
      status: initialStatus
    }

    try {
      const res = await fetch('/api/stock-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const newTransfer = await res.json()
        
        // If auto-approved, we MUST deduct from source immediately
        if (initialStatus === "Approved") {
          await processSourceDeduction(payload)
        }
        
        fetchTransfers()
        setIsCreateOpen(false)
        setTransferItems([])
        setDestBranch("")
      } else {
        alert("Failed to create transfer")
      }
    } catch (err) {
      console.error(err)
      alert("Failed to create transfer")
    }
  }

  const processSourceDeduction = async (transfer: any) => {
    for (const item of transfer.items) {
      await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: transfer.sourceBranch,
          sku: item.sku,
          quantity: item.quantity,
          type: 'OUT',
          reference: transfer.transferNumber,
          remarks: 'Stock Transfer Out to ' + transfer.destinationBranch
        })
      })
    }
  }

  const handleApprove = async (transfer: StockTransfer) => {
    if (!canApprove) return
    
    try {
      const res = await fetch('/api/stock-transfers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: transfer._id || transfer.id, status: "Approved" })
      })
      if (res.ok) {
        await processSourceDeduction(transfer)
        fetchTransfers()
        alert("Transfer Approved. Stock has been deducted from the Source Branch.")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleReceive = async (transfer: StockTransfer) => {
    if (confirm(`Are you sure you want to receive these items at ${transfer.destinationBranch}?`)) {
      try {
        for (const item of transfer.items) {
          await fetch('/api/inventory/adjust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              branch: transfer.destinationBranch,
              sku: item.sku,
              quantity: item.quantity,
              type: 'IN',
              reference: transfer.transferNumber,
              remarks: 'Stock Transfer In from ' + transfer.sourceBranch
            })
          })
        }
        
        const res = await fetch('/api/stock-transfers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: transfer._id || transfer.id, status: "Completed" })
        })
        
        if (res.ok) {
          fetchTransfers()
          alert("Stock successfully added to Destination Branch.")
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Pending Approval": return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold border border-yellow-200">Pending Approval</span>
      case "Approved": return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold border border-blue-200">Approved (In Transit)</span>
      case "Completed": return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold border border-green-200">Completed</span>
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold">{status}</span>
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="text-orange-500 w-6 h-6" /> Stock Transfers
          </h2>
          <p className="text-gray-500">Move inventory between branches.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 px-4">
          <Plus className="w-4 h-4 mr-2" /> New Transfer
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="search" placeholder="Search transfer number or branch..." 
              className="pl-9 bg-white border-gray-200 h-10 shadow-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <TableHead className="py-4">Transfer Number</TableHead>
              <TableHead>Source (From)</TableHead>
              <TableHead>Destination (To)</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransfers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  <ArrowRightLeft className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No stock transfers found.</p>
                </TableCell>
              </TableRow>
            )}
            {filteredTransfers.map((trf: any) => (
              <TableRow key={trf._id || trf.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell className="py-4">
                  <div className="font-black text-gray-900">{trf.transferNumber}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(trf.createdDate).toLocaleDateString()}</div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-red-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                    {trf.sourceBranch}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-green-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                    {trf.destinationBranch}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-black text-gray-700">{trf.items.length} Products</div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(trf.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {trf.status === "Pending Approval" && canApprove && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8" onClick={() => handleApprove(trf)}>
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                      </Button>
                    )}
                    {trf.status === "Approved" && (user?.branch === "All Branches" || user?.branch === trf.destinationBranch) && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-bold h-8" onClick={() => handleReceive(trf)}>
                        <Download className="w-4 h-4 mr-1.5" /> Receive Stock
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* CREATE TRANSFER MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
          <form onSubmit={handleSubmitTransfer}>
            <div className="p-6 border-b bg-orange-50">
              <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                <PackageOpen className="text-orange-600" /> New Stock Transfer
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2 font-medium">
                Move items from one branch to another. Approval is required before stock leaves the source.
              </DialogDescription>
            </div>
            
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Header Details */}
              <div className="grid grid-cols-2 gap-4 bg-white">
                <div className="grid gap-2">
                  <Label className="font-bold text-gray-700">Source Branch (From) *</Label>
                  <Select value={sourceBranch} onValueChange={(v) => setSourceBranch(v || "")} disabled={user?.branch !== "All Branches"}>
                    <SelectTrigger className="border-red-200 bg-red-50 h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-gray-700">Destination Branch (To) *</Label>
                  <Select value={destBranch} onValueChange={(v) => setDestBranch(v || "")} required>
                    <SelectTrigger className="border-green-200 bg-green-50 h-10"><SelectValue placeholder="Select Destination" /></SelectTrigger>
                    <SelectContent>{BRANCHES.filter(b => b !== sourceBranch).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items Section */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-bold text-sm text-gray-700 border-b flex justify-between">
                  <span>Add Items to Transfer</span>
                  <span className="text-xs text-orange-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Limited to source stock</span>
                </div>
                <div className="p-4 space-y-4 bg-gray-50/50">
                  <div className="flex gap-2 items-end">
                    <div className="grid gap-1.5 flex-1">
                      <Label className="text-xs font-bold text-gray-700">Select Item</Label>
                      <Select value={selectedItemName} onValueChange={(v) => setSelectedItemName(v || "")}>
                        <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Choose product..." /></SelectTrigger>
                        <SelectContent>
                          {getSourceInventory().map((i: any) => (
                            <SelectItem key={i._id || i.sku} value={i.name}>
                              {i.name} <span className="text-gray-400 text-xs ml-2">(Max: {i.quantity} {i.unit})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5 w-32">
                      <Label className="text-xs font-bold text-gray-700">Qty</Label>
                      <Input type="number" step="0.01" value={transferQty} onChange={e => setTransferQty(e.target.value)} placeholder="0" className="h-9 bg-white" />
                    </div>
                    <Button type="button" onClick={handleAddItem} className="h-9 bg-gray-900 text-white font-bold">Add Item</Button>
                  </div>

                  {/* Items List */}
                  {transferItems.length > 0 && (
                    <div className="border rounded-lg bg-white overflow-hidden shadow-sm mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 text-xs">
                            <TableHead className="py-2">Item</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-right">Qty to Transfer</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transferItems.map((item, idx) => (
                            <TableRow key={idx} className="text-sm border-b last:border-0">
                              <TableCell className="font-bold py-2 text-gray-900">{item.rawMaterialName}</TableCell>
                              <TableCell className="text-gray-500 font-mono text-xs">{item.sku}</TableCell>
                              <TableCell className="text-right font-black text-orange-600">{item.quantity} {item.unit}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="p-6 border-t bg-white flex gap-3 sm:justify-end">
              <Button type="button" variant="outline" className="h-11 px-6 font-bold" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="h-11 px-6 font-bold bg-orange-500 text-white hover:bg-orange-600 shadow-lg">Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
