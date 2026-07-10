"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Box, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { logAudit } from "@/lib/auditLogger"
import { useAuth } from "@/context/AuthContext"

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = await res.json()
        const mapped = data.map((p: any) => ({
          ...p,
          id: p._id
        }))
        setProducts(mapped)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form State
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [category, setCategory] = useState("")
  const [type, setType] = useState("")
  const [threshold, setThreshold] = useState("")
  const [unit, setUnit] = useState("")
  const [cost, setCost] = useState("")
  const [outletPrice, setOutletPrice] = useState("")
  const [pickmePrice, setPickmePrice] = useState("")
  const [uberPrice, setUberPrice] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [selectedAddons, setSelectedAddons] = useState<number[]>([])

  // Variants State
  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants] = useState<{name: string, sku: string, outletPrice: string, pickmePrice: string, uberPrice: string}[]>([])

  const addVariant = () => {
    setVariants([...variants, { name: "", sku: "", outletPrice: "", pickmePrice: "", uberPrice: "" }])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: string, value: string) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  const AVAILABLE_ADDONS = [
    { id: 1, name: "Ice Cream Scoop" },
    { id: 2, name: "Bee Honey" },
    { id: 3, name: "Chia Seeds" },
    { id: 4, name: "Protein Powder" }
  ]

  const toggleAddon = (id: number) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const saveProduct = async () => {
    if(!name || !category || !outletPrice || !sku) return alert("Please fill all required fields")

    setIsSaving(true)
    try {
      if (editingProduct) {
        const payload = {
          id: editingProduct.id, name, category, outletPrice: Number(outletPrice), 
          status: isActive, sku, type, pickmePrice: Number(pickmePrice), uberPrice: Number(uberPrice)
        }
        
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if(res.ok) {
          fetchProducts()
          setIsDialogOpen(false)
          resetForm()
        } else {
          alert("Failed to update product")
        }
      } else {
        const payload = {
          name, category, outletPrice: Number(outletPrice), status: isActive, sku, type, pickmePrice: Number(pickmePrice), uberPrice: Number(uberPrice)
        }
        
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (res.ok) {
          fetchProducts()
          setIsDialogOpen(false)
          resetForm()
        } else {
          const err = await res.json()
          alert("Failed to save product in Database: " + (err.error || ""))
        }
      }
    } catch (error) {
      console.error("Error saving product:", error)
      alert("Error saving product")
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setName("")
    setSku("")
    setCategory("")
    setType("")
    setThreshold("")
    setUnit("")
    setCost("")
    setOutletPrice("")
    setPickmePrice("")
    setUberPrice("")
    setIsActive(true)
    setSelectedAddons([])
    setHasVariants(false)
    setVariants([])
    setEditingProduct(null)
  }

  const handleEdit = (p: any) => {
    setEditingProduct(p)
    setName(p.name)
    setSku(p.sku)
    setCategory(p.category)
    setType(p.type)
    setOutletPrice(p.outletPrice?.toString() || "")
    setPickmePrice(p.pickmePrice?.toString() || "")
    setUberPrice(p.uberPrice?.toString() || "")
    setIsActive(p.status === 'Active')
    setIsDialogOpen(true)
  }

  const deleteProduct = async (id: string) => {
    if(confirm("Are you sure you want to delete this product?")) {
      try {
        const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
          fetchProducts()
        } else {
          alert("Failed to delete product")
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
          <h2 className="text-2xl font-bold tracking-tight">All Products</h2>
          <p className="text-muted-foreground">Manage your products, pricing, and variants.</p>
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
              
              <div className="grid gap-6 py-4 max-h-[65vh] overflow-y-auto px-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">Product Name *</Label>
                    <Input placeholder="e.g. Espresso Standard" value={name} onChange={(e) => setName(e.target.value)} required className="border-gray-300" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">SKU *</Label>
                    <Input placeholder="e.g. ES1200" value={sku} onChange={(e) => setSku(e.target.value)} required className="border-gray-300" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">Category *</Label>
                    <Select value={category} onValueChange={(val) => setCategory(val || "")}>
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cakes">Cakes</SelectItem>
                        <SelectItem value="Cold Beverages">Cold Beverages</SelectItem>
                        <SelectItem value="Snacks">Snacks</SelectItem>
                        <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">Product Type *</Label>
                    <Select value={type} onValueChange={(val) => setType(val || "")}>
                      <SelectTrigger className="border-gray-300 border-orange-400 focus:ring-orange-400">
                        <SelectValue placeholder="Select Product Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Recipe Based">Recipe Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">Threshold *</Label>
                    <Input type="number" placeholder="Enter threshold (e.g., 10)" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="border-gray-300" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">Unit *</Label>
                    <Select value={unit} onValueChange={(val) => setUnit(val || "")}>
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nos">Nos</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="Liters">Liters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">Cost (Rs.) *</Label>
                    <Input type="number" step="0.01" placeholder="Enter cost (e.g., 120.50)" value={cost} onChange={(e) => setCost(e.target.value)} className="border-gray-300" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">Outlet Price (Rs.) *</Label>
                    <Input type="number" step="0.01" placeholder="Enter outlet price (e.g., 200.00)" value={outletPrice} onChange={(e) => setOutletPrice(e.target.value)} className="border-gray-300" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">PickMe Price (Rs.) *</Label>
                    <Input type="number" step="0.01" placeholder="Enter PickMe price (e.g., 220.00)" value={pickmePrice} onChange={(e) => setPickmePrice(e.target.value)} className="border-gray-300" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">Uber Price (Rs.) *</Label>
                    <Input type="number" step="0.01" placeholder="Enter Uber price (e.g., 225.00)" value={uberPrice} onChange={(e) => setUberPrice(e.target.value)} className="border-gray-300" />
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-gray-50/50 mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium text-gray-700">Product Variants</Label>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-500">Has Variants?</Label>
                      <Switch checked={hasVariants} onCheckedChange={setHasVariants} className="data-[state=checked]:bg-orange-500" />
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-gray-50/50 mt-2">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Applicable Add-Ons</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_ADDONS.map(addon => (
                      <label key={addon.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-2 rounded">
                        <input type="checkbox" className="rounded border-gray-300 text-orange-500" checked={selectedAddons.includes(addon.id)} onChange={() => toggleAddon(addon.id)} />
                        {addon.name}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-orange-500" />
                </div>
              </div>
              
              <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                <Button onClick={saveProduct} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600 text-white">
                  {isSaving ? "Saving..." : (editingProduct ? "Save Changes" : "Create Product")}
                </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter and Table Section */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search products..." 
              className="pl-9 bg-gray-50 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-600">Products List ({filteredProducts.length})</h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <TableHead className="py-3">Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Outlet Price</TableHead>
              <TableHead>Delivery Prices</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading products...</TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : filteredProducts.map((p) => (
              <TableRow key={p.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell className="py-4">
                  <div className="font-semibold text-gray-800 uppercase text-sm">
                    {p.name}
                    {p.hasVariants && p.variants && p.variants.length > 0 && (
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-2 align-middle">
                        {p.variants.length} Variants
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{p.sku}</div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{p.category}</span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
                    <Box className="h-3 w-3" />
                    {p.type}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">LKR {p.outletPrice?.toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-gray-500">Pick Me: LKR {p.pickmePrice?.toFixed(2) || p.outletPrice?.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Uber: LKR {p.uberPrice?.toFixed(2) || p.outletPrice?.toFixed(2)}</div>
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium ${p.status === 'Active' ? 'text-green-500' : 'text-gray-400'}`}>
                    {p.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(p)}>
                      <Edit className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => deleteProduct(p.id)}>
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
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
