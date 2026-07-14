"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Archive, Trash2, Image as ImageIcon, X, CheckSquare, Square } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/context/AuthContext"

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [categoriesList, setCategoriesList] = useState<any[]>([])
  const [allVariants, setAllVariants] = useState<any[]>([])
  const [globalAddons, setGlobalAddons] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form State
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState("")
  const [outletPrice, setOutletPrice] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Variant & Add-on State
  const [formVariants, setFormVariants] = useState<{id?: string, name: string, sellingPrice: string}[]>([])
  const [formAddons, setFormAddons] = useState<{name: string, price: number}[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [prodRes, catRes, varRes, addonRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories?active=true'),
        fetch('/api/product-variants'),
        fetch('/api/add-ons')
      ])
      
      if (prodRes.ok) {
        const data = await prodRes.json()
        setProducts(data.map((p: any) => ({ ...p, id: p._id })))
      }
      if (catRes.ok) setCategoriesList(await catRes.json())
      if (varRes.ok) setAllVariants(await varRes.json())
      if (addonRes.ok) {
        const addons = await addonRes.json()
        setGlobalAddons(addons.filter((a: any) => a.status === 'Active'))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // --- Variants Handlers ---
  const addVariantRow = () => {
    setFormVariants([...formVariants, { name: "", sellingPrice: "" }])
  }

  const updateVariantRow = (index: number, field: string, value: string) => {
    const newVars = [...formVariants]
    newVars[index] = { ...newVars[index], [field]: value }
    setFormVariants(newVars)
  }

  const removeVariantRow = async (index: number) => {
    const variant = formVariants[index]
    if (variant.id) {
      if(confirm("Are you sure you want to delete this variant? It will be permanently removed.")) {
        try {
          await fetch(`/api/product-variants?id=${variant.id}`, { method: 'DELETE' })
        } catch (e) {
          console.error(e)
        }
      } else {
        return // Cancelled
      }
    }
    const newVars = [...formVariants]
    newVars.splice(index, 1)
    setFormVariants(newVars)
  }

  // --- Add-ons Handlers ---
  const toggleAddon = (addon: any) => {
    const exists = formAddons.find(a => a.name === addon.name)
    if (exists) {
      setFormAddons(formAddons.filter(a => a.name !== addon.name))
    } else {
      setFormAddons([...formAddons, { name: addon.name, price: addon.price }])
    }
  }

  const saveProduct = async () => {
    if(!name || !category) return alert("Please fill Product Name and Category")

    // Validate variants
    for (let v of formVariants) {
      if (!v.name || !v.sellingPrice) {
        return alert("Please fill all Variant names and prices, or remove empty rows.")
      }
    }

    setIsSaving(true)
    try {
      let savedProductId = ""

      if (editingProduct) {
        const payload = {
          id: editingProduct.id, name, category, description, image,
          status: isActive, sku, outletPrice: Number(outletPrice) || 0,
          addons: formAddons
        }
        
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if(!res.ok) throw new Error("Failed to update product")
        savedProductId = editingProduct.id
      } else {
        const payload = {
          name, category, description, image, status: isActive, outletPrice: Number(outletPrice) || 0,
          addons: formAddons
        }
        
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (!res.ok) {
          const err = await res.json()
          throw new Error("Failed to save product: " + (err.error || ""))
        }
        const data = await res.json()
        savedProductId = data._id
      }

      // Save Variants
      for (let v of formVariants) {
        if (v.id) {
          // Update existing
          await fetch('/api/product-variants', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: v.id, productId: savedProductId, name: v.name, sellingPrice: Number(v.sellingPrice), status: isActive })
          })
        } else {
          // Create new
          await fetch('/api/product-variants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: savedProductId, name: v.name, sellingPrice: Number(v.sellingPrice), status: true })
          })
        }
      }

      await fetchData()
      setIsDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error("Error saving product:", error)
      alert(error.message || "Error saving product")
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setName("")
    setSku("")
    setCategory("")
    setDescription("")
    setImage("")
    setOutletPrice("")
    setIsActive(true)
    setEditingProduct(null)
    setFormVariants([])
    setFormAddons([])
  }

  const handleEdit = (p: any) => {
    setEditingProduct(p)
    setName(p.name)
    setSku(p.sku)
    setCategory(p.category)
    setDescription(p.description || "")
    setImage(p.image || "")
    setOutletPrice(p.outletPrice?.toString() || "")
    setIsActive(p.status === 'Active')
    setFormAddons(p.addons || [])
    
    // Load variants
    const productVars = allVariants.filter(v => v.productId && (v.productId._id === p.id || v.productId === p.id))
    setFormVariants(productVars.map(v => ({ id: v._id, name: v.name, sellingPrice: v.sellingPrice.toString() })))
    
    setIsDialogOpen(true)
  }

  const archiveProduct = async (id: string) => {
    if(confirm("Are you sure you want to archive this product? It will be marked as Inactive.")) {
      try {
        const res = await fetch(`/api/products`, { 
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: false })
        })
        if (res.ok) {
          fetchData()
        } else {
          alert("Failed to archive product")
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const deleteProduct = async (id: string) => {
    if(confirm("Are you sure you want to permanently delete this product?")) {
      try {
        const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
          fetchData()
        } else {
          alert("Failed to delete product")
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products (Master Data)</h2>
          <p className="text-muted-foreground">Manage master products globally across all branches.</p>
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Create Product
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[750px]">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingProduct ? "Edit Product" : "Create New Product"}</DialogTitle>
              <DialogDescription>Products are master data and shared across all branches.</DialogDescription>
            </DialogHeader>
              
              <div className="grid gap-6 py-4 px-2 max-h-[75vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
                
                <div className="flex flex-col items-center justify-center gap-4 mb-2">
                  <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative">
                    {image ? (
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <input type="file" id="imageUpload" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <Label htmlFor="imageUpload" className="cursor-pointer text-sm font-medium text-primary hover:underline">
                      Upload Image
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">Product Name <span className="text-red-500">*</span></Label>
                    <Input placeholder="e.g. Classic Mojito" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">SKU (Auto-Generated)</Label>
                    <Input value={sku} readOnly placeholder="Will be auto-generated" className="bg-gray-100 text-gray-500 cursor-not-allowed" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></Label>
                  <Select value={category} onValueChange={(val) => setCategory(val || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesList.length === 0 ? (
                        <SelectItem value="none" disabled>No active categories found</SelectItem>
                      ) : (
                        categoriesList.map(cat => (
                          <SelectItem key={cat._id} value={cat.name}>{cat.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 border-t pt-4">
                  <h3 className="font-semibold text-gray-800">Pricing Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium text-gray-700">Base Price (Rs.)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        placeholder="e.g. 350.00" 
                        value={outletPrice} 
                        onChange={(e) => setOutletPrice(e.target.value)} 
                      />
                      <p className="text-xs text-muted-foreground">Default selling price if no variants.</p>
                    </div>
                  </div>
                </div>

                {/* Variants Section */}
                <div className="grid gap-3 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-800">Variants (Sizes & Prices)</h3>
                      <p className="text-xs text-muted-foreground">Add specific sizes and their prices (e.g., Small, Large).</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={addVariantRow} className="h-8">
                      <Plus className="w-4 h-4 mr-1" /> Add Variant
                    </Button>
                  </div>

                  {formVariants.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {formVariants.map((variant, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border">
                          <div className="flex-1">
                            <Input 
                              placeholder="Name (e.g. Small)" 
                              className="h-8 text-sm"
                              value={variant.name} 
                              onChange={e => updateVariantRow(idx, 'name', e.target.value)} 
                            />
                          </div>
                          <div className="flex-1">
                            <Input 
                              type="number" step="0.01" min="0" placeholder="Price (Rs.)" 
                              className="h-8 text-sm"
                              value={variant.sellingPrice} 
                              onChange={e => updateVariantRow(idx, 'sellingPrice', e.target.value)} 
                            />
                          </div>
                          <Button type="button" size="icon" variant="ghost" onClick={() => removeVariantRow(idx)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic py-2">No variants added. Product will use Base Price.</div>
                  )}
                </div>

                {/* Add-ons Section */}
                <div className="grid gap-3 border-t pt-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">Applicable Add-ons</h3>
                    <p className="text-xs text-muted-foreground">Select which add-ons customers can choose for this product.</p>
                  </div>
                  
                  {globalAddons.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                      {globalAddons.map(addon => {
                        const isSelected = formAddons.some(a => a.name === addon.name)
                        return (
                          <div 
                            key={addon._id} 
                            onClick={() => toggleAddon(addon)}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-orange-50 border-orange-200' : 'bg-white hover:bg-gray-50'}`}
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4 text-orange-500 shrink-0" /> : <Square className="w-4 h-4 text-gray-300 shrink-0" />}
                            <div className="flex flex-col min-w-0">
                              <span className={`text-sm font-semibold truncate ${isSelected ? 'text-orange-900' : 'text-gray-700'}`}>{addon.name}</span>
                              <span className="text-xs text-gray-500">Rs. {addon.price.toFixed(2)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic py-2">No active add-ons found in Master Data. Please create Add-ons first.</div>
                  )}
                </div>
                
                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <p className="text-xs text-muted-foreground">Active products are available for sale.</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-green-500" />
                </div>
              </div>
              
              <DialogFooter className="mt-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                <Button onClick={saveProduct} disabled={isSaving}>
                  {isSaving ? "Saving..." : (editingProduct ? "Save Changes" : "Create Product")}
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
              placeholder="Search products..." 
              className="pl-9 bg-gray-50 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading products...</TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : filteredProducts.map((p) => (
              <TableRow key={p.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell>
                  <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-gray-800 uppercase text-sm">
                    {p.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{p.sku}</div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{p.category}</span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(p)}>
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Archive" onClick={() => archiveProduct(p.id)} disabled={p.status === 'Inactive'}>
                      <Archive className="h-4 w-4 text-orange-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => deleteProduct(p.id)}>
                      <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
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
