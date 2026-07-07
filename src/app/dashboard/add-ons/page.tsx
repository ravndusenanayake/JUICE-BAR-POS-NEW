"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit, Trash2, Tag } from "lucide-react"
import { Switch } from "@/components/ui/switch"

// Dummy Data
const INITIAL_ADDONS = [
  { id: 1, name: "Ice Cream Scoop", price: 150.00, status: true },
  { id: 2, name: "Bee Honey", price: 100.00, status: true },
  { id: 3, name: "Chia Seeds", price: 50.00, status: true },
  { id: 4, name: "Protein Powder", price: 200.00, status: false },
]

export default function AddOnsPage() {
  const [addons, setAddons] = useState(INITIAL_ADDONS)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form State
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [isActive, setIsActive] = useState(true)

  const filteredAddons = addons.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddAddon = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (addons.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      alert("An add-on with this name already exists!")
      return
    }

    const newAddon = {
      id: addons.length + 1,
      name,
      price: parseFloat(price) || 0,
      status: isActive
    }

    setAddons([newAddon, ...addons])
    setIsDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setPrice("")
    setIsActive(true)
  }

  const toggleStatus = (id: number) => {
    setAddons(addons.map(a => 
      a.id === id ? { ...a, status: !a.status } : a
    ))
  }

  const deleteAddon = (id: number) => {
    if(confirm("Are you sure you want to delete this add-on?")) {
      setAddons(addons.filter(a => a.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Add-On Management</h2>
          <p className="text-muted-foreground">Manage optional extras that customers can add to their orders.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add New Add-On
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddAddon}>
              <DialogHeader>
                <DialogTitle>Add New Add-On</DialogTitle>
                <DialogDescription>
                  Create an optional extra like Honey or Ice Cream.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Add-On Name *</Label>
                  <Input id="name" placeholder="e.g. Ice Cream Scoop" value={name} onChange={(e) => setName(e.target.value)} required className="border-gray-300" />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700">Price (Rs.) *</Label>
                  <Input id="price" type="number" step="0.01" placeholder="e.g. 150.00" value={price} onChange={(e) => setPrice(e.target.value)} required className="border-gray-300" />
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
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
                  Create Add-On
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
            {filteredAddons.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No add-ons found.
                </TableCell>
              </TableRow>
            )}
            {filteredAddons.map((a) => (
              <TableRow key={a.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell className="py-4">
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-orange-400" />
                    {a.name}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">LKR {a.price.toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <Switch 
                    checked={a.status} 
                    onCheckedChange={() => toggleStatus(a.id)} 
                    className="data-[state=checked]:bg-green-500"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Edit">
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
