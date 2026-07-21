"use client"
import { toast } from 'sonner';

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit, Trash2, Scale } from "lucide-react"
import { Switch } from "@/components/ui/switch"

// Dummy Data
const INITIAL_UNITS = [
  { id: 1, name: "Grams", code: "g", status: true },
  { id: 2, name: "Kilograms", code: "kg", status: true },
  { id: 3, name: "Milliliters", code: "ml", status: true },
  { id: 4, name: "Liters", code: "L", status: true },
  { id: 5, name: "Numbers", code: "Nos", status: true },
]

export default function UnitsPage() {
  const [units, setUnits] = useState(INITIAL_UNITS)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Delete Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  
  // Form State
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [isActive, setIsActive] = useState(true)

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (units.some(u => u.code.toLowerCase() === code.toLowerCase())) {
      toast.error("A unit with this short code already exists!")
      return
    }

    const newUnit = {
      id: units.length + 1,
      name,
      code,
      status: isActive
    }

    setUnits([newUnit, ...units])
    setIsDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setCode("")
    setIsActive(true)
  }

  const toggleStatus = (id: number) => {
    setUnits(units.map(u => 
      u.id === id ? { ...u, status: !u.status } : u
    ))
  }

  const confirmDelete = (id: number) => {
    setDeletingId(id)
    setIsDeleteDialogOpen(true)
  }

  const deleteUnit = () => {
    if(!deletingId) return;
    setUnits(units.filter(u => u.id !== deletingId))
    setIsDeleteDialogOpen(false)
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Units Management</h2>
          <p className="text-muted-foreground">Manage measurement units for raw materials and products.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-orange-500 hover:bg-orange-600 text-white" />}>
            <Plus className="mr-2 h-4 w-4" /> Add New Unit
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddUnit}>
              <DialogHeader>
                <DialogTitle>Add New Unit</DialogTitle>
                <DialogDescription>
                  Create a new measurement unit like Grams (g).
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Unit Name *</Label>
                  <Input id="name" placeholder="e.g. Grams" value={name} onChange={(e) => setName(e.target.value)} required className="border-gray-300" />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="code" className="text-sm font-medium text-gray-700">Short Code *</Label>
                  <Input id="code" placeholder="e.g. g" value={code} onChange={(e) => setCode(e.target.value)} required className="border-gray-300" />
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
                <DialogClose render={<Button type="button" variant="outline" className="w-full sm:w-auto" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
                  Create Unit
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
              placeholder="Search units..." 
              className="pl-9 bg-gray-50 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <TableHead className="py-3">Unit Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUnits.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No units found.
                </TableCell>
              </TableRow>
            )}
            {filteredUnits.map((u) => (
              <TableRow key={u.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell className="py-4">
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-orange-400" />
                    {u.name}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium">
                    {u.code}
                  </span>
                </TableCell>
                <TableCell>
                  <Switch 
                    checked={u.status} 
                    onCheckedChange={() => toggleStatus(u.id)} 
                    className="data-[state=checked]:bg-green-500"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Edit">
                      <Edit className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => confirmDelete(u.id)}>
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this unit? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={deleteUnit}>
              Yes, Delete Unit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
