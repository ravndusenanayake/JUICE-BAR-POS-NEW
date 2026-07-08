"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Box, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { logAudit } from "@/lib/auditLogger"
import { useAuth } from "@/context/AuthContext"

// Dummy Data matching the screenshot
const INITIAL_PRODUCTS = [
  { id: 1, name: "BLACKFOREST CAKE", sku: "TEZ002", category: "Cakes", type: "Product", outletPrice: 200.00, pickmePrice: 1500.00, uberPrice: 1500.00, status: true, hasVariants: false, variants: [] },
  { id: 2, name: "BANANA MILKSHAKE", sku: "TEZ001", category: "Cold Beverages", type: "Recipe Based", outletPrice: 350.00, pickmePrice: 1300.00, uberPrice: 1300.00, status: true, hasVariants: true, variants: [{ id: 'var-0', name: 'Large', sku: 'TEZ001-L', outletPrice: 450, pickmePrice: 1500, uberPrice: 1500 }] },
  { id: 3, name: "chips", sku: "MA123", category: "Snacks", type: "Product", outletPrice: 150.00, pickmePrice: 1450.00, uberPrice: 1450.00, status: true, hasVariants: false, variants: [] },
  { id: 4, name: "coconut", sku: "ES12001", category: "Raw Materials", type: "Product", outletPrice: 15.00, pickmePrice: 18.00, uberPrice: 18.00, status: true, hasVariants: false, variants: [] },
]

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState(INITIAL_PRODUCTS)
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

  // Hardcoded Add-ons from the master list (will be fetched from API later)
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

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (products.some(p => p.sku.toLowerCase() === sku.toLowerCase())) {
      alert("A product with this SKU already exists!")
      return
    }

    const newProduct = {
      id: products.length + 1,
      name,
      sku: sku.toUpperCase(),
      category,
      type,
      outletPrice: parseFloat(outletPrice) || 0,
      pickmePrice: parseFloat(pickmePrice) || 0,
      uberPrice: parseFloat(uberPrice) || 0,
      status: isActive,
      addons: selectedAddons,
      hasVariants,
      variants: hasVariants ? variants.map((v, idx) => ({
        id: `var-${idx}`,
        name: v.name,
        sku: v.sku.toUpperCase(),
        outletPrice: parseFloat(v.outletPrice) || 0,
        pickmePrice: parseFloat(v.pickmePrice) || 0,
        uberPrice: parseFloat(v.uberPrice) || 0,
      })) : []
    }

    setProducts([newProduct, ...products])
    logAudit(user?.name || "System", user?.branch || "Unknown", `Created new product: ${name}`, "Product")
    setIsDialogOpen(false)
    resetForm()
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
  }

  const toggleStatus = (id: number) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, status: !p.status } : p
    ))
  }

  const deleteProduct = (id: number) => {
    const prod = products.find(p => p.id === id)
    if(confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter(p => p.id !== id))
      if (prod) logAudit(user?.name || "System", user?.branch || "Unknown", `Deleted product: ${prod.name}`, "Product")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Products</h2>
          <p className="text-muted-foreground">Manage your products, pricing, and variants.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-orange-500 hover:bg-orange-600 text-white" />}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <form onSubmit={handleAddProduct}>
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle className="text-xl">Add New Product</DialogTitle>
                {/* The Close button is handled automatically by shadcn Dialog, but we can customize if needed */}
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {/* Row 1 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Product Name *</Label>
                    <Input id="name" placeholder="e.g. Espresso Standard" value={name} onChange={(e) => setName(e.target.value)} required className="border-gray-300" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sku" className="text-sm font-medium text-gray-700">SKU *</Label>
                    <Input id="sku" placeholder="e.g. ES1200" value={sku} onChange={(e) => setSku(e.target.value)} required className="border-gray-300" />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category *</Label>
                    <Select value={category} onValueChange={(val) => setCategory(val || "")} required>
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
                    <Label htmlFor="type" className="text-sm font-medium text-gray-700">Product Type *</Label>
                    <Select value={type} onValueChange={(val) => setType(val || "")} required>
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

                {/* Row 3 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="threshold" className="text-sm font-medium text-gray-700">Threshold *</Label>
                    <Input id="threshold" type="number" placeholder="Enter threshold (e.g., 10)" value={threshold} onChange={(e) => setThreshold(e.target.value)} required className="border-gray-300" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit" className="text-sm font-medium text-gray-700">Unit *</Label>
                    <Select value={unit} onValueChange={(val) => setUnit(val || "")} required>
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

                {/* Row 4 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cost" className="text-sm font-medium text-gray-700">Cost (Rs.) *</Label>
                    <Input id="cost" type="number" step="0.01" placeholder="Enter cost (e.g., 120.50)" value={cost} onChange={(e) => setCost(e.target.value)} required className="border-gray-300" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="outletPrice" className="text-sm font-medium text-gray-700">Outlet Price (Rs.) *</Label>
                    <Input id="outletPrice" type="number" step="0.01" placeholder="Enter outlet price (e.g., 200.00)" value={outletPrice} onChange={(e) => setOutletPrice(e.target.value)} required className="border-gray-300" />
                  </div>
                </div>

                {/* Row 5 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="pickmePrice" className="text-sm font-medium text-gray-700">PickMe Price (Rs.) *</Label>
                    <Input id="pickmePrice" type="number" step="0.01" placeholder="Enter PickMe price (e.g., 220.00)" value={pickmePrice} onChange={(e) => setPickmePrice(e.target.value)} required className="border-gray-300" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="uberPrice" className="text-sm font-medium text-gray-700">Uber Price (Rs.) *</Label>
                    <Input id="uberPrice" type="number" step="0.01" placeholder="Enter Uber price (e.g., 225.00)" value={uberPrice} onChange={(e) => setUberPrice(e.target.value)} required className="border-gray-300" />
                  </div>
                </div>

                {/* Variants Selection */}
                <div className="border rounded-md p-4 bg-gray-50/50 mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium text-gray-700">Product Variants</Label>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="has-variants" className="text-xs text-gray-500">Has Variants?</Label>
                      <Switch 
                        id="has-variants" 
                        checked={hasVariants} 
                        onCheckedChange={setHasVariants}
                        className="data-[state=checked]:bg-orange-500"
                      />
                    </div>
                  </div>

                  {hasVariants && (
                    <div className="space-y-4">
                      {variants.map((variant, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-start border-b pb-4 mb-2">
                          <div className="col-span-12 flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-gray-500">Variant #{idx + 1}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={() => removeVariant(idx)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="col-span-4">
                            <Input placeholder="Name (e.g. Small)" value={variant.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)} required className="h-8 text-xs border-gray-300" />
                          </div>
                          <div className="col-span-3">
                            <Input placeholder="SKU" value={variant.sku} onChange={(e) => updateVariant(idx, 'sku', e.target.value)} required className="h-8 text-xs border-gray-300" />
                          </div>
                          <div className="col-span-5 grid grid-cols-3 gap-1">
                            <Input type="number" step="0.01" placeholder="Outlet Rs" value={variant.outletPrice} onChange={(e) => updateVariant(idx, 'outletPrice', e.target.value)} required className="h-8 text-xs border-gray-300" />
                            <Input type="number" step="0.01" placeholder="PickMe" value={variant.pickmePrice} onChange={(e) => updateVariant(idx, 'pickmePrice', e.target.value)} required className="h-8 text-xs border-gray-300" />
                            <Input type="number" step="0.01" placeholder="Uber" value={variant.uberPrice} onChange={(e) => updateVariant(idx, 'uberPrice', e.target.value)} required className="h-8 text-xs border-gray-300" />
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addVariant} className="w-full border-dashed border-gray-300 text-gray-500 hover:text-orange-500 hover:border-orange-500">
                        <Plus className="mr-2 h-4 w-4" /> Add Variant
                      </Button>
                    </div>
                  )}
                </div>

                {/* Add-ons Selection */}
                <div className="border rounded-md p-4 bg-gray-50/50 mt-2">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Applicable Add-Ons</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_ADDONS.map(addon => (
                      <label key={addon.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-2 rounded">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          checked={selectedAddons.includes(addon.id)}
                          onChange={() => toggleAddon(addon.id)}
                        />
                        {addon.name}
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Status Row */}
                <div className="flex items-center justify-between mt-2">
                  <Label htmlFor="status-toggle" className="text-sm font-medium text-gray-700">Status</Label>
                  <Switch 
                    id="status-toggle" 
                    checked={isActive} 
                    onCheckedChange={setIsActive} 
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>
              </div>
              
              <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
                <DialogClose>
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
                  Create Product
                </Button>
              </DialogFooter>
            </form>
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
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            )}
            {filteredProducts.map((p) => (
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
                  <span className="text-sm font-medium">LKR {p.outletPrice.toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-gray-500">Pick Me: LKR {p.pickmePrice.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Uber: LKR {p.uberPrice.toFixed(2)}</div>
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium ${p.status ? 'text-green-500' : 'text-gray-400'}`}>
                    {p.status ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Edit">
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
