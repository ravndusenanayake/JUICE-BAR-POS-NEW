"use client"
import { toast } from 'sonner';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Edit, Archive, Trash2, Image as ImageIcon, X, CheckSquare, Square, Eye } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/context/AuthContext"
import Swal from 'sweetalert2'

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [categoriesList, setCategoriesList] = useState<any[]>([])
  const [allVariants, setAllVariants] = useState<any[]>([])
  const [globalAddons, setGlobalAddons] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [viewingProduct, setViewingProduct] = useState<any>(null)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("All")
  const [filterType, setFilterType] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")

  // Form State
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [category, setCategory] = useState("")
  const [type, setType] = useState("Made to Order")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState("")
  const [outletPrice, setOutletPrice] = useState("")
  const [cost, setCost] = useState("")
  const [unit, setUnit] = useState("Nos")
  const [threshold, setThreshold] = useState("0")
  const [isActive, setIsActive] = useState(true)
  const [requiresRecipe, setRequiresRecipe] = useState(false)

  // Variant & Add-on State
  const [formVariants, setFormVariants] = useState<{id?: string, name: string, sellingPrice: string, costPrice: string}[]>([])
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesCategory = filterCategory === "All" || p.category === filterCategory;
    const matchesStatus = filterStatus === "All" || p.status === filterStatus;
    
    let matchesType = true;
    if (filterType === "Recipe") matchesType = p.type !== 'Finished Good' && p.stockType !== 'Non-Inventory';
    if (filterType === "No Recipe") matchesType = p.stockType === 'Non-Inventory';
    if (filterType === "Finished Good") matchesType = p.type === 'Finished Good';

    return matchesSearch && matchesCategory && matchesStatus && matchesType;
  })

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
    setFormVariants([...formVariants, { name: "", sellingPrice: "", costPrice: "" }])
  }

  const updateVariantRow = (index: number, field: string, value: string) => {
    const newVars = [...formVariants]
    newVars[index] = { ...newVars[index], [field]: value }
    setFormVariants(newVars)
  }

  const confirmRemoveVariant = async (index: number) => {
    const variant = formVariants[index]
    if (variant.id) {
      const result = await Swal.fire({
        title: 'Delete Variant?',
        text: 'Are you sure you want to delete this variant? It will be permanently removed.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ea580c',
        cancelButtonColor: '#9ca3af',
        confirmButtonText: 'Yes, Delete Variant'
      })

      if (result.isConfirmed) {
        try {
          await fetch(`/api/product-variants?id=${variant.id}`, { method: 'DELETE' })
          const newVars = [...formVariants]
          newVars.splice(index, 1)
          setFormVariants(newVars)
          Swal.fire('Deleted!', 'Variant removed.', 'success')
        } catch(err) {
          console.error(err)
        }
      }
    } else {
      const newVars = [...formVariants]
      newVars.splice(index, 1)
      setFormVariants(newVars)
    }
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
    if(!name) return toast.error("Please fill Product Name")

    // Validate variants if Made to Order
    if (type === "Made to Order") {
      for (let v of formVariants) {
        if (!v.name || !v.sellingPrice) {
          return toast.error("Please fill all Variant names and prices, or remove empty rows.")
        }
      }
      if (formVariants.length === 0 && !outletPrice) {
         return toast.error("Please provide a Base Price or add at least one Variant.")
      }
    } else {
      if (!outletPrice) return toast.error("Please provide a Base Price.")
    }

    setIsSaving(true)
    try {
      let savedProductId = ""

      if (editingProduct) {
        const payload = {
          id: editingProduct.id, name, category: category || "General", type, description, image,
          status: isActive, sku, outletPrice: Number(outletPrice) || 0, cost: Number(cost) || 0,
          unit, threshold: Number(threshold) || 0,
          addons: type === "Made to Order" ? formAddons : [],
          stockType: type === "Made to Order" ? (requiresRecipe ? 'Recipe' : 'Non-Inventory') : 'Inventory'
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
          name, category: category || "General", type, description, image, status: isActive, outletPrice: Number(outletPrice) || 0, cost: Number(cost) || 0,
          unit, threshold: Number(threshold) || 0,
          addons: type === "Made to Order" ? formAddons : [],
          stockType: type === "Made to Order" ? (requiresRecipe ? 'Recipe' : 'Non-Inventory') : 'Inventory'
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

      // Save Variants for all product types
      for (let v of formVariants) {
        if (v.id) {
          // Update existing
          await fetch('/api/product-variants', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: v.id, productId: savedProductId, name: v.name, sellingPrice: Number(v.sellingPrice), costPrice: Number(v.costPrice) || 0, status: isActive })
          })
        } else {
          // Create new
          await fetch('/api/product-variants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: savedProductId, name: v.name, sellingPrice: Number(v.sellingPrice), costPrice: Number(v.costPrice) || 0, status: true })
          })
        }
      }

      await fetchData()
      setIsDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error("Error saving product:", error)
      toast.error(error.message || "Error saving product")
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setName("")
    setSku("")
    setCategory("")
    setType("Made to Order")
    setDescription("")
    setImage("")
    setOutletPrice("")
    setCost("")
    setUnit("Nos")
    setThreshold("0")
    setIsActive(true)
    setEditingProduct(null)
    setFormVariants([])
    setRequiresRecipe(false)
  }

  const handleEdit = (p: any) => {
    setEditingProduct(p)
    setName(p.name)
    setSku(p.sku)
    setCategory(p.category)
    setType(p.type || "Made to Order")
    setDescription(p.description || "")
    setImage(p.image || "")
    setOutletPrice(p.outletPrice?.toString() || "")
    setCost(p.cost?.toString() || "")
    setUnit(p.unit || "Nos")
    setThreshold(p.threshold?.toString() || "0")
    setIsActive(p.status === 'Active')
    setFormAddons(p.addons || [])
    setRequiresRecipe(p.stockType !== 'Non-Inventory' && p.stockType !== undefined ? true : false)
    
    // Load variants
    const productVars = allVariants.filter(v => v.productId && (v.productId._id === p.id || v.productId === p.id))
    setFormVariants(productVars.map(v => ({ id: v._id, name: v.name, sellingPrice: v.sellingPrice?.toString() || "", costPrice: v.costPrice?.toString() || "" })))
    
    setIsDialogOpen(true)
  }

  const confirmArchive = async (id: string) => {
    const result = await Swal.fire({
      title: 'Archive Product?',
      text: 'Are you sure you want to archive this product? It will be marked as Inactive and hidden from POS.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Yes, Archive'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/products`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'Inactive' })
        })
        if(res.ok) {
          fetchData()
          Swal.fire('Archived!', 'Product has been archived.', 'success')
        } else toast.error("Failed to archive product")
      } catch (err) {
        console.error(err)
        toast.error("An error occurred")
      }
    }
  }

  const confirmDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      text: 'Are you sure you want to permanently delete this product? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Yes, Delete'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
        if(res.ok) {
          fetchData()
          Swal.fire('Deleted!', 'Product has been deleted.', 'success')
        } else toast.error("Failed to delete product")
      } catch (err) {
        console.error(err)
        toast.error("An error occurred")
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
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }} disablePointerDismissal>
          <DialogContent className="sm:max-w-[750px]">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingProduct ? "Edit Product" : "Create New Product"}</DialogTitle>
              <DialogDescription>Products are master data and shared across all branches.</DialogDescription>
            </DialogHeader>
              
              <div className="py-4 px-6 max-h-[75vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
                
                <Tabs value={type} onValueChange={(v) => setType(v as "Finished Good" | "Ingredient" | "Add-on")} className="w-full mb-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="Made to Order" className="text-sm font-semibold">Made to Order (Recipes)</TabsTrigger>
                    <TabsTrigger value="Finished Good" className="text-sm font-semibold">Finished Goods (e.g. Cakes)</TabsTrigger>
                  </TabsList>
                  
                  {/* Common Product Fields */}
                  <div className="mt-6 mb-4"></div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Product Name <span className="text-red-500">*</span></Label>
                      <Input placeholder="e.g. Classic Mojito" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">SKU (Auto-Generated)</Label>
                      <Input value={sku} readOnly placeholder="Will be auto-generated" className="bg-gray-100 text-gray-500 cursor-not-allowed" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Category (Optional)</Label>
                      <Select value={category} onValueChange={(val) => setCategory(val || "")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesList.filter(cat => cat.productType === 'Both' || !cat.productType || cat.productType === type).length === 0 ? (
                            <SelectItem value="none" disabled>No active categories found</SelectItem>
                          ) : (
                            categoriesList
                              .filter(cat => cat.productType === 'Both' || !cat.productType || cat.productType === type)
                              .map(cat => (
                              <SelectItem key={cat._id} value={cat.name}>{cat.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Cost Price (Rs.)</Label>
                          <Input 
                            type="number" step="0.01" min="0" placeholder="e.g. 300" 
                            value={cost} onChange={(e) => setCost(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Selling Price (Rs.) <span className="text-red-500">*</span></Label>
                          <Input 
                            type="number" step="0.01" min="0" placeholder="e.g. 500" 
                            value={outletPrice} onChange={(e) => setOutletPrice(e.target.value)} 
                          />
                        </div>
                      </div>
                  </div>

                  {/* MADE TO ORDER SPECIFIC FIELDS */}
                  <TabsContent value="Made to Order" className="space-y-6">
                    {/* Recipe Toggle */}
                    <div className="flex items-center justify-between border rounded-lg p-4 bg-amber-50/50">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm">Requires Recipe?</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {requiresRecipe 
                            ? "This product uses raw materials via a recipe. Stock is deducted when sold." 
                            : "No recipe needed. Unlimited stock — sold without inventory tracking (e.g. extra toppings, special combos)."}
                        </p>
                      </div>
                      <Switch checked={requiresRecipe} onCheckedChange={setRequiresRecipe} className="data-[state=checked]:bg-orange-500" />
                    </div>

                    {/* Variants Section */}
                    <div className="grid gap-3 border-t pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-800">Variants (Sizes, Cost & Selling Price)</h3>
                          <p className="text-xs text-muted-foreground">Add specific sizes and their prices (e.g., Small, Large).</p>
                        </div>
                        <Button type="button" size="sm" variant="outline" onClick={addVariantRow} className="h-8">
                          <Plus className="w-4 h-4 mr-1" /> Add Variant
                        </Button>
                      </div>

                      {formVariants.length > 0 ? (
                        <div className="grid gap-2 mt-2">
                          {formVariants.map((variant, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border">
                              <div className="flex-1">
                                <Select value={variant.name} onValueChange={v => updateVariantRow(idx, 'name', v || "")}>
                                  <SelectTrigger className="h-8 text-sm bg-white">
                                    <SelectValue placeholder="Size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Large">Large</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex-[0.7]">
                                <Input 
                                  type="number" step="0.01" min="0" placeholder="Cost (Rs.)" 
                                  className="h-8 text-sm"
                                  value={variant.costPrice} 
                                  onChange={e => updateVariantRow(idx, 'costPrice', e.target.value)} 
                                />
                              </div>
                              <div className="flex-[0.7]">
                                <Input 
                                  type="number" step="0.01" min="0" placeholder="Selling (Rs.)" 
                                  className="h-8 text-sm border-orange-200 focus-visible:ring-orange-500"
                                  value={variant.sellingPrice} 
                                  onChange={e => updateVariantRow(idx, 'sellingPrice', e.target.value)} 
                                />
                              </div>
                              <Button type="button" size="icon" variant="ghost" onClick={() => confirmRemoveVariant(idx)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic py-2">Please add variants to set prices for different sizes.</div>
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
                  </TabsContent>

                  {/* FINISHED GOOD SPECIFIC FIELDS */}
                  <TabsContent value="Finished Good" className="space-y-6">
                    {/* Variants Section */}
                    <div className="grid gap-3 border-t pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-800">Variants (Sizes, Cost & Selling Price)</h3>
                          <p className="text-xs text-muted-foreground">Add specific sizes and their prices (e.g., Medium, Large).</p>
                        </div>
                        <Button type="button" size="sm" variant="outline" onClick={addVariantRow} className="h-8">
                          <Plus className="w-4 h-4 mr-1" /> Add Variant
                        </Button>
                      </div>

                      {formVariants.length > 0 ? (
                        <div className="grid gap-2 mt-2">
                          {formVariants.map((variant, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border">
                              <div className="flex-1">
                                <Select value={variant.name} onValueChange={v => updateVariantRow(idx, 'name', v || "")}>
                                  <SelectTrigger className="h-8 text-sm bg-white">
                                    <SelectValue placeholder="Size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Large">Large</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex-[0.7]">
                                <Input 
                                  type="number" step="0.01" min="0" placeholder="Cost (Rs.)" 
                                  className="h-8 text-sm"
                                  value={variant.costPrice} 
                                  onChange={e => updateVariantRow(idx, 'costPrice', e.target.value)} 
                                />
                              </div>
                              <div className="flex-[0.7]">
                                <Input 
                                  type="number" step="0.01" min="0" placeholder="Selling (Rs.)" 
                                  className="h-8 text-sm border-orange-200 focus-visible:ring-orange-500"
                                  value={variant.sellingPrice} 
                                  onChange={e => updateVariantRow(idx, 'sellingPrice', e.target.value)} 
                                />
                              </div>
                              <Button type="button" size="icon" variant="ghost" onClick={() => confirmRemoveVariant(idx)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic py-2">Please add variants to set prices for different sizes.</div>
                      )}
                    </div>

                    <div className="grid gap-3 border-t pt-4">
                      <h3 className="font-semibold text-gray-800">Finished Good Details</h3>
                      <p className="text-xs text-muted-foreground mb-2">Configure pricing and inventory tracking for ready-to-sell items.</p>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Measurement Unit</Label>
                        <Select value={unit} onValueChange={(val) => setUnit(val || "Nos")}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Nos">Nos (Pieces)</SelectItem>
                            <SelectItem value="Bottles">Bottles</SelectItem>
                            <SelectItem value="Cups">Cups</SelectItem>
                            <SelectItem value="Grams">Grams</SelectItem>
                            <SelectItem value="Kg">Kilograms</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2 mt-2">
                        <Label className="text-sm font-medium text-gray-700">Reorder Threshold</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="e.g. 10 (Alerts when stock is below this)" 
                          value={threshold} 
                          onChange={(e) => setThreshold(e.target.value)} 
                        />
                        <p className="text-xs text-muted-foreground">Get low-stock warnings in the Branch Inventory.</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex items-center justify-between border-t pt-4 mt-2">
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
        <div className="flex flex-col lg:flex-row items-center gap-4 mb-6 pb-4 border-b">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search products..." 
              className="pl-9 bg-gray-50 border-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap w-full lg:w-auto gap-3">
            <Select value={filterCategory} onValueChange={(val) => setFilterCategory(val || "All")}>
              <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categoriesList.map((c: any) => (
                  <SelectItem key={c._id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={(val) => setFilterType(val || "All")}>
              <SelectTrigger className="w-[200px] bg-gray-50 border-gray-200">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Recipe">Made to Order (Recipe)</SelectItem>
                <SelectItem value="No Recipe">Made to Order (No Recipe)</SelectItem>
                <SelectItem value="Finished Good">Finished Goods</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || "All")}>
              <SelectTrigger className="w-[140px] bg-gray-50 border-gray-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <TableHead>Product Name</TableHead>
              <TableHead>Medium (Rs)</TableHead>
              <TableHead>Large (Rs)</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading products...</TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : filteredProducts.map((p: any) => (
              <TableRow key={p.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell>
                  <div className="font-semibold text-gray-800 uppercase text-sm">
                    {p.name}
                    {p.type === 'Finished Good' && (
                      <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Finished Good</span>
                    )}
                    {p.stockType === 'Non-Inventory' && (
                      <span className="ml-2 bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">∞ No Recipe</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{p.sku}</div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-gray-700">
                    {allVariants.find(v => v.productId && (v.productId._id === p.id || v.productId === p.id) && v.name.toLowerCase() === 'medium')?.sellingPrice || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-gray-700">
                    {allVariants.find(v => v.productId && (v.productId._id === p.id || v.productId === p.id) && v.name.toLowerCase() === 'large')?.sellingPrice || '-'}
                  </span>
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
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100" title="View" onClick={() => setViewingProduct(p)}>
                      <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50" title="Edit" onClick={() => handleEdit(p)}>
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-orange-500 hover:text-orange-700 hover:bg-orange-50" title="Archive" onClick={() => confirmArchive(p.id)} disabled={p.status === 'Inactive'}>
                      <Archive className="h-4 w-4 text-orange-500 hover:text-orange-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Delete" onClick={() => confirmDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Product Dialog */}
      <Dialog open={!!viewingProduct} onOpenChange={(open) => !open && setViewingProduct(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="sr-only">
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          
          {viewingProduct && (
            <div className="space-y-6 mt-4">
              <div className="border-b pb-5">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight pr-8">{viewingProduct.name}</h3>
                <div className="text-sm text-gray-500 mt-1.5 font-medium">SKU: {viewingProduct.sku}</div>
                <div className="flex flex-wrap gap-2.5 mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${viewingProduct.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {viewingProduct.status}
                  </span>
                  <span className="bg-gray-50 text-gray-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-gray-200">{viewingProduct.category}</span>
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-blue-200">{viewingProduct.type}</span>
                  {viewingProduct.stockType === 'Non-Inventory' && (
                    <span className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-purple-200">∞ No Recipe</span>
                  )}
                </div>
              </div>
              
              {viewingProduct.description && (
                <div className="bg-gray-50 p-3 rounded-md border text-sm text-gray-700">
                  {viewingProduct.description}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-500 block text-[10px] uppercase tracking-wider font-semibold mb-1">Base Cost Price</span>
                  <span className="text-base font-bold text-gray-900">Rs. {viewingProduct.cost || 0}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-500 block text-[10px] uppercase tracking-wider font-semibold mb-1">Base Selling Price</span>
                  <span className="text-base font-bold text-green-600">Rs. {viewingProduct.outletPrice || 0}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-500 block text-[10px] uppercase tracking-wider font-semibold mb-1">Measurement Unit</span>
                  <span className="text-sm font-semibold text-gray-800">{viewingProduct.unit || 'Nos'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-500 block text-[10px] uppercase tracking-wider font-semibold mb-1">Stock Tracking</span>
                  <span className="text-sm font-semibold text-gray-800">{viewingProduct.stockType || 'Inventory'}</span>
                </div>
              </div>

              {allVariants.filter(v => v.productId && (v.productId._id === viewingProduct.id || v.productId === viewingProduct.id)).length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold mb-2">Variants</h4>
                  <div className="flex flex-col gap-1.5">
                    {allVariants
                      .filter(v => v.productId && (v.productId._id === viewingProduct.id || v.productId === viewingProduct.id))
                      .map(v => (
                        <div key={v._id} className="flex justify-between items-center bg-gray-50 px-2 py-1.5 rounded border text-sm">
                          <span className="font-medium">{v.name}</span>
                          <span className="text-gray-600">Cost: <span className="font-semibold text-gray-800">Rs. {v.costPrice || 0}</span> | Sell: <span className="font-semibold text-gray-800">Rs. {v.sellingPrice}</span></span>
                        </div>
                    ))}
                    {allVariants.filter(v => v.productId && (v.productId._id === viewingProduct.id || v.productId === viewingProduct.id)).length === 0 && (
                      <span className="text-xs text-gray-500 italic">No variants found.</span>
                    )}
                  </div>
                </div>
              )}

              {viewingProduct.addons && viewingProduct.addons.length > 0 && (
                <div className="border-t pt-4 pb-2">
                  <h4 className="text-sm font-semibold mb-3 text-gray-800">Add-ons</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {viewingProduct.addons.map((a: any, i: number) => (
                      <span key={i} className="text-[11px] bg-orange-50 text-orange-800 border border-orange-200 px-2.5 py-1.5 rounded-md font-medium shadow-sm">
                        {a.name} (Rs. {a.price})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
