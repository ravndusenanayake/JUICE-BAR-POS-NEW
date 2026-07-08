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

// Dummy Data
const BRANCHES = [
  { id: "B1", name: "Colombo 07" },
  { id: "B2", name: "Kandy Branch" },
  { id: "B3", name: "Galle Branch" }
]

// Note: Stock is stored in base units (g, ml) in the DB
const INITIAL_INVENTORY = [
  { id: "RM-001", branchId: "B1", rawMaterialName: "Sugar", sku: "SKU-SUG-01", baseUnit: "g" as BaseUnit, currentStock: 25000, minimumStock: 10000, maxCapacity: 50000, status: "Active" },
  { id: "RM-002", branchId: "B1", rawMaterialName: "Fresh Milk", sku: "SKU-MLK-01", baseUnit: "ml" as BaseUnit, currentStock: 8000, minimumStock: 10000, maxCapacity: 20000, status: "Active" },
  { id: "RM-003", branchId: "B1", rawMaterialName: "Mango", sku: "SKU-MNG-01", baseUnit: "g" as BaseUnit, currentStock: 12000, minimumStock: 5000, maxCapacity: 30000, status: "Active" },
  { id: "RM-004", branchId: "B2", rawMaterialName: "Sugar", sku: "SKU-SUG-01", baseUnit: "g" as BaseUnit, currentStock: 5000, minimumStock: 10000, maxCapacity: 20000, status: "Active" },
  { id: "RM-005", branchId: "B2", rawMaterialName: "Fresh Milk", sku: "SKU-MLK-01", baseUnit: "ml" as BaseUnit, currentStock: 18000, minimumStock: 10000, maxCapacity: 20000, status: "Active" },
]

export default function BranchInventoryPage() {
  const { user, role } = useAuth()
  
  // Set default branch based on user role
  const [selectedBranch, setSelectedBranch] = useState(user?.branch === "All Branches" ? "B1" : (BRANCHES.find(b => b.name === user?.branch)?.id || "B1"))
  const [inventory, setInventory] = useState(INITIAL_INVENTORY)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Adjustment Modal State
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false)
  const [adjustmentItem, setAdjustmentItem] = useState<any>(null)
  const [adjustmentType, setAdjustmentType] = useState("IN")
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const [adjustmentRef, setAdjustmentRef] = useState("")
  const [lossValue, setLossValue] = useState("")

  // Restrict Branch Selection if not Super Admin / Admin
  const canSelectBranch = role === "Super Admin" || role === "Admin"

  useEffect(() => {
    // Load from local storage if exists
    const stored = localStorage.getItem("mock_branch_inventory")
    if (stored) {
      setInventory(JSON.parse(stored))
    } else {
      localStorage.setItem("mock_branch_inventory", JSON.stringify(INITIAL_INVENTORY))
    }
  }, [])

  const filteredInventory = inventory.filter(item => 
    item.branchId === selectedBranch &&
    (item.rawMaterialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
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

  const handleSaveAdjustment = (e: React.FormEvent) => {
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

    // Convert input to base unit before saving
    // Example: User typed 5. If unit is 'g', they probably meant 5kg? No, let's keep it simple: 
    // We expect the user to type in Base Unit for now, OR we scale it.
    // Let's assume input is exactly in base unit for simplicity, or we convert if they select Kg.
    // For this simulation, input is in Base Unit.
    const qtyInBaseUnit = displayQty

    const updatedInventory = inventory.map(item => {
      if (item.id === adjustmentItem.id) {
        let newStock = item.currentStock
        if (adjustmentType === "IN") newStock += qtyInBaseUnit
        else if (adjustmentType === "OUT") newStock -= qtyInBaseUnit
        return { ...item, currentStock: newStock }
      }
      return item
    })

    setInventory(updatedInventory)
    localStorage.setItem("mock_branch_inventory", JSON.stringify(updatedInventory))

    // -- CRITICAL: SAVE TO AUDIT LEDGER --
    const storedLedger = localStorage.getItem("mock_stock_ledger")
    const ledger = storedLedger ? JSON.parse(storedLedger) : []
    const now = new Date().toISOString()
    
    const newEntry = {
      id: `LDG-ADJ-${Date.now()}`,
      timestamp: now,
      branch: BRANCHES.find(b => b.id === selectedBranch)?.name || "Unknown",
      rawMaterialName: adjustmentItem.rawMaterialName,
      type: adjustmentType,
      reason: adjustmentReason,
      quantityChange: qtyInBaseUnit,
      baseUnit: adjustmentItem.baseUnit, 
      reference: adjustmentRef || "Manual Adjustment",
      lossValue: adjustmentType === "OUT" && isWastageReason ? parseFloat(lossValue) || 0 : undefined
    }
    
    localStorage.setItem("mock_stock_ledger", JSON.stringify([...ledger, newEntry]))
    // -------------------------------------
    
    setIsAdjustmentOpen(false)
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
        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="search" placeholder="Search item name or SKU..." 
              className="pl-9 bg-white border-gray-200 h-10 shadow-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <TableHead className="py-4">Item Details</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Health (Capacity)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No inventory items found for this branch.</p>
                </TableCell>
              </TableRow>
            )}
            {filteredInventory.map((item) => {
              const isLowStock = item.currentStock <= item.minimumStock
              const healthPercentage = Math.min(100, Math.max(0, (item.currentStock / item.maxCapacity) * 100))
              
              // Progress Bar Color Logic
              let barColor = "bg-green-500"
              if (healthPercentage < 20 || isLowStock) barColor = "bg-red-500"
              else if (healthPercentage < 50) barColor = "bg-orange-500"

              return (
                <TableRow key={item.id} className={`border-b last:border-0 hover:bg-gray-50/50 transition-colors ${isLowStock ? 'bg-red-50/20' : ''}`}>
                  <TableCell className="py-4">
                    <div className="font-bold text-gray-900">{item.rawMaterialName}</div>
                    <div className="text-xs font-medium text-gray-400 mt-0.5 font-mono">{item.sku}</div>
                  </TableCell>
                  
                  <TableCell>
                    {/* Unit Engine Integration */}
                    <div className="flex flex-col">
                      <span className={`text-lg font-black ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatStockDisplay(item.currentStock, item.baseUnit)}
                      </span>
                      <span className="text-xs font-semibold text-gray-400 mt-1">
                        Min: {formatStockDisplay(item.minimumStock, item.baseUnit)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="w-48">
                    <div className="flex flex-col gap-1.5 w-full max-w-[150px]">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500">
                        <span>{Math.round(healthPercentage)}%</span>
                        <span>Max: {formatStockDisplay(item.maxCapacity, item.baseUnit)}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${healthPercentage}%` }} />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {isLowStock ? (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold shadow-sm">
                        <AlertCircle className="h-3.5 w-3.5" /> LOW STOCK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-bold shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5" /> HEALTHY
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-9 font-bold border-orange-200 text-orange-700 hover:bg-orange-50 shadow-sm" onClick={() => handleOpenAdjustment(item)}>
                        <ArrowDownUp className="h-4 w-4 mr-1.5" /> Adjust
                      </Button>
                      <Link href="/dashboard/stock-ledger">
                        <Button variant="ghost" size="sm" className="h-9 font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100" title="View Ledger">
                          <History className="h-4 w-4 mr-1.5" /> Ledger
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Stock Adjustment Modal */}
      <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
          <form onSubmit={handleSaveAdjustment}>
            <div className={`p-6 border-b ${adjustmentType === 'IN' ? 'bg-green-50' : 'bg-red-50'}`}>
              <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                {adjustmentType === 'IN' ? <TrendingUp className="text-green-600" /> : <TrendingDown className="text-red-600" />}
                Stock Adjustment
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2 font-medium">
                Modifying <strong className="text-gray-900">{adjustmentItem?.rawMaterialName}</strong> stock for <strong className="text-gray-900">{BRANCHES.find(b => b.id === selectedBranch)?.name}</strong>.
              </DialogDescription>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Type Toggle */}
              <div className="grid gap-2">
                <Label className="text-sm font-bold text-gray-700">Movement Type</Label>
                <div className="flex gap-4 p-1 bg-gray-100 rounded-xl border border-gray-200">
                  <button type="button" onClick={() => setAdjustmentType("IN")} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${adjustmentType === "IN" ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                    Stock IN (+)
                  </button>
                  <button type="button" onClick={() => setAdjustmentType("OUT")} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${adjustmentType === "OUT" ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                    Stock OUT (-)
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="qty" className="text-sm font-bold text-gray-700">Quantity (in {adjustmentItem?.baseUnit}) *</Label>
                  <Input id="qty" type="number" step="0.01" placeholder="e.g. 500" value={adjustmentQuantity} onChange={(e) => setAdjustmentQuantity(e.target.value)} required className="border-gray-300 h-11 font-medium" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-bold text-gray-700">Current Stock</Label>
                  <div className="h-11 flex items-center px-4 bg-gray-50 border border-gray-200 rounded-md text-sm font-black text-gray-800">
                    {adjustmentItem && formatStockDisplay(adjustmentItem.currentStock, adjustmentItem.baseUnit)}
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="reason" className="text-sm font-bold text-gray-700">Reason for Adjustment *</Label>
                <Select value={adjustmentReason} onValueChange={(val) => setAdjustmentReason(val || "")} required>
                  <SelectTrigger className="border-gray-300 h-11">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {adjustmentType === "IN" ? (
                      <>
                        <SelectItem value="GRN / Purchase Received">GRN / Purchase Received</SelectItem>
                        <SelectItem value="Stock Transfer In">Stock Transfer In</SelectItem>
                        <SelectItem value="Physical Count Correction">Physical Count Correction</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Rotten / Expired">Rotten / Expired</SelectItem>
                        <SelectItem value="Damaged / Broken">Damaged / Broken</SelectItem>
                        <SelectItem value="Spillage">Spillage</SelectItem>
                        <SelectItem value="Stock Transfer Out">Stock Transfer Out</SelectItem>
                        <SelectItem value="Physical Count Correction">Physical Count Correction</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Financial Loss Input if Wastage */}
              {adjustmentType === "OUT" && ["Rotten / Expired", "Damaged / Broken", "Spillage"].includes(adjustmentReason) && (
                <div className="grid gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <Label htmlFor="loss" className="text-sm font-bold text-red-700">Financial Loss (Rs.) *</Label>
                  <p className="text-xs text-red-600 mb-1">Enter the total buying cost of the wasted items. This will be deducted from Net Profit.</p>
                  <Input id="loss" type="number" step="0.01" placeholder="e.g. 1500.00" value={lossValue} onChange={(e) => setLossValue(e.target.value)} required className="border-red-300 h-11 font-medium bg-white" />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="ref" className="text-sm font-bold text-gray-700">Reference / Bill No. (Optional)</Label>
                <Input id="ref" type="text" placeholder="e.g. INV-2026-99" value={adjustmentRef} onChange={(e) => setAdjustmentRef(e.target.value)} className="border-gray-300 h-11 font-mono" />
              </div>

            </div>
            
            <DialogFooter className="p-6 border-t bg-gray-50 flex gap-3 sm:justify-end">
              <Button type="button" variant="outline" className="h-11 px-6 font-bold border-gray-300" onClick={() => setIsAdjustmentOpen(false)}>Cancel</Button>
              <Button type="submit" className="h-11 px-6 font-bold bg-gray-900 text-white hover:bg-black shadow-lg">Save to Ledger</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
