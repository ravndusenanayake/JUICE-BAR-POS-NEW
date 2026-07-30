"use client"
import { toast } from 'sonner';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import Swal from 'sweetalert2'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newStatus, setNewStatus] = useState("Active")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.map((c: any) => ({ ...c, id: c._id })))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName) return

    setIsSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/categories/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, description: newDesc, status: newStatus })
        })
        
        if (res.ok) {
          fetchCategories()
          setIsDialogOpen(false)
          resetForm()
        } else {
          const err = await res.json()
          toast.error(err.error || "Failed to update category")
        }
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, description: newDesc, status: newStatus })
        })
        
        if (res.ok) {
          fetchCategories()
          setIsDialogOpen(false)
          resetForm()
        } else {
          const err = await res.json()
          toast.error(err.error || "Failed to create category")
        }
      }
    } catch (error) {
      console.error(error)
      toast.error("Error saving category")
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setNewName("")
    setNewDesc("")
    setNewStatus("Active")
  }

  const handleEdit = (cat: any) => {
    setEditingId(cat.id)
    setNewName(cat.name)
    setNewDesc(cat.description || "")
    setNewStatus(cat.status)
    setIsDialogOpen(true)
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchCategories()
      } else {
        toast.error("Failed to update status")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const confirmDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this! Ensure no products are actively using this category.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
        if (res.ok) {
          fetchCategories()
          Swal.fire('Deleted!', 'Category has been deleted.', 'success')
        } else {
          const err = await res.json()
          toast.error(err.error || "Failed to delete category")
        }
      } catch (error) {
        console.error(error)
        toast.error("Error deleting category")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categories (Master Data)</h2>
          <p className="text-muted-foreground">Manage product categories globally across all branches.</p>
        </div>
        
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSaveCategory}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Category" : "Create New Category"}</DialogTitle>
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Category"}</Button>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading categories...</TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : filteredCategories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-bold">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground">{cat.description || "N/A"}</TableCell>
                <TableCell>
                  <Switch 
                    checked={cat.status === 'Active'} 
                    onCheckedChange={() => toggleStatus(cat.id, cat.status)} 
                    className="data-[state=checked]:bg-green-500"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(cat)}>
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => confirmDelete(cat.id)}>
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
