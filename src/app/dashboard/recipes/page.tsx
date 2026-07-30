"use client"
import { toast } from 'sonner';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Plus, Trash2, Box, Beaker, Save, ChefHat } from "lucide-react"

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<any[]>([])
  const [variants, setVariants] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [rawMaterials, setRawMaterials] = useState<any[]>([])
  
  // Builder State
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [currentIngredients, setCurrentIngredients] = useState<any[]>([])

  // Form selections
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState("")
  const [quantity, setQuantity] = useState("")

  // Combine variants and base products that have no variants
  const getRecipeTargets = () => {
    const targets: any[] = []
    
    // 1. Add all actual variants
    variants.forEach(v => {
      targets.push({
        id: v._id || v.id,
        productId: typeof v.productId === 'object' && v.productId !== null ? v.productId._id : v.productId,
        productName: v.productId?.name || "Unknown Product",
        variantName: v.name,
        isBaseProduct: false
      })
    })

    // 2. Add Made-to-Order products that have NO active variants
    products.forEach(p => {
      if (p.type === "Made to Order") {
        const hasVariants = variants.some(v => {
          const vProdId = typeof v.productId === 'object' && v.productId !== null ? v.productId._id : v.productId;
          return vProdId === p._id && v.status === "Active"
        })
        
        if (!hasVariants) {
          targets.push({
            id: p._id || p.id,
            productId: p._id || p.id,
            productName: p.name,
            variantName: "Standard",
            isBaseProduct: true
          })
        }
      }
    })
    
    return targets
  }

  const recipeTargets = getRecipeTargets()
  const selectedTarget = recipeTargets.find(t => t.id === selectedVariantId)
  const selectedRawMaterial = rawMaterials.find(r => r._id === selectedRawMaterialId || r.sku === selectedRawMaterialId || r.id === selectedRawMaterialId)

  const loadData = async () => {
    try {
      const [resVar, resRM, resRec, resProd] = await Promise.all([
        fetch('/api/product-variants'),
        fetch('/api/raw-materials'),
        fetch('/api/recipes'),
        fetch('/api/products')
      ])
      if(resVar.ok) setVariants(await resVar.json())
      if(resRM.ok) setRawMaterials(await resRM.json())
      if(resRec.ok) setRecipes(await resRec.json())
      if(resProd.ok) setProducts(await resProd.json())
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handlers
  const handleVariantChange = (val: any) => {
    setSelectedVariantId(val)
    const target = recipeTargets.find(t => t.id === val)
    if (!target) return

    const existing = recipes.find(r => r.productId === target.productId && r.variant === target.variantName)
    
    if (existing) {
      setCurrentIngredients([...existing.ingredients])
    } else {
      setCurrentIngredients([])
    }
  }

  const addIngredient = () => {
    if (!selectedRawMaterial || !quantity) return
    const newIng = {
      rawMaterialId: selectedRawMaterial.sku || selectedRawMaterial.id || selectedRawMaterial._id,
      name: selectedRawMaterial.name,
      quantity: Number(quantity),
      unit: selectedRawMaterial.unit
    }
    
    // Check if already exists
    const existingIndex = currentIngredients.findIndex(i => i.rawMaterialId === newIng.rawMaterialId)
    if(existingIndex >= 0) {
      const updated = [...currentIngredients]
      updated[existingIndex].quantity += newIng.quantity
      setCurrentIngredients(updated)
    } else {
      setCurrentIngredients([...currentIngredients, newIng])
    }
    
    setSelectedRawMaterialId("")
    setQuantity("")
  }

  const removeIngredient = (id: string) => {
    setCurrentIngredients(currentIngredients.filter(i => i.rawMaterialId !== id))
  }

  const saveRecipe = async () => {
    if (!selectedTarget || currentIngredients.length === 0) {
      toast.info("Please select a product variant and add ingredients.")
      return
    }

    try {
      // Check if recipe exists to update it, or create a new one
      const existing = recipes.find(r => r.productId === selectedTarget.productId && r.variant === selectedTarget.variantName)

      const payload = {
        productId: selectedTarget.productId, // Master Product ID
        productName: selectedTarget.productName,
        variant: selectedTarget.variantName, // e.g. Small, Medium, or Standard
        ingredients: currentIngredients,
      }

      let res;
      if (existing) {
        res = await fetch('/api/recipes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existing._id, ...payload })
        })
      } else {
        res = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }
      
      if (res.ok) {
        toast.success("Recipe saved successfully! This will be used for auto-deduction at the POS.")
        loadData() // Refresh list
      } else {
        toast.error("Failed to save recipe")
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
        <p className="text-gray-500">Define the exact raw materials required to produce each product variant for automatic stock deduction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recipe Builder Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">1. Select Product Variant</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product Variant</Label>
                <Select value={selectedVariantId} onValueChange={handleVariantChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a variant">
                      {selectedVariantId ? 
                        (() => {
                          const t = recipeTargets.find(x => x.id === selectedVariantId)
                          return t ? `${t.productName} - ${t.variantName}` : selectedVariantId
                        })() 
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {recipeTargets.length === 0 ? (
                      <SelectItem value="none" disabled>No variants found</SelectItem>
                    ) : (
                      recipeTargets.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.productName} - {t.variantName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border opacity-100 transition-opacity" style={{ opacity: selectedVariantId ? 1 : 0.5, pointerEvents: selectedVariantId ? 'auto' : 'none' }}>
            <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">2. Add Ingredients</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Raw Material</Label>
                <Select value={selectedRawMaterialId} onValueChange={(val: any) => setSelectedRawMaterialId(val || "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select raw material">
                      {selectedRawMaterialId ? 
                        (() => {
                          const r = rawMaterials.find(x => (x._id || x.id || x.sku) === selectedRawMaterialId)
                          return r ? `${r.name} (${r.unit})` : selectedRawMaterialId
                        })() 
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {rawMaterials.map(r => (
                      <SelectItem key={r._id || r.id || r.sku} value={r._id || r.id || r.sku}>{r.name} ({r.unit})</SelectItem>
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
                {selectedTarget ? `Recipe for ${selectedTarget.productName} (${selectedTarget.variantName})` : "Select a product variant to view recipe"}
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
