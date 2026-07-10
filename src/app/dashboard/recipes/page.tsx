"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Plus, Trash2, Box, Beaker, Save, ChefHat } from "lucide-react"



export default function RecipesPage() {
  const [recipes, setRecipes] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [rawMaterials, setRawMaterials] = useState<any[]>([])
  
  // Builder State
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedVariant, setSelectedVariant] = useState("")
  const [currentIngredients, setCurrentIngredients] = useState<any[]>([])

  // Form selections
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState("")
  const [quantity, setQuantity] = useState("")

  const selectedProduct = products.find(p => p.sku === selectedProductId || p.id === selectedProductId)
  const selectedRawMaterial = rawMaterials.find(r => r.sku === selectedRawMaterialId || r.id === selectedRawMaterialId)

  const loadData = async () => {
    try {
      const [resProd, resRM, resRec] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/raw-materials'),
        fetch('/api/recipes')
      ])
      if(resProd.ok) setProducts(await resProd.json())
      if(resRM.ok) setRawMaterials(await resRM.json())
      if(resRec.ok) setRecipes(await resRec.json())
    } catch (e) {
      console.error(e)
    }
  }

  useState(() => {
    loadData()
  })

  // Handlers
  const handleProductChange = (val: string) => {
    setSelectedProductId(val)
    const prod = products.find(p => p.sku === val || p.id === val)
    if (prod && prod.variants && prod.variants.length > 0) {
      setSelectedVariant(prod.variants[0])
    } else {
      setSelectedVariant("Standard")
    }
    // Check if recipe exists
    const existing = recipes.find(r => r.productId === val && r.variant === (prod?.variants[0] || "Standard"))
    if (existing) {
      setCurrentIngredients([...existing.ingredients])
    } else {
      setCurrentIngredients([])
    }
  }

  const handleVariantChange = (val: string) => {
    setSelectedVariant(val)
    const existing = recipes.find(r => r.productId === selectedProductId && r.variant === val)
    if (existing) {
      setCurrentIngredients([...existing.ingredients])
    } else {
      setCurrentIngredients([])
    }
  }

  const addIngredient = () => {
    if (!selectedRawMaterial || !quantity) return
    const newIng = {
      rawMaterialId: selectedRawMaterial.sku || selectedRawMaterial.id,
      name: selectedRawMaterial.name,
      quantity: Number(quantity),
      unit: selectedRawMaterial.unit
    }
    setCurrentIngredients([...currentIngredients, newIng])
    setSelectedRawMaterialId("")
    setQuantity("")
  }

  const removeIngredient = (id: string) => {
    setCurrentIngredients(currentIngredients.filter(i => i.rawMaterialId !== id))
  }

  const saveRecipe = async () => {
    if (!selectedProduct || currentIngredients.length === 0) {
      alert("Please select a product and add ingredients.")
      return
    }

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.sku || selectedProduct.id,
          productName: selectedProduct.name,
          variant: selectedVariant,
          ingredients: currentIngredients,
          totalCost: 0 // calculate based on RM cost if needed
        })
      })
      if (res.ok) {
        alert("Recipe saved successfully! This will be used for auto-deduction at the POS.")
        loadData() // Refresh list
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <ChefHat className="text-orange-500 w-6 h-6" /> Recipe Management
        </h2>
        <p className="text-gray-500">Define the exact raw materials required to produce each product for automatic stock deduction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recipe Builder Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">1. Select Product</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Select value={selectedProductId} onValueChange={handleProductChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id || p.sku} value={p.sku || p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="space-y-2">
                  <Label>Variant (Size)</Label>
                  <Select value={selectedVariant} onValueChange={handleVariantChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProduct.variants.map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border opacity-100 transition-opacity" style={{ opacity: selectedProductId ? 1 : 0.5, pointerEvents: selectedProductId ? 'auto' : 'none' }}>
            <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">2. Add Ingredients</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Raw Material</Label>
                <Select value={selectedRawMaterialId} onValueChange={setSelectedRawMaterialId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select raw material" />
                  </SelectTrigger>
                  <SelectContent>
                    {rawMaterials.map(r => (
                      <SelectItem key={r.id || r.sku} value={r.sku || r.id}>{r.name} ({r.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 items-end">
                <div className="space-y-2 flex-1">
                  <Label>Quantity ({selectedRawMaterial?.unit || '-'})</Label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 50" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <Button onClick={addIngredient} className="bg-orange-500 hover:bg-orange-600 text-white shadow-md">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Recipe View */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-lg text-gray-800">
                {selectedProduct ? `Recipe for ${selectedProduct.name} (${selectedVariant})` : "Select a product to view recipe"}
              </h3>
              {currentIngredients.length > 0 && (
                <Button onClick={saveRecipe} className="bg-gray-900 text-white hover:bg-black shadow-md rounded-lg">
                  <Save className="w-4 h-4 mr-2" /> Save Recipe
                </Button>
              )}
            </div>

            {currentIngredients.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
                <Beaker className="w-16 h-16 opacity-20 mb-4" />
                <p className="font-medium text-lg">No ingredients added yet.</p>
                <p className="text-sm">Select a raw material and quantity to build this recipe.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Raw Material</TableHead>
                      <TableHead>Quantity Required</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentIngredients.map(ing => (
                      <TableRow key={ing.rawMaterialId}>
                        <TableCell className="font-semibold text-gray-800 flex items-center gap-2">
                          <Box className="w-4 h-4 text-orange-400" />
                          {ing.name}
                        </TableCell>
                        <TableCell>
                          <span className="bg-gray-100 px-2 py-1 rounded-md font-bold text-gray-700">
                            {ing.quantity} {ing.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeIngredient(ing.rawMaterialId)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  )
}
