"use client"

import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, PackageOpen, CheckCircle, Package } from "lucide-react"

export default function CreateGRNPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <CreateGRNContent />
    </Suspense>
  )
}

function CreateGRNContent() {
  const { user, role } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const initialPoId = searchParams.get('poId') || ""
  
  const [pos, setPos] = useState<any[]>([])
  const [selectedPOId, setSelectedPOId] = useState(initialPoId)
  const [selectedPO, setSelectedPO] = useState<any>(null)
  
  const [grnNumber, setGrnNumber] = useState("")
  const [receivedBy, setReceivedBy] = useState(user?.name || "")
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState("")
  
  const [grnItems, setGrnItems] = useState<any[]>([])
  const [rawMaterials, setRawMaterials] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  useEffect(() => {
    fetchPOs()
    fetchRawMaterials()
  }, [])

  const fetchPOs = async () => {
    try {
      const res = await fetch('/api/purchase-orders')
      if (res.ok) {
        const data = await res.json()
        // Only show Approved or Partially Received POs
        setPos(data.filter((po: any) => ["Approved", "Partially Received", "Pending"].includes(po.status)))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchRawMaterials = async () => {
    try {
      const res = await fetch('/api/raw-materials')
      if (res.ok) setRawMaterials(await res.json())
    } catch (e) {
      console.error(e)
    }
  }

  // Set initial GRN number
  useEffect(() => {
    setGrnNumber(`GRN-${Date.now().toString().slice(-9)}`)
  }, [])

  // Handle PO selection
  useEffect(() => {
    if (!selectedPOId) {
      setSelectedPO(null)
      setGrnItems([])
      return
    }
    
    const po = pos.find(p => p._id === selectedPOId)
    setSelectedPO(po)
    
    if (po) {
      const initialItems = po.items.map((item: any) => {
        const remaining = item.quantity - (item.receivedQuantity || 0)
        return {
          id: item.id,
          name: item.name,
          unit: item.unit,
          orderedQty: item.quantity,
          prevReceived: item.receivedQuantity || 0,
          receivedGoodQty: remaining > 0 ? remaining : 0,
          damagedQty: 0,
          unitPrice: item.unitPrice || 0,
          expiryDate: ""
        }
      })
      setGrnItems(initialItems)
    }
  }, [selectedPOId, pos])

  const updateItem = (id: string, field: string, value: string | number) => {
    setGrnItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPO || isSubmitting) return

    setIsSubmitting(true)
    let atLeastOne = false
    let isCompletelyReceived = true
    
    const finalItems = grnItems.map(item => {
      const goodQty = parseFloat(item.receivedGoodQty) || 0
      const damagedQty = parseFloat(item.damagedQty) || 0
      const totalProcessed = goodQty + damagedQty
      
      if (totalProcessed > 0) atLeastOne = true
      
      if (item.prevReceived + totalProcessed < item.orderedQty) {
        isCompletelyReceived = false
      }
      
      return {
        ...item,
        itemName: item.name,
        receivedGoodQty: goodQty,
        damagedQty: damagedQty,
        unitPrice: parseFloat(item.unitPrice) || 0,
        totalPrice: goodQty * (parseFloat(item.unitPrice) || 0)
      }
    }).filter(i => (i.receivedGoodQty + i.damagedQty) > 0)

    if (!atLeastOne) {
      alert("Please receive at least one item.")
      return
    }

    const totalAmount = finalItems.reduce((acc, item) => acc + item.totalPrice, 0)
    
    const grnDocument = {
      grnNumber,
      poNumber: selectedPO.poNumber,
      supplierName: selectedPO.supplierName,
      branch: selectedPO.branch,
      receivedDate: new Date(receivedDate).toISOString(),
      receivedBy,
      notes,
      items: finalItems,
      totalAmount,
      paidAmount: 0,
      paymentStatus: 'Unpaid'
    }

    try {
      // 1. Save GRN
      const grnRes = await fetch('/api/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grnDocument)
      })

      if (!grnRes.ok) throw new Error("Failed to save GRN")
      const savedGrn = await grnRes.json()
      const finalGrnNumber = savedGrn.grnNumber || grnNumber

      // 2. Update PO Status
      const newPOStatus = isCompletelyReceived ? "Fully Received" : "Partially Received"
      const updatedPOItems = selectedPO.items.map((poItem: any) => {
        const grnItem = finalItems.find(g => g.id === poItem.id)
        if (!grnItem) return poItem
        return {
          ...poItem,
          receivedQuantity: (poItem.receivedQuantity || 0) + grnItem.receivedGoodQty + grnItem.damagedQty
        }
      })

      await fetch('/api/purchase-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPO._id, status: newPOStatus, items: updatedPOItems })
      })

      // 3. Update Inventory
      for (const item of finalItems) {
        if (item.receivedGoodQty <= 0) continue

        let inventoryQty = item.receivedGoodQty
        const originalRm = rawMaterials.find(r => r.sku === item.id)
        if (originalRm) {
          if (item.unit === 'Kg' && originalRm.unit === 'g') inventoryQty = item.receivedGoodQty * 1000
          if (item.unit === 'L' && originalRm.unit === 'ml') inventoryQty = item.receivedGoodQty * 1000
        }

        await fetch('/api/inventory/adjust', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branch: selectedPO.branch,
            sku: item.id, 
            quantity: inventoryQty,
            type: 'IN', 
            reference: finalGrnNumber,
            remarks: 'GRN Received'
          })
        }).catch(err => console.error("Failed to adjust inventory", err))
      }

      alert("GRN Created Successfully!")
      router.push('/dashboard/grn/all')
      
    } catch (error) {
      console.error(error)
      alert("Failed to process GRN")
      setIsSubmitting(false)
    }
  }

  const completedCount = grnItems.filter(i => i.prevReceived + parseFloat(i.receivedGood || 0) + parseFloat(i.damagedQty || 0) >= i.orderedQty).length
  const partialCount = grnItems.filter(i => {
    const total = i.prevReceived + parseFloat(i.receivedGood || 0) + parseFloat(i.damagedQty || 0);
    return total > 0 && total < i.orderedQty;
  }).length
  const incompleteCount = grnItems.filter(i => i.prevReceived + parseFloat(i.receivedGood || 0) + parseFloat(i.damagedQty || 0) === 0).length

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <FileText className="text-orange-500 w-6 h-6" /> Goods Receipt Note
        </h2>
        <Button onClick={handleSubmit} disabled={!selectedPO || isSubmitting} className="bg-orange-600 hover:bg-orange-700">
          <CheckCircle className="w-4 h-4 mr-2" /> {isSubmitting ? "Processing..." : "Complete GRN"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-800">
              <FileText className="w-4 h-4" /> GRN Details
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">GRN Number *</Label>
                <Input value={grnNumber} readOnly className="bg-gray-50 text-gray-600" />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Purchase Orders *</Label>
                <p className="text-[10px] text-gray-500 leading-tight mb-1">(Pending and Approved POs available for GRN creation)</p>
                <Select value={selectedPOId} onValueChange={(val) => setSelectedPOId(val || "")}>
                  <SelectTrigger className="border-gray-300 shadow-sm">
                    <SelectValue placeholder="Select purchase order" />
                  </SelectTrigger>
                  <SelectContent>
                    {pos.map(po => (
                      <SelectItem key={po._id} value={po._id}>
                        {po.poNumber} - {po.supplierName} - {po.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Received By *</Label>
                <Input value={receivedBy} onChange={e => setReceivedBy(e.target.value)} placeholder="Enter receiver name" className="shadow-sm" />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Received Date *</Label>
                <Input type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} className="shadow-sm" />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Notes</Label>
                <textarea 
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Any discrepancies, damages, or special notes..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-800">
              Receipt Summary
            </h3>
            
            <div className="flex justify-between items-center px-4 pb-4 border-b">
              <div className="text-center">
                <div className="text-xs font-semibold text-gray-500">Complete:</div>
                <div className="text-xl font-bold text-green-600">{selectedPO ? completedCount : 0}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-gray-500">Partial:</div>
                <div className="text-xl font-bold text-blue-600">{selectedPO ? partialCount : 0}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-gray-500">Incomplete:</div>
                <div className="text-xl font-bold text-red-600">{selectedPO ? incompleteCount : 0}</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm font-semibold text-gray-700">Items Status:</div>
              <div className="text-sm font-black">
                {selectedPO ? `${completedCount + partialCount} / ${grnItems.length} processed` : '0 / 0 processed'}
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">{selectedPO ? grnItems.length : 0} total items</div>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm min-h-[300px]">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-800">
              <Package className="w-4 h-4" /> Received Items
            </h3>
            
            {!selectedPO ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-3">
                <PackageOpen className="w-12 h-12 opacity-20" />
                <p>Select a purchase order to view items</p>
              </div>
            ) : (
              <div className="space-y-4">
                {grnItems.map((item, idx) => {
                  const lineTotal = parseFloat(item.receivedGoodQty || 0) * parseFloat(item.unitPrice || 0)
                  return (
                    <div key={item.id} className="border rounded-lg p-4 bg-gray-50/30">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-gray-900">{item.name} - {item.id}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Ordered: {item.orderedQty} {item.unit} • Prev Received: {item.prevReceived} {item.unit}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Received Quantity</Label>
                          <Input type="number" min="0" step="0.01" value={item.receivedGoodQty} onChange={e => updateItem(item.id, 'receivedGoodQty', e.target.value)} className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Unit Price</Label>
                          <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', e.target.value)} className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Expiry Date</Label>
                          <Input type="date" value={item.expiryDate} onChange={e => updateItem(item.id, 'expiryDate', e.target.value)} className="bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Damaged Quantity</Label>
                          <Input type="number" min="0" step="0.01" value={item.damagedQty} onChange={e => updateItem(item.id, 'damagedQty', e.target.value)} className="bg-white border-red-200 focus-visible:ring-red-500" />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-sm font-semibold text-gray-600">Total:</span>
                        <span className="font-bold text-gray-900">Rs. {lineTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  )
                })}
                
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <span className="font-bold text-orange-900">Total Amount:</span>
                  <span className="text-xl font-black text-orange-600">
                    Rs. {grnItems.reduce((acc, item) => acc + (parseFloat(item.receivedGoodQty || 0) * parseFloat(item.unitPrice || 0)), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
