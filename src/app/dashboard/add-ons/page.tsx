"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit, Trash2, Tag, Archive } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export default function AddOnsPage() {
  const [addons, setAddons] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingAddon, setEditingAddon] = useState<any>(null)
  
  // Form State
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetchAddons()
  }, [])

  const fetchAddons = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/add-ons')
      if (res.ok) {
        const data = await res.json()
        const mapped = data.map((a: any) => ({
          ...a,
          id: a._id
        }))
        setAddons(mapped)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAddons = addons.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !price) return alert("Please fill all required fields")

    setIsSaving(true)
    try {
      if (editingAddon) {
        const payload = {
          id: editingAddon.id, name, price: Number(price), status: isActive ? 'Active' : 'Inactive'
        }
        
        const res = await fetch('/api/add-ons', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if(res.ok) {
          fetchAddons()
          setIsDialogOpen(false)
          resetForm()
        } else {
          const err = await res.json()
          alert("Failed to update add-on: " + (err.error || ""))
        }
      } else {
        const payload = {
          name, price: Number(price), status: isActive ? 'Active' : 'Inactive'
        }
        
        const res = await fetch('/api/add-ons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (res.ok) {
          fetchAddons()
          setIsDialogOpen(false)
          resetForm()
        } else {
          const err = await res.json()
          alert("Failed to create add-on: " + (err.error || ""))
        }
      }
    } catch (error) {
      console.error("Error saving add-on:", error)
      alert("Error saving add-on")
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setName("")
    setPrice("")
    setIsActive(true)
    setEditingAddon(null)
  }

  const handleEdit = (a: any) => {
    setEditingAddon(a)
    setName(a.name)
    setPrice(a.price.toString())
    setIsActive(a.status === 'Active')
    setIsDialogOpen(true)
  }

  const toggleStatus = async (a: any) => {
    try {
      const res = await fetch(`/api/add-ons`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: a.id, status: a.status === 'Active' ? 'Inactive' : 'Active' })
      })
      if (res.ok) {
        fetchAddons()
      } else {
        alert("Failed to update add-on status")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const deleteAddon = async (id: string) => {
    if(confirm("Are you sure you want to permanently delete this add-on?")) {
      try {
        const res = await fetch(`/api/add-ons?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
          fetchAddons()
        } else {
          alert("Failed to delete add-on")
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
          <h2 className="text-2xl font-bold tracking-tight">Add-On Management</h2>
          <p className="text-muted-foreground">Manage optional extras that customers can add to their orders.</p>
        </div>
        
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Add-On
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSaveAddon}>
              <DialogHeader>
                <DialogTitle>{editingAddon ? "Edit Add-On" : "Add New Add-On"}</DialogTitle>
                <DialogDescription>
                  Create an optional extra like Honey or Ice Cream.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Add-On Name <span className="text-red-500">*</span></Label>
                  <Input id="name" placeholder="e.g. Ice Cream Scoop" value={name} onChange={(e) => setName(e.target.value)} required className="border-gray-300" />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700">Price (Rs.) <span className="text-red-500">*</span></Label>
                  <Input id="price" type="number" step="0.01" min="0" placeholder="e.g. 150.00" value={price} onChange={(e) => setPrice(e.target.value)} required className="border-gray-300" />
                </div>
                
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
              
              <DialogFooter className="mt-4 flex gap-3 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
                  {isSaving ? "Saving..." : (editingAddon ? "Save Changes" : "Create Add-On")}
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
              placeholder="Search add-ons..." 
              className="pl-9 bg-gray-50 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-600">Add-Ons List ({filteredAddons.length})</h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <TableHead className="py-3">Add-On Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading add-ons...</TableCell>
              </TableRow>
            ) : filteredAddons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No add-ons found.
                </TableCell>
              </TableRow>
            ) : filteredAddons.map((a) => (
              <TableRow key={a.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell className="py-4">
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-orange-400" />
                    {a.name}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">Rs. {a.price?.toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <Switch 
                    checked={a.status === 'Active'} 
                    onCheckedChange={() => toggleStatus(a)} 
                    className="data-[state=checked]:bg-green-500"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(a)}>
                      <Edit className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => deleteAddon(a.id)}>
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
