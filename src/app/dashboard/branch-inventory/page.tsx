"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, History, ArrowDownUp, AlertCircle, CheckCircle2 } from "lucide-react"

// Dummy Data
const BRANCHES = [
  { id: "B1", name: "Colombo Branch" },
  { id: "B2", name: "Kandy Branch" },
  { id: "B3", name: "Galle Branch" }
]

// Note: Stock is branch-specific. This array maps Raw Material + Branch
const INITIAL_INVENTORY = [
  { id: 1, branchId: "B1", rawMaterialName: "Sugar", sku: "RM-SUG-001", unit: "kg", currentStock: 50, minimumStock: 20, status: "Active" },
  { id: 2, branchId: "B1", rawMaterialName: "Milk", sku: "RM-MLK-001", unit: "L", currentStock: 15, minimumStock: 30, status: "Active" },
  { id: 3, branchId: "B1", rawMaterialName: "Mango", sku: "RM-MNG-001", unit: "kg", currentStock: 40, minimumStock: 15, status: "Active" },
  { id: 4, branchId: "B2", rawMaterialName: "Sugar", sku: "RM-SUG-001", unit: "kg", currentStock: 5, minimumStock: 10, status: "Active" },
  { id: 5, branchId: "B2", rawMaterialName: "Milk", sku: "RM-MLK-001", unit: "L", currentStock: 40, minimumStock: 15, status: "Active" },
]

export default function BranchInventoryPage() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY)
  const [selectedBranch, setSelectedBranch] = useState("B1")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Adjustment Modal State
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false)
  const [adjustmentItem, setAdjustmentItem] = useState<any>(null)
  const [adjustmentType, setAdjustmentType] = useState("IN")
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")

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
    setIsAdjustmentOpen(true)
  }

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!adjustmentItem) return
    const qty = parseFloat(adjustmentQuantity)
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid quantity.")
      return
    }

    setInventory(inventory.map(item => {
      if (item.id === adjustmentItem.id) {
        let newStock = item.currentStock
        if (adjustmentType === "IN") {
          newStock += qty
        } else if (adjustmentType === "OUT") {
          newStock -= qty
        }
        return { ...item, currentStock: newStock }
      }
      return item
    }))

    // In a real app, we would also save this to the StockLedger table here
    
    setIsAdjustmentOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Branch Inventory</h2>
          <p className="text-muted-foreground">Manage and track raw material stocks specifically for each branch.</p>
        </div>
        
        <div className="w-full sm:w-64">
          <Label className="text-xs text-gray-500 mb-1 block">Current Branch</Label>
          <Select value={selectedBranch} onValueChange={(val) => setSelectedBranch(val || "B1")}>
            <SelectTrigger className="border-orange-200 bg-orange-50 font-semibold text-orange-900">
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

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search items in this branch..." 
              className="pl-9 bg-gray-50 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <TableHead className="py-3">Item Name</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Minimum Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No inventory items found for this branch.
                </TableCell>
              </TableRow>
            )}
            {filteredInventory.map((item) => {
              const isLowStock = item.currentStock <= item.minimumStock;
              
              return (
                <TableRow key={item.id} className={`border-b last:border-0 hover:bg-gray-50/50 ${isLowStock ? 'bg-red-50/30' : ''}`}>
                  <TableCell className="py-4">
                    <div className="font-semibold text-gray-800">{item.rawMaterialName}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.sku}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.currentStock}
                      </span>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {item.unit}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-500">{item.minimumStock} {item.unit}</span>
                  </TableCell>
                  <TableCell>
                    {isLowStock ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                        <AlertCircle className="h-3 w-3" /> LOW STOCK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                        <CheckCircle2 className="h-3 w-3" /> OK
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs font-medium border-orange-200 text-orange-700 hover:bg-orange-50" onClick={() => handleOpenAdjustment(item)}>
                        <ArrowDownUp className="h-3 w-3 mr-1" /> Adjust Stock
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-blue-600 hover:bg-blue-50" title="View Ledger">
                        <History className="h-3 w-3 mr-1" /> Ledger
                      </Button>
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
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveAdjustment}>
            <DialogHeader>
              <DialogTitle>Stock Adjustment</DialogTitle>
              <DialogDescription>
                Adjust inventory for <strong className="text-gray-900">{adjustmentItem?.rawMaterialName}</strong> in <strong>{BRANCHES.find(b => b.id === selectedBranch)?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-gray-700">Adjustment Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="adjType" checked={adjustmentType === "IN"} onChange={() => setAdjustmentType("IN")} className="text-orange-500 focus:ring-orange-500" />
                    <span className="text-sm font-medium text-green-700">Stock IN (+)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="adjType" checked={adjustmentType === "OUT"} onChange={() => setAdjustmentType("OUT")} className="text-orange-500 focus:ring-orange-500" />
                    <span className="text-sm font-medium text-red-700">Stock OUT (-)</span>
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="qty" className="text-sm font-medium text-gray-700">Quantity ({adjustmentItem?.unit}) *</Label>
                  <Input id="qty" type="number" step="0.01" placeholder="e.g. 10" value={adjustmentQuantity} onChange={(e) => setAdjustmentQuantity(e.target.value)} required className="border-gray-300" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-700">Current Stock</Label>
                  <div className="h-10 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm font-semibold text-gray-600">
                    {adjustmentItem?.currentStock} {adjustmentItem?.unit}
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="reason" className="text-sm font-medium text-gray-700">Reason *</Label>
                <Select value={adjustmentReason} onValueChange={(val) => setAdjustmentReason(val || "")} required>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {adjustmentType === "IN" ? (
                      <>
                        <SelectItem value="Purchase Received">Purchase Received</SelectItem>
                        <SelectItem value="Stock Transfer In">Stock Transfer In</SelectItem>
                        <SelectItem value="Correction">Correction / Physical Count</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Wastage">Wastage / Spoilage</SelectItem>
                        <SelectItem value="Stock Transfer Out">Stock Transfer Out</SelectItem>
                        <SelectItem value="Correction">Correction / Physical Count</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter className="mt-4 flex gap-3 sm:justify-end">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsAdjustmentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
                Save Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
