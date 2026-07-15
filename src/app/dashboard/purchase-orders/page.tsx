"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, CheckCircle, PackageOpen, X, FileText, Download, Truck, AlertTriangle, User } from "lucide-react"

export interface POItem {
  id: string
  name: string
  category: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  receivedQuantity?: number 
}

export interface PurchaseOrder {
  _id: string
  poNumber: string
  supplierName: string
  branch: string
  orderDate: string
  expectedDate: string
  items: POItem[]
  totalAmount: number
  status: "Pending" | "Partially Received" | "Fully Received" | "Cancelled"
  createdAt: string
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
  const [isLoading, setIsLoading] = useState(true)

  // Create PO Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [supplierId, setSupplierId] = useState("")
  const [branch, setBranch] = useState(defaultBranch)
  const [expectedDate, setExpectedDate] = useState("")
  const [items, setItems] = useState<POItem[]>([])
  const [itemType, setItemType] = useState<"Raw Material" | "Product">("Raw Material")
  const [selectedItemSku, setSelectedItemSku] = useState("")
  const [itemQty, setItemQty] = useState("")
  const [itemCost, setItemCost] = useState("")
  const [rawMaterials, setRawMaterials] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  // GRN Modal State
  const [isGrnOpen, setIsGrnOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [grnItems, setGrnItems] = useState<{ id: string, receivedQty: string, damagedQty: string }[]>([])
  const [receivedBy, setReceivedBy] = useState("")
  const [grnNotes, setGrnNotes] = useState("")

  useEffect(() => {
    fetchPOs()
  }, [])

  const fetchPOs = async () => {
    setIsLoading(true)
    try {
      const [poRes, supRes, rmRes, prodRes] = await Promise.all([
        fetch('/api/purchase-orders'),
        fetch('/api/suppliers'),
        fetch('/api/raw-materials'),
        fetch('/api/products')
      ])
      
      if (poRes.ok) {
        const data = await poRes.json()
        setPos(data)
      }
      
      if (supRes.ok) {
        const data = await supRes.json()
        const mappedSuppliers = data.map((s: any) => ({ ...s, id: s._id }))
        setSuppliers(mappedSuppliers)
      }

      if (rmRes.ok) setRawMaterials(await rmRes.json())
      if (prodRes.ok) setProducts(await prodRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPOs = pos.filter(po => {
    const matchSearch = po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) || po.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeTab === "PENDING") return matchSearch && po.status === "Pending"
    return matchSearch
  })

  // --- Create PO Logic ---
  const handleAddItem = () => {
    if (!selectedItemSku || !itemQty || !itemCost) return
    const qty = parseFloat(itemQty)
    const cost = parseFloat(itemCost)
    if (qty <= 0 || cost < 0) return

    let itemInfo: any = null
    if (itemType === "Raw Material") {
      itemInfo = rawMaterials.find(rm => rm.sku === selectedItemSku)
    } else {
      itemInfo = products.find(p => p.sku === selectedItemSku)
    }

    if (!itemInfo) return

    let poUnit = itemInfo.unit || "Nos";
    if (poUnit === 'g') poUnit = 'Kg';
    if (poUnit === 'ml') poUnit = 'L';

    const newItem: POItem = {
      id: itemInfo.sku, 
      name: itemInfo.name, 
      category: itemInfo.category || "General", 
      unit: poUnit,
      quantity: qty, 
      unitPrice: cost, 
      totalPrice: qty * cost,
      receivedQuantity: 0 
    }
    setItems([...items, newItem])
    setSelectedItemSku(""); setItemQty(""); setItemCost("")
  }

  const handleRemoveItem = (id: string) => setItems(items.filter(i => i.id !== id))

  const handleSubmitPO = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId || items.length === 0 || !expectedDate) {
      alert("Please fill all required fields and add at least one item.")
      return
    }

    const supplierName = suppliers.find(s => s.id === supplierId)?.name || "Unknown Supplier"
    const poNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
    const totalAmount = items.reduce((acc, item) => acc + item.totalPrice, 0)
    
    const newPO = {
      poNumber, supplierName, branch,
      orderDate: new Date().toISOString(), expectedDate: new Date(expectedDate).toISOString(),
      items, totalAmount, status: "Pending"
    }

    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPO)
      })

      if (res.ok) {
        fetchPOs()
        setIsCreateOpen(false)
        setSupplierId(""); setBranch(defaultBranch); setExpectedDate(""); setItems([])
      } else {
        throw new Error('Failed to create PO')
      }
    } catch (err) {
      console.error(err)
      alert("Failed to create PO")
    }
  }

  // --- GRN Logic ---
  const openGrnModal = (po: PurchaseOrder) => {
    setSelectedPO(po)
    setReceivedBy(user?.name || "")
    setGrnNotes("")
    
    setGrnItems(po.items.map(item => {
      const remainingQty = item.quantity - (item.receivedQuantity || 0)
      return {
        id: item.id,
        receivedQty: remainingQty > 0 ? remainingQty.toString() : "0",
        damagedQty: "0"
      }
    }))
    setIsGrnOpen(true)
  }

  const updateGrnItem = (id: string, field: 'receivedQty' | 'damagedQty', value: string) => {
    setGrnItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleSubmitGRN = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPO) return

    const grnNumber = `GRN-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`
    let isCompletelyReceived = true
    let atLeastOneItemReceived = false

    const grnDocument = {
      grnNumber,
      poNumber: selectedPO.poNumber,
      supplierName: selectedPO.supplierName,
      branch: selectedPO.branch,
      receivedDate: new Date().toISOString(),
      receivedBy,
      notes: grnNotes,
      items: [] as any[]
    }

    const updatedPOItems = selectedPO.items.map(poItem => {
      const grnState = grnItems.find(g => g.id === poItem.id)
      if (!grnState) return poItem

      const newlyReceived = parseFloat(grnState.receivedQty) || 0
      const newlyDamaged = parseFloat(grnState.damagedQty) || 0
      const totalNewlyProcessed = newlyReceived + newlyDamaged
      const prevReceived = poItem.receivedQuantity || 0
      const newTotalReceived = prevReceived + totalNewlyProcessed

      if (totalNewlyProcessed > 0) {
        atLeastOneItemReceived = true
        grnDocument.items.push({
          itemName: poItem.name,
          unit: poItem.unit,
          orderedQty: poItem.quantity,
          receivedGoodQty: newlyReceived,
          damagedQty: newlyDamaged
        })
      }

      if (newTotalReceived < poItem.quantity) {
        isCompletelyReceived = false
      }

      return { ...poItem, receivedQuantity: newTotalReceived }
    })

    if (!atLeastOneItemReceived) {
      alert("Please enter at least some received quantity.")
      return
    }

    const newPOStatus = isCompletelyReceived ? "Fully Received" : "Partially Received"
    
    try {
      // 1. Update PO
      await fetch('/api/purchase-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPO._id, status: newPOStatus, items: updatedPOItems })
      })

      // 2. Save GRN
      await fetch('/api/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grnDocument)
      })

      // 3. Inject into Stock Inventory via API
      for (const poItem of selectedPO.items) {
        const grnState = grnItems.find(g => g.id === poItem.id)
        if (!grnState) continue
        
        const goodQty = parseFloat(grnState.receivedQty) || 0
        if (goodQty <= 0) continue

        // Convert PO bulk units (Kg, L) back to Inventory base units (g, ml) if needed
        let inventoryQty = goodQty;
        const originalRm = rawMaterials.find(r => r.sku === poItem.id);
        if (originalRm) {
          if (poItem.unit === 'Kg' && originalRm.unit === 'g') inventoryQty = goodQty * 1000;
          if (poItem.unit === 'L' && originalRm.unit === 'ml') inventoryQty = goodQty * 1000;
        }

        // Inventory adjustment using the actual SKU stored in poItem.id
        await fetch('/api/inventory/adjust', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branch: selectedPO.branch,
            sku: poItem.id, // Now poItem.id holds the true SKU!
            quantity: inventoryQty,
            type: 'IN', // GRN
            reference: grnNumber,
            remarks: 'GRN Received'
          })
        }).catch(err => console.error("Failed to adjust inventory for GRN", err))
      }

      fetchPOs()
      setIsGrnOpen(false)
    } catch (e) {
      console.error(e)
      alert("Failed to process GRN")
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <PackageOpen className="text-orange-500 w-6 h-6" /> Purchase Orders
          </h2>
          <p className="text-gray-500">Manage supplier orders and receive stock via GRN.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" /> Create PO
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="border-b">
          <div className="flex px-4 pt-4">
            <button
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === "ALL" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              onClick={() => setActiveTab("ALL")}
            >
              All Orders
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === "PENDING" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              onClick={() => setActiveTab("PENDING")}
            >
              Pending Arrival
            </button>
          </div>
        </div>
        
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
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
              <TableHead className="py-4">PO Number & Supplier</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-400">Loading POs...</TableCell>
              </TableRow>
            ) : filteredPOs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-400">No Purchase Orders found.</TableCell>
              </TableRow>
            ) : (
              filteredPOs.map((po) => {
                let statusColor = "bg-gray-100 text-gray-700 border-gray-200"
                if (po.status === "Pending") statusColor = "bg-blue-100 text-blue-700 border-blue-200"
                if (po.status === "Partially Received") statusColor = "bg-amber-100 text-amber-700 border-amber-200"
                if (po.status === "Fully Received") statusColor = "bg-green-100 text-green-700 border-green-200"

                return (
                  <TableRow key={po._id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="font-black text-gray-900">{po.poNumber}</div>
                      <div className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" /> {po.supplierName}
                        <span className="text-gray-300 ml-1">•</span>
                        <span className="text-xs text-gray-400">{po.branch}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-gray-500">Ord: {new Date(po.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs font-bold text-gray-700 mt-1">Exp: {new Date(po.expectedDate).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-gray-900">Rs. {po.totalAmount.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{po.items.length} items</div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusColor}`}>
                        {po.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {["Pending", "Partially Received"].includes(po.status) && (
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 h-8"
                          onClick={() => openGrnModal(po)}
                        >
                          <PackageOpen className="w-4 h-4 mr-1.5" /> Receive GRN
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- CREATE PO MODAL --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>Generate a new PO to order stock from suppliers.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPO} className="space-y-6 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={supplierId} onValueChange={(v) => setSupplierId(v || "")} required>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery Date</Label>
                <Input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Destination Branch</Label>
                <Select value={branch} onValueChange={(v) => setBranch(v || "")} disabled={!canApprove}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50/50 space-y-4">
              <h4 className="font-bold text-gray-700 text-sm">Add Items to Order</h4>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={itemType} onValueChange={(v: "Raw Material" | "Product") => { setItemType(v); setSelectedItemSku(""); }}>
                    <SelectTrigger className="px-2 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Raw Material">Raw Material</SelectItem>
                      <SelectItem value="Product">Product/Packaging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 space-y-1">
                  <Label className="text-xs">Select Item</Label>
                  <Select value={selectedItemSku} onValueChange={setSelectedItemSku}>
                    <SelectTrigger className="text-xs truncate"><SelectValue placeholder="Choose..." /></SelectTrigger>
                    <SelectContent>
                      {itemType === "Raw Material" 
                        ? rawMaterials.map(rm => {
                            let displayUnit = rm.unit;
                            if (displayUnit === 'g') displayUnit = 'Kg';
                            if (displayUnit === 'ml') displayUnit = 'L';
                            return <SelectItem key={rm.sku} value={rm.sku}>{rm.name} ({displayUnit})</SelectItem>
                          })
                        : products.map(p => <SelectItem key={p.sku} value={p.sku}>{p.name}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" min="0.1" step="0.1" value={itemQty} onChange={e => setItemQty(e.target.value)} placeholder="0" />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Unit Cost (Rs)</Label>
                  <Input type="number" min="0" step="0.01" value={itemCost} onChange={e => setItemCost(e.target.value)} placeholder="0.00" />
                </div>
                <div className="col-span-1 pb-0.5">
                  <Button type="button" size="icon" onClick={handleAddItem} className="bg-gray-900 hover:bg-gray-800 w-full" disabled={!selectedItemSku}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {items.length > 0 && (
                <div className="mt-4 border rounded-md overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="py-2 text-xs">Item</TableHead>
                        <TableHead className="py-2 text-xs text-right">Qty</TableHead>
                        <TableHead className="py-2 text-xs text-right">Unit Cost</TableHead>
                        <TableHead className="py-2 text-xs text-right">Total</TableHead>
                        <TableHead className="py-2 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="py-2 text-sm font-medium">{item.name}</TableCell>
                          <TableCell className="py-2 text-sm text-right">{item.quantity} {item.unit}</TableCell>
                          <TableCell className="py-2 text-sm text-right">{item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="py-2 text-sm text-right font-bold">{item.totalPrice.toFixed(2)}</TableCell>
                          <TableCell className="py-2">
                            <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                              <X className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={3} className="text-right font-bold text-gray-900 py-3">PO Grand Total:</TableCell>
                        <TableCell className="text-right font-black text-orange-600 text-base py-3">
                          Rs. {items.reduce((acc, i) => acc + i.totalPrice, 0).toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Submit PO</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- GRN MODAL --- */}
      <Dialog open={isGrnOpen} onOpenChange={setIsGrnOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageOpen className="w-5 h-5 text-green-600" /> Receive Goods (GRN)
            </DialogTitle>
            <DialogDescription>
              Processing delivery for <strong className="text-gray-900">{selectedPO?.poNumber}</strong> from {selectedPO?.supplierName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitGRN} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
              <div>
                <Label className="text-xs text-gray-500">Destination Branch</Label>
                <div className="font-bold text-gray-900">{selectedPO?.branch}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Received By</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    value={receivedBy} onChange={e => setReceivedBy(e.target.value)} required
                    className="pl-8 h-9 text-sm" placeholder="Staff Name"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="py-3 text-xs font-bold text-gray-700">Item</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-gray-700 text-center">Ordered</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-gray-700 text-center">Prev. Received</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-blue-700 bg-blue-50/50">Receive Good Qty</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-red-700 bg-red-50/50">Receive Damaged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPO?.items.map(item => {
                    const remainingQty = item.quantity - (item.receivedQuantity || 0)
                    const isFullyReceived = remainingQty <= 0
                    const grnState = grnItems.find(g => g.id === item.id)

                    return (
                      <TableRow key={item.id} className={isFullyReceived ? "bg-gray-50/50 opacity-60" : ""}>
                        <TableCell className="py-3">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-gray-500">Unit: {item.unit}</div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">{item.quantity}</TableCell>
                        <TableCell className="text-center font-mono text-sm text-gray-600">{item.receivedQuantity || 0}</TableCell>
                        <TableCell className="bg-blue-50/20">
                          <Input 
                            type="number" min="0" step="0.01" 
                            disabled={isFullyReceived}
                            value={grnState?.receivedQty || ""}
                            onChange={e => updateGrnItem(item.id, 'receivedQty', e.target.value)}
                            className="w-24 mx-auto text-center h-8 font-mono border-blue-200 focus-visible:ring-blue-500"
                          />
                        </TableCell>
                        <TableCell className="bg-red-50/20">
                          <Input 
                            type="number" min="0" step="0.01"
                            disabled={isFullyReceived}
                            value={grnState?.damagedQty || ""}
                            onChange={e => updateGrnItem(item.id, 'damagedQty', e.target.value)}
                            className="w-24 mx-auto text-center h-8 font-mono border-red-200 focus-visible:ring-red-500"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            
            <div className="space-y-2">
              <Label>Delivery Notes / Invoice Number</Label>
              <Input 
                value={grnNotes} onChange={e => setGrnNotes(e.target.value)}
                placeholder="e.g. INV-10023, Vehicle No: WP-2342"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGrnOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">Confirm & Add to Stock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
