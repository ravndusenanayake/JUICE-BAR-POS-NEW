"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MoreHorizontal, Edit, Power, PowerOff, Trash2 } from "lucide-react"

const INITIAL_CATEGORIES = [
  { id: "CAT-001", name: "Smoothies", description: "Blended beverages with fresh fruits and yogurt", status: "Active" },
  { id: "CAT-002", name: "Fresh Juices", description: "100% natural cold-pressed juices", status: "Active" },
  { id: "CAT-003", name: "Fruit Bowls", description: "Acai and pitaya bowls with toppings", status: "Active" },
  { id: "CAT-004", name: "Add-ons", description: "Extra protein, seeds, and vitamins", status: "Active" },
  { id: "CAT-005", name: "Seasonal Treats", description: "Limited time winter/summer specials", status: "Inactive" },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form State
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newStatus, setNewStatus] = useState("Active")

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName) return

    // Enforce uniqueness (Acceptance Criteria)
    if (categories.some(c => c.name.toLowerCase() === newName.toLowerCase())) {
      alert("Category name must be unique!")
      return
    }

    const newCategory = {
      id: `CAT-00${categories.length + 1}`,
      name: newName,
      description: newDesc,
      status: newStatus
    }

    setCategories([newCategory, ...categories])
    setIsDialogOpen(false)
    
    // Reset form
    setNewName("")
    setNewDesc("")
    setNewStatus("Active")
  }

  const toggleStatus = (id: string, currentStatus: string) => {
    setCategories(categories.map(cat => 
      cat.id === id 
        ? { ...cat, status: currentStatus === 'Active' ? 'Inactive' : 'Active' }
        : cat
    ))
  }

  const deleteCategory = (id: string) => {
    if(confirm("Are you sure you want to delete this category?")) {
      setCategories(categories.filter(cat => cat.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categories (Master Data)</h2>
          <p className="text-muted-foreground">Manage product categories globally across all branches.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-primary-foreground" />}>
            <Plus className="mr-2 h-4 w-4" /> Create Category
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddCategory}>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>
                  Categories are visible to all branches. Inactive categories cannot be selected for new products.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Category Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Hot Beverages" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Description</Label>
                  <Input 
                    id="desc" 
                    placeholder="Brief description..." 
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                  <Select value={newStatus} onValueChange={(val) => setNewStatus(val || "")} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Category</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search categories..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            )}
            {filteredCategories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-bold">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground">{cat.description || "N/A"}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {cat.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      title={cat.status === 'Active' ? 'Deactivate' : 'Activate'}
                      onClick={() => toggleStatus(cat.id, cat.status)}
                    >
                      {cat.status === 'Active' ? <PowerOff className="h-4 w-4 text-orange-500" /> : <Power className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Button variant="ghost" size="icon" title="Edit">
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => deleteCategory(cat.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
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
