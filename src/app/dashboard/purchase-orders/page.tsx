"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, CheckCircle, PackageOpen, X, FileText, Download } from "lucide-react"

export interface POItem {
  id: string
  name: string
  unit: string
  quantity: number
  unitCost: number
  totalCost: number
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  branch: string
  createdDate: string
  expectedDate: string
  itemType: "Raw Materials" | "Finished Products"
  items: POItem[]
  totalCost: number
  status: "Draft" | "Submitted" | "Approved" | "Received" | "Closed"
  createdBy: string
}

const BRANCHES = ["Colombo 07", "Kandy Branch", "Galle Branch"]
const UNITS = ["Kg", "g", "L", "ml", "Bottles", "Packets", "Boxes"]

export default function PurchaseOrdersPage() {
  const { user, role } = useAuth()
  
  const canApprove = role === "Super Admin" || role === "Admin"
  const defaultBranch = user?.branch === "All Branches" ? "Colombo 07" : (user?.branch || "Colombo 07")

  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING">("ALL")

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [supplierId, setSupplierId] = useState("")
  const [branch, setBranch] = useState(defaultBranch)
  const [expectedDate, setExpectedDate] = useState("")
  const [itemType, setItemType] = useState<"Raw Materials" | "Finished Products">("Raw Materials")
  const [items, setItems] = useState<POItem[]>([])
  
  // Item Entry State
  const [itemName, setItemName] = useState("")
  const [itemUnit, setItemUnit] = useState("Kg")
  const [itemQty, setItemQty] = useState("")
  const [itemCost, setItemCost] = useState("")

  useEffect(() => {
    const storedPOs = localStorage.getItem("mock_purchase_orders")
    if (storedPOs) setPos(JSON.parse(storedPOs))

    const storedSups = localStorage.getItem("mock_suppliers")
    if (storedSups) setSuppliers(JSON.parse(storedSups))
  }, [])

  const filteredPOs = pos.filter(po => {
    const matchSearch = po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) || po.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeTab === "PENDING") return matchSearch && po.status === "Submitted"
    return matchSearch
  })

  // Add Item to current PO draft
  const handleAddItem = () => {
    if (!itemName || !itemQty || !itemCost) return
    const qty = parseFloat(itemQty)
    const cost = parseFloat(itemCost)
    if (qty <= 0 || cost < 0) return

    const newItem: POItem = {
      id: `ITEM-${Date.now()}`,
      name: itemName,
      unit: itemUnit,
      quantity: qty,
      unitCost: cost,
      totalCost: qty * cost
    }
    setItems([...items, newItem])
    setItemName("")
    setItemQty("")
    setItemCost("")
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId || items.length === 0 || !expectedDate) {
      alert("Please fill all required fields and add at least one item.")
      return
    }

    const supplierName = suppliers.find(s => s.id === supplierId)?.name || "Unknown Supplier"
    const poNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
    const totalCost = items.reduce((acc, item) => acc + item.totalCost, 0)
    
    // Auto-Approve logic: If Admin creates it, it's Approved. If Manager, it's Submitted.
    const initialStatus = canApprove ? "Approved" : "Submitted"

    const newPO: PurchaseOrder = {
      id: `POID-${Date.now()}`,
      poNumber, supplierId, supplierName, branch,
      createdDate: new Date().toISOString().split('T')[0],
      expectedDate, itemType, items, totalCost,
      status: initialStatus,
      createdBy: user?.name || "System"
    }

    const updated = [newPO, ...pos]
    setPos(updated)
    localStorage.setItem("mock_purchase_orders", JSON.stringify(updated))
    setIsCreateOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setSupplierId("")
    setBranch(defaultBranch)
    setExpectedDate("")
    setItems([])
    setItemType("Raw Materials")
  }

  const handleApprove = (poId: string) => {
    if (!canApprove) return
    const updated = pos.map(p => p.id === poId ? { ...p, status: "Approved" as const } : p)
    setPos(updated)
    localStorage.setItem("mock_purchase_orders", JSON.stringify(updated))
  }

  const handleReceiveGoods = (po: PurchaseOrder) => {
    if (confirm(`Are you sure you want to receive goods for ${po.poNumber}? This will inject stock into the inventory.`)) {
      // 1. Update PO Status
      const updatedPOs = pos.map(p => p.id === po.id ? { ...p, status: "Received" as const } : p)
      setPos(updatedPOs)
      localStorage.setItem("mock_purchase_orders", JSON.stringify(updatedPOs))

      // 2. Inject into Stock Ledger & Inventory
      // Note: We need a mapping for real rawMaterial IDs. Since PO allows manual typing, we do a best-effort match or create new.
      // For this mock, we just inject raw ledger entries. The Inventory page calculates based on ledger or stores its own.
      // Since Branch Inventory uses its own array in our mock, we update it here:
      
      const storedInv = localStorage.getItem("mock_branch_inventory")
      let inventory = storedInv ? JSON.parse(storedInv) : []
      
      const storedLedger = localStorage.getItem("mock_stock_ledger")
      const ledger = storedLedger ? JSON.parse(storedLedger) : []
      const now = new Date().toISOString()
      
      const newLedgerEntries = []

      po.items.forEach((item, idx) => {
        // We will assume Base Unit conversion is 1:1 if they selected 'g' or 'ml'. If they selected 'Kg', we multiply by 1000.
        // This is a simplified mock conversion.
        let baseQty = item.quantity
        let baseUnit = item.unit
        if (item.unit === "Kg") { baseQty = item.quantity * 1000; baseUnit = "g" }
        if (item.unit === "L") { baseQty = item.quantity * 1000; baseUnit = "ml" }

        // Find existing inventory item or create dummy
        const existingIdx = inventory.findIndex((i:any) => i.rawMaterialName.toLowerCase() === item.name.toLowerCase() && i.branchId === po.branch)
        if (existingIdx >= 0) {
          inventory[existingIdx].currentStock += baseQty
        } else {
          inventory.push({
            id: `RM-${Date.now()}-${idx}`,
            branchId: (BRANCHES.indexOf(po.branch) + 1).toString().replace(/^/, 'B'), // B1, B2
            rawMaterialName: item.name,
            sku: `SKU-PO-${Date.now().toString().slice(-4)}`,
            baseUnit: baseUnit,
            currentStock: baseQty,
            minimumStock: 5000,
            maxCapacity: baseQty * 2,
            status: "Active"
          })
        }

        // Add Ledger Entry
        newLedgerEntries.push({
          id: `LDG-PO-${Date.now()}-${idx}`,
          timestamp: now,
          branch: po.branch,
          rawMaterialName: item.name,
          type: "IN",
          reason: "Purchase Received",
          quantityChange: baseQty,
          baseUnit: baseUnit,
          reference: po.poNumber
        })
      })

      localStorage.setItem("mock_branch_inventory", JSON.stringify(inventory))
      localStorage.setItem("mock_stock_ledger", JSON.stringify([...ledger, ...newLedgerEntries]))
      
      alert(`Success! Goods received and Inventory updated automatically.`)
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Submitted": return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold border border-yellow-200">Awaiting Approval</span>
      case "Approved": return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold border border-blue-200">Approved</span>
      case "Received": return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold border border-green-200">Received (GRN)</span>
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold">{status}</span>
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Purchase Orders</h2>
          <p className="text-gray-500">Create POs and manage the procurement workflow.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 px-4">
          <Plus className="w-4 h-4 mr-2" /> Create PO
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-2 w-full sm:w-auto p-1 bg-gray-100 rounded-lg">
            <button onClick={() => setActiveTab("ALL")} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'ALL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              All POs
            </button>
            {canApprove && (
              <button onClick={() => setActiveTab("PENDING")} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'PENDING' ? 'bg-white shadow-sm text-yellow-700' : 'text-gray-500 hover:text-gray-700'}`}>
                Pending Approval
              </button>
            )}
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="search" placeholder="Search PO number or supplier..." 
              className="pl-9 bg-white border-gray-200 h-10 shadow-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <TableHead className="py-4">PO Number & Details</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Expected Date</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPOs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No purchase orders found.</p>
                </TableCell>
              </TableRow>
            )}
            {filteredPOs.map((po) => (
              <TableRow key={po.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell className="py-4">
                  <div className="font-black text-gray-900">{po.poNumber}</div>
                  <div className="text-xs font-medium text-gray-500 mt-0.5">{po.items.length} items • {po.branch}</div>
                  <div className="text-[10px] uppercase font-bold text-orange-500 mt-1">{po.itemType}</div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-gray-800">{po.supplierName}</div>
                  <div className="text-xs text-gray-400">By: {po.createdBy}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium text-gray-700">{po.expectedDate}</div>
                  <div className="text-xs text-gray-400">Created: {po.createdDate}</div>
                </TableCell>
                <TableCell>
                  <div className="font-black text-gray-900">Rs. {po.totalCost.toFixed(2)}</div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(po.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {po.status === "Submitted" && canApprove && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8" onClick={() => handleApprove(po.id)}>
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                      </Button>
                    )}
                    {po.status === "Approved" && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-bold h-8" onClick={() => handleReceiveGoods(po)}>
                        <Download className="w-4 h-4 mr-1.5" /> Receive Goods (GRN)
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-8">View</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* CREATE PO MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
          <form onSubmit={handleSubmitPO}>
            <div className="p-6 border-b bg-orange-50">
              <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                <PackageOpen className="text-orange-600" /> Create Purchase Order
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2 font-medium">
                {canApprove ? "As an Admin, your POs will be auto-approved." : "As a Manager, your PO will require Admin approval."}
              </DialogDescription>
            </div>
            
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Header Details */}
              <div className="grid grid-cols-2 gap-4 bg-white">
                <div className="grid gap-2">
                  <Label className="font-bold text-gray-700">Supplier *</Label>
                  <Select value={supplierId} onValueChange={setSupplierId} required>
                    <SelectTrigger className="border-gray-300 h-10">
                      <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-gray-700">Expected Delivery Date *</Label>
                  <Input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} required className="border-gray-300 h-10" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-gray-700">Branch *</Label>
                  <Select value={branch} onValueChange={setBranch} disabled={user?.branch !== "All Branches"}>
                    <SelectTrigger className="border-gray-300 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-gray-700">Item Type</Label>
                  <Select value={itemType} onValueChange={(val: any) => setItemType(val)}>
                    <SelectTrigger className="border-gray-300 h-10 font-semibold text-orange-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Raw Materials">Raw Materials (Fruits, Milk, etc)</SelectItem>
                      <SelectItem value="Finished Products">Finished Products (Bottled Water)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items Section */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-bold text-sm text-gray-700 border-b">
                  Add Items to Order
                </div>
                <div className="p-4 space-y-4 bg-gray-50/50">
                  <div className="flex gap-2 items-end">
                    <div className="grid gap-1.5 flex-1">
                      <Label className="text-xs">Item Name</Label>
                      <Input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Sugar" className="h-9" />
                    </div>
                    <div className="grid gap-1.5 w-24">
                      <Label className="text-xs">Unit</Label>
                      <Select value={itemUnit} onValueChange={setItemUnit}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5 w-24">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" value={itemQty} onChange={e => setItemQty(e.target.value)} placeholder="0" className="h-9" />
                    </div>
                    <div className="grid gap-1.5 w-28">
                      <Label className="text-xs">Cost/Unit</Label>
                      <Input type="number" value={itemCost} onChange={e => setItemCost(e.target.value)} placeholder="Rs." className="h-9" />
                    </div>
                    <Button type="button" onClick={handleAddItem} className="h-9 bg-gray-900 text-white">Add</Button>
                  </div>

                  {/* Items List */}
                  {items.length > 0 && (
                    <div className="border rounded-lg bg-white overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 text-xs">
                            <TableHead className="py-2">Item</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Cost/Unit</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map(item => (
                            <TableRow key={item.id} className="text-sm">
                              <TableCell className="font-semibold py-2">{item.name}</TableCell>
                              <TableCell>{item.quantity} {item.unit}</TableCell>
                              <TableCell>Rs. {item.unitCost.toFixed(2)}</TableCell>
                              <TableCell className="font-bold">Rs. {item.totalCost.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"><X className="w-3 h-3" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-orange-50 font-black">
                            <TableCell colSpan={3} className="text-right py-3 text-orange-900">GRAND TOTAL:</TableCell>
                            <TableCell colSpan={2} className="py-3 text-orange-900">Rs. {items.reduce((a,b)=>a+b.totalCost,0).toFixed(2)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="p-6 border-t bg-white flex gap-3 sm:justify-end">
              <Button type="button" variant="outline" className="h-11 px-6 font-bold" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="h-11 px-6 font-bold bg-orange-500 text-white hover:bg-orange-600 shadow-lg">Submit Purchase Order</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
