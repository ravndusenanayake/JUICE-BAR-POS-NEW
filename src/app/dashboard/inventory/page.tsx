"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MoreHorizontal } from "lucide-react"

const INITIAL_INVENTORY = [
  { id: "PRD001", name: "Mango Tango Smoothie", category: "Smoothies", price: "$6.50", stock: 120, status: "In Stock" },
  { id: "PRD002", name: "Green Detox Juice", category: "Fresh Juices", price: "$5.00", stock: 45, status: "Low Stock" },
  { id: "PRD003", name: "Acai Energy Bowl", category: "Fruit Bowls", price: "$8.50", stock: 80, status: "In Stock" },
  { id: "PRD004", name: "Ginger Shot", category: "Add-ons", price: "$2.00", stock: 15, status: "Low Stock" },
  { id: "PRD005", name: "Watermelon Breeze", category: "Fresh Juices", price: "$4.50", stock: 200, status: "In Stock" },
]

export default function InventoryPage() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Form State
  const [newName, setNewName] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [newStock, setNewStock] = useState("")

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newCategory || !newPrice) return

    const stockNum = parseInt(newStock) || 0
    const newProduct = {
      id: `PRD00${inventory.length + 1}`,
      name: newName,
      category: newCategory,
      price: `$${parseFloat(newPrice).toFixed(2)}`,
      stock: stockNum,
      status: stockNum > 20 ? "In Stock" : "Low Stock"
    }

    setInventory([newProduct, ...inventory])
    setIsDialogOpen(false)
    
    // Reset form
    setNewName("")
    setNewCategory("")
    setNewPrice("")
    setNewStock("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-muted-foreground">Manage your products, variants, and stock levels.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-primary-foreground" />}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddProduct}>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Enter the details of the new item for your juice bar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Berry Blast Smoothie" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={setNewCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Smoothies">Smoothies</SelectItem>
                      <SelectItem value="Fresh Juices">Fresh Juices</SelectItem>
                      <SelectItem value="Fruit Bowls">Fruit Bowls</SelectItem>
                      <SelectItem value="Add-ons">Add-ons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Selling Price ($)</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      step="0.01" 
                      placeholder="5.99" 
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Initial Stock</Label>
                    <Input 
                      id="stock" 
                      type="number" 
                      placeholder="100" 
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search products..." className="pl-8" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.price}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'In Stock' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {item.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
