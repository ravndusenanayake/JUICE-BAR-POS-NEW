"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Archive } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export default function ProductVariantsPage() {
  const [variants, setVariants] = useState<any[]>([])
  const [productsList, setProductsList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingVariant, setEditingVariant] = useState<any>(null)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form State
  const [productId, setProductId] = useState("")
  const [name, setName] = useState("")
  const [sellingPrice, setSellingPrice] = useState("")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetchVariants()
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = await res.json()
        setProductsList(data)
      }
    } catch (e) {
      console.error("Failed to fetch products:", e)
    }
  }

  const fetchVariants = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/product-variants')
      if (res.ok) {
        const data = await res.json()
        const mapped = data.map((v: any) => ({
          ...v,
          id: v._id
        }))
        setVariants(mapped)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredVariants = variants.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (v.productId?.name && v.productId.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const saveVariant = async () => {
    if(!name || !productId || !sellingPrice) return alert("Please fill all required fields")

    setIsSaving(true)
    try {
      if (editingVariant) {
        const payload = {
          id: editingVariant.id, productId, name, sellingPrice: Number(sellingPrice), status: isActive
        }
        
        const res = await fetch('/api/product-variants', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if(res.ok) {
          fetchVariants()
          setIsDialogOpen(false)
          resetForm()
        } else {
          alert("Failed to update variant")
        }
      } else {
        const payload = {
          productId, name, sellingPrice: Number(sellingPrice), status: isActive
        }
        
        const res = await fetch('/api/product-variants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (res.ok) {
          fetchVariants()
          setIsDialogOpen(false)
          resetForm()
        } else {
          const err = await res.json()
          alert("Failed to save variant: " + (err.error || ""))
        }
      }
    } catch (error) {
      console.error("Error saving variant:", error)
      alert("Error saving variant")
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setProductId("")
    setName("")
    setSellingPrice("")
    setIsActive(true)
    setEditingVariant(null)
  }

  const handleEdit = (v: any) => {
    setEditingVariant(v)
    setProductId(v.productId?._id || "")
    setName(v.name)
    setSellingPrice(v.sellingPrice.toString())
    setIsActive(v.status === 'Active')
    setIsDialogOpen(true)
  }

  const archiveVariant = async (id: string) => {
    if(confirm("Are you sure you want to archive this variant? It will be marked as Inactive.")) {
      try {
        const res = await fetch(`/api/product-variants`, { 
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: false })
        })
        if (res.ok) {
          fetchVariants()
        } else {
          alert("Failed to archive variant")
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Variants</h2>
          <p className="text-muted-foreground">Manage selling sizes and prices for your products.</p>
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Add Variant
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingVariant ? "Edit Variant" : "Add New Variant"}</DialogTitle>
              <DialogDescription>Define a specific size/variant and its price for a master product.</DialogDescription>
            </DialogHeader>
              
              <div className="grid gap-6 py-4 px-2">
                
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-700">Product <span className="text-red-500">*</span></Label>
                  <Select value={productId} onValueChange={(val) => setProductId(val || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a master product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsList.length === 0 ? (
                        <SelectItem value="none" disabled>No products found</SelectItem>
                      ) : (
                        productsList.map(prod => (
                          <SelectItem key={prod._id} value={prod._id}>{prod.name} ({prod.category})</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">Variant Name <span className="text-red-500">*</span></Label>
                    <Input placeholder="e.g. Medium" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">Price (Rs.) <span className="text-red-500">*</span></Label>
                    <Input type="number" placeholder="e.g. 250" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required min="0" step="0.01" />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4 mt-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <p className="text-xs text-muted-foreground">Active variants are available for sale.</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-green-500" />
                </div>
              </div>
              
              <DialogFooter className="mt-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                <Button onClick={saveVariant} disabled={isSaving}>
                  {isSaving ? "Saving..." : (editingVariant ? "Save Changes" : "Create Variant")}
                </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search variants..." 
              className="pl-9 bg-gray-50 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <TableHead>Master Product</TableHead>
              <TableHead>Variant Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading variants...</TableCell>
              </TableRow>
            ) : filteredVariants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No variants found.
                </TableCell>
              </TableRow>
            ) : filteredVariants.map((v) => (
              <TableRow key={v.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell>
                  <div className="font-semibold text-gray-800 uppercase text-sm">
                    {v.productId?.name || "Unknown Product"}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-gray-700">{v.name}</span>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-gray-900">Rs. {v.sellingPrice?.toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${v.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {v.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(v)}>
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Archive" onClick={() => archiveVariant(v.id)} disabled={v.status === 'Inactive'}>
                      <Archive className="h-4 w-4 text-orange-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
