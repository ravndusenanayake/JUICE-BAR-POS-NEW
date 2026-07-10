"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, History, ArrowDownUp, AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react"
import { formatStockDisplay, BaseUnit } from "@/lib/units"
import Link from "next/link"

const BRANCHES = [
  { id: "Colombo 07", name: "Colombo 07" },
  { id: "Kandy Branch", name: "Kandy Branch" },
  { id: "Galle Branch", name: "Galle Branch" }
]

export default function BranchInventoryPage() {
  const { user, role } = useAuth()
  
  const [selectedBranch, setSelectedBranch] = useState(user?.branch === "All Branches" ? "Colombo 07" : (user?.branch || "Colombo 07"))
  const [inventory, setInventory] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  
  // Adjustment Modal State
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false)
  const [adjustmentItem, setAdjustmentItem] = useState<any>(null)
  const [adjustmentType, setAdjustmentType] = useState("IN")
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const [adjustmentRef, setAdjustmentRef] = useState("")
  const [lossValue, setLossValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const canSelectBranch = role === "Super Admin" || role === "Admin"

  useEffect(() => {
    fetchInventory()
  }, [selectedBranch])

  const fetchInventory = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/branch-inventory?branch=${selectedBranch}`)
      if (res.ok) {
        const data = await res.json()
        setInventory(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenAdjustment = (item: any) => {
    setAdjustmentItem(item)
    setAdjustmentType("IN")
    setAdjustmentQuantity("")
    setAdjustmentReason("")
    setAdjustmentRef("")
    setLossValue("")
    setIsAdjustmentOpen(true)
  }

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustmentItem) return
    
    const displayQty = parseFloat(adjustmentQuantity)
    if (isNaN(displayQty) || displayQty <= 0) {
      alert("Please enter a valid quantity.")
      return
    }

    const isWastageReason = ["Rotten / Expired", "Damaged / Broken", "Spillage"].includes(adjustmentReason)
    if (adjustmentType === "OUT" && isWastageReason && !lossValue) {
      alert("Please enter the financial loss amount for the wastage.")
      return
    }

    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: selectedBranch,
          sku: adjustmentItem.sku,
          quantity: displayQty,
          type: adjustmentType,
          reference: adjustmentRef || "Manual Adjustment",
          remarks: adjustmentReason
        })
      })

      if (!res.ok) throw new Error("Failed to adjust inventory")

      setIsAdjustmentOpen(false)
      fetchInventory() // refresh table
    } catch (e) {
      console.error(e)
      alert("Failed to save adjustment.")
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Branch Inventory</h2>
          <p className="text-gray-500">Manage stocks and perform manual adjustments per branch.</p>
        </div>
        
        <div className="w-full sm:w-64">
          <Label className="text-xs font-semibold text-gray-500 mb-1 block">Current Branch</Label>
          <Select value={selectedBranch} onValueChange={(val) => setSelectedBranch(val || selectedBranch)} disabled={!canSelectBranch}>
            <SelectTrigger className="border-orange-200 bg-orange-50 font-bold text-orange-900 h-10 shadow-sm focus:ring-orange-500">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {BRANCHES.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="search" placeholder="Search by name or SKU..." 
              className="pl-9 bg-white border-gray-200 h-10 shadow-sm focus-visible:ring-orange-500"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard/stock-ledger" passHref>
              <Button variant="outline" className="h-10 text-gray-700 bg-white shadow-sm hover:bg-gray-50">
                <History className="w-4 h-4 mr-2" /> View Stock Ledger
              </Button>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <TableHead className="py-4 px-4">Item Details</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-gray-400">Loading inventory...</TableCell>
                </TableRow>
              ) : filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-gray-400">No inventory found for this branch.</TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item) => {
                  const stockDisplay = formatStockDisplay(item.quantity, item.unit as BaseUnit)
                  const minStockDisplay = formatStockDisplay(item.minStockLevel, item.unit as BaseUnit)
                  
                  // Status Logic
                  let statusColor = "bg-green-100 text-green-700 border-green-200"
                  let StatusIcon = CheckCircle2
                  let statusText = "Optimal"

                  if (item.quantity <= 0) {
                    statusColor = "bg-red-100 text-red-700 border-red-200"
                    StatusIcon = AlertCircle
                    statusText = "Out of Stock"
                  } else if (item.quantity <= item.minStockLevel) {
                    statusColor = "bg-amber-100 text-amber-700 border-amber-200"
                    StatusIcon = AlertCircle
                    statusText = "Low Stock"
                  }

                  return (
                    <TableRow key={item._id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                      <TableCell className="py-4 px-4">
                        <div className="font-bold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{item.sku}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="font-black text-gray-900 text-base">{stockDisplay}</div>
                        <div className="text-[10px] font-medium text-gray-400 uppercase mt-0.5 tracking-wider">
                          Min: {minStockDisplay}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusText}
                        </span>
                      </TableCell>

                      <TableCell className="text-right px-4">
                        <Button 
                          variant="ghost" size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 font-semibold"
                          onClick={() => handleOpenAdjustment(item)}
                        >
                          <ArrowDownUp className="w-4 h-4 mr-1.5" /> Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Stock Adjustment</DialogTitle>
            <DialogDescription>
              Adjusting inventory for <strong className="text-gray-900">{adjustmentItem?.name}</strong> at {selectedBranch}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveAdjustment} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                  <SelectTrigger className={adjustmentType === "IN" ? "text-green-600 font-bold border-green-200 bg-green-50" : "text-red-600 font-bold border-red-200 bg-red-50"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN" className="text-green-600 font-bold">
                      <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Stock IN (+)</div>
                    </SelectItem>
                    <SelectItem value="OUT" className="text-red-600 font-bold">
                      <div className="flex items-center gap-2"><TrendingDown className="w-4 h-4"/> Stock OUT (-)</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity ({adjustmentItem?.unit})</Label>
                <Input 
                  type="number" step="0.01" min="0.01" required 
                  value={adjustmentQuantity} onChange={e => setAdjustmentQuantity(e.target.value)}
                  placeholder="e.g. 500" className="font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={adjustmentReason} onValueChange={setAdjustmentReason} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {adjustmentType === "IN" ? (
                    <>
                      <SelectItem value="Initial Count">Initial Count</SelectItem>
                      <SelectItem value="Found Stock">Found Stock</SelectItem>
                      <SelectItem value="Return">Return</SelectItem>
                      <SelectItem value="Other IN">Other</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Damaged / Broken">Damaged / Broken</SelectItem>
                      <SelectItem value="Rotten / Expired">Rotten / Expired</SelectItem>
                      <SelectItem value="Spillage">Spillage</SelectItem>
                      <SelectItem value="Staff Consumption">Staff Consumption</SelectItem>
                      <SelectItem value="Theft / Lost">Theft / Lost</SelectItem>
                      <SelectItem value="Other OUT">Other</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {adjustmentType === "OUT" && ["Rotten / Expired", "Damaged / Broken", "Spillage"].includes(adjustmentReason) && (
              <div className="space-y-2 bg-red-50/50 p-3 rounded-lg border border-red-100">
                <Label className="text-red-700">Financial Loss Amount (Rs.)</Label>
                <Input 
                  type="number" min="0" required
                  value={lossValue} onChange={e => setLossValue(e.target.value)}
                  placeholder="Estimated loss value" className="border-red-200"
                />
                <p className="text-xs text-red-500">Required for wastage tracking.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Reference Note / Bill No (Optional)</Label>
              <Input 
                value={adjustmentRef} onChange={e => setAdjustmentRef(e.target.value)}
                placeholder="e.g. ADJ-001"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAdjustmentOpen(false)}>Cancel</Button>
              <Button type="submit" className={adjustmentType === "IN" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
                Confirm {adjustmentType}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
