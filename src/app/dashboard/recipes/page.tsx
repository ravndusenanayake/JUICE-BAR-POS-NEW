"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, X, ChefHat } from "lucide-react"

// Dummy Data
const RAW_MATERIALS = [
  { id: 1, name: "Sugar", unit: "g" },
  { id: 2, name: "Milk", unit: "ml" },
  { id: 3, name: "Mango", unit: "g" },
  { id: 4, name: "Pineapple", unit: "g" },
  { id: 5, name: "Ice", unit: "g" },
  { id: 6, name: "Banana", unit: "Nos" },
]

const PRODUCTS_VARIANTS = [
  { id: "p1", name: "Banana Milkshake - Large" },
  { id: "p2", name: "Banana Milkshake - Medium" },
  { id: "p3", name: "Fruit Salad - Large" },
  { id: "p4", name: "Fruit Salad - Medium" },
]

const INITIAL_RECIPES = [
  { 
    id: 1, 
    productName: "Banana Milkshake - Large", 
    ingredients: [
      { rawMaterialId: 6, name: "Banana", quantity: 2, unit: "Nos" },
      { rawMaterialId: 2, name: "Milk", quantity: 250, unit: "ml" },
      { rawMaterialId: 1, name: "Sugar", quantity: 50, unit: "g" }
    ] 
  },
  { 
    id: 2, 
    productName: "Fruit Salad - Medium", 
    ingredients: [
      { rawMaterialId: 3, name: "Mango", quantity: 100, unit: "g" },
      { rawMaterialId: 4, name: "Pineapple", quantity: 150, unit: "g" },
      { rawMaterialId: 1, name: "Sugar", quantity: 30, unit: "g" }
    ] 
  }
]

export default function RecipesPage() {
  const [recipes, setRecipes] = useState(INITIAL_RECIPES)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form State
  const [selectedProduct, setSelectedProduct] = useState("")
  const [ingredients, setIngredients] = useState<{rawMaterialId: number, name: string, quantity: string, unit: string}[]>([])

  const filteredRecipes = recipes.filter(r => 
    r.productName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { rawMaterialId: 0, name: "", quantity: "", unit: "" }])
  }

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleIngredientChange = (index: number, rawMaterialIdStr: string) => {
    const rawMatId = parseInt(rawMaterialIdStr);
    const rawMat = RAW_MATERIALS.find(rm => rm.id === rawMatId);
    if (rawMat) {
      const newIngredients = [...ingredients]
      newIngredients[index] = { 
        ...newIngredients[index], 
        rawMaterialId: rawMat.id, 
        name: rawMat.name, 
        unit: rawMat.unit 
      }
      setIngredients(newIngredients)
    }
  }

  const handleQuantityChange = (index: number, value: string) => {
    const newIngredients = [...ingredients]
    newIngredients[index].quantity = value
    setIngredients(newIngredients)
  }

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProduct) {
      alert("Please select a Product / Variant.")
      return
    }
    if (ingredients.length === 0) {
      alert("Please add at least one ingredient.")
      return
    }

    const prodName = PRODUCTS_VARIANTS.find(p => p.id === selectedProduct)?.name || "Unknown Product"

    if (recipes.some(r => r.productName === prodName)) {
      alert("A recipe for this product already exists! Please edit it instead.")
      return
    }

    const newRecipe = {
      id: recipes.length + 1,
      productName: prodName,
      ingredients: ingredients.map(i => ({
        ...i,
        quantity: parseFloat(i.quantity) || 0
      }))
    }

    setRecipes([newRecipe, ...recipes])
    setIsDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setSelectedProduct("")
    setIngredients([])
  }

  const deleteRecipe = (id: number) => {
    if(confirm("Are you sure you want to delete this recipe?")) {
      setRecipes(recipes.filter(r => r.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recipe Management</h2>
          <p className="text-muted-foreground">Define raw materials required for products to automate inventory deduction.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-orange-500 hover:bg-orange-600 text-white" />}>
            <Plus className="mr-2 h-4 w-4" /> Create Recipe
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveRecipe}>
              <DialogHeader>
                <DialogTitle>Recipe Builder</DialogTitle>
                <DialogDescription>
                  Select a product or variant and add the exact ingredients required.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="product" className="text-sm font-medium text-gray-700">Product / Variant *</Label>
                  <Select value={selectedProduct} onValueChange={(val) => setSelectedProduct(val || "")} required>
                    <SelectTrigger className="border-gray-300 border-orange-400 focus:ring-orange-400">
                      <SelectValue placeholder="Select Product Variant" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCTS_VARIANTS.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border rounded-md p-4 bg-gray-50/50">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-sm font-medium text-gray-700">Ingredients</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient} className="border-orange-500 text-orange-500 hover:bg-orange-50">
                      <Plus className="mr-2 h-3 w-3" /> Add Ingredient
                    </Button>
                  </div>

                  {ingredients.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400 italic bg-white border border-dashed rounded">
                      No ingredients added yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ingredients.map((ing, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white p-2 border rounded shadow-sm">
                          <div className="flex-1">
                            <Select value={ing.rawMaterialId.toString()} onValueChange={(val) => handleIngredientChange(idx, val || "")} required>
                              <SelectTrigger className="h-8 text-xs border-gray-300">
                                <SelectValue placeholder="Select Raw Material" />
                              </SelectTrigger>
                              <SelectContent>
                                {RAW_MATERIALS.map(rm => (
                                  <SelectItem key={rm.id} value={rm.id.toString()}>{rm.name} ({rm.unit})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24">
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="Qty" 
                              value={ing.quantity} 
                              onChange={(e) => handleQuantityChange(idx, e.target.value)} 
                              required 
                              className="h-8 text-xs border-gray-300" 
                            />
                          </div>
                          <div className="w-10 text-xs text-gray-500 font-medium">
                            {ing.unit || "-"}
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleRemoveIngredient(idx)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter className="mt-4 flex gap-3 sm:justify-end">
                <DialogClose render={<Button type="button" variant="outline" className="w-full sm:w-auto" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
                  Save Recipe
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search recipes by product..." 
              className="pl-9 bg-gray-50 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <TableHead className="py-3">Product Variant</TableHead>
              <TableHead>Ingredients</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecipes.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No recipes found.
                </TableCell>
              </TableRow>
            )}
            {filteredRecipes.map((r) => (
              <TableRow key={r.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell className="py-4">
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-orange-400" />
                    {r.productName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.ingredients.map((ing, idx) => (
                      <span key={idx} className="inline-flex items-center text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100">
                        {ing.name}: {ing.quantity}{ing.unit}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Edit">
                      <Edit className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => deleteRecipe(r.id)}>
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
