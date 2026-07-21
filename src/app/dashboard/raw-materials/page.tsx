"use client"
import { toast } from 'sonner';

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Droplets } from "lucide-react"
import { Switch } from "@/components/ui/switch"

// Dummy Data
const UNITS = [
  { id: 1, name: "Grams", code: "g" },
  { id: 2, name: "Kilograms", code: "kg" },
  { id: 3, name: "Milliliters", code: "ml" },
  { id: 4, name: "Numbers", code: "Nos" },
]



export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form State
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("")
  const [threshold, setThreshold] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Delete Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/raw-materials')
      if (res.ok) {
        setMaterials(await res.json())
      }
    } catch (err) {
      console.error(err)
    }
  }

  useState(() => {
    fetchMaterials()
  })

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingId && materials.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      toast.error("A raw material with this name already exists!")
      return
    }

    try {
      const payload = {
        name,
        category: 'General',
        unit,
        minStockLevel: parseFloat(threshold) || 0,
        status: isActive ? 'Active' : 'Inactive'
      }

      if (editingId) {
        // Edit mode
        const res = await fetch('/api/raw-materials', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload })
        })
        if (res.ok) {
          toast.success("Raw material updated!")
          await fetchMaterials()
          setIsDialogOpen(false)
          resetForm()
        } else {
          toast.error("Failed to update raw material")
        }
      } else {
        // Create mode
        const skuPrefix = name.substring(0, 3).toUpperCase()
        const skuCode = String(materials.length + 1).padStart(3, '0')
        const generatedSku = `RM-${skuPrefix}-${skuCode}`

        const res = await fetch('/api/raw-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, sku: generatedSku, currentStock: 0 })
        })

        if (res.ok) {
          toast.success("Raw material added!")
          await fetchMaterials()
          setIsDialogOpen(false)
          resetForm()
        } else {
          toast.error("Failed to add raw material")
        }
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred")
    }
  }

  const resetForm = () => {
    setName("")
    setUnit("")
    setThreshold("")
    setIsActive(true)
    setEditingId(null)
  }

  const openEditModal = (m: any) => {
    setEditingId(m._id)
    setName(m.name)
    setUnit(m.unit)
    setThreshold(m.minStockLevel?.toString() || "0")
    setIsActive(m.status === 'Active')
    setIsDialogOpen(true)
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch('/api/raw-materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if(res.ok) {
        fetchMaterials();
      }
    } catch(e) { console.error(e) }
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setIsDeleteDialogOpen(true)
  }

  const deleteMaterial = async () => {
    if(!deletingId) return;
    try {
      const res = await fetch(`/api/raw-materials?id=${deletingId}`, { method: 'DELETE' });
      if(res.ok) {
        toast.success("Raw material deleted!");
        fetchMaterials();
      } else {
        toast.error("Failed to delete raw material.");
      }
    } catch(e) { 
      console.error(e) 
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Raw Materials</h2>
          <p className="text-muted-foreground">Manage ingredients, set thresholds for stock alerts, and track usage.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-orange-500 hover:bg-orange-600 text-white" />}>
            <Plus className="mr-2 h-4 w-4" /> Add Raw Material
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddMaterial}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Raw Material" : "Add Raw Material"}</DialogTitle>
                <DialogDescription>
                  SKU will be auto-generated based on the name.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name *</Label>
                  <Input id="name" placeholder="e.g. Sugar" value={name} onChange={(e) => setName(e.target.value)} required className="border-gray-300" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="unit" className="text-sm font-medium text-gray-700">Measurement Unit *</Label>
                    <Select value={unit} onValueChange={(val) => setUnit(val || "")} required>
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map(u => (
                          <SelectItem key={u.id} value={u.code}>{u.name} ({u.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="threshold" className="text-sm font-medium text-gray-700">Reorder Threshold *</Label>
                    <Input id="threshold" type="number" placeholder="e.g. 1000" value={threshold} onChange={(e) => setThreshold(e.target.value)} required className="border-gray-300" />
                  </div>
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
                  {editingId ? "Update Raw Material" : "Save Raw Material"}
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
              placeholder="Search raw materials..." 
              className="pl-9 bg-gray-50 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <TableHead className="py-3">Raw Material</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No raw materials found.
                </TableCell>
              </TableRow>
            )}
            {filteredMaterials.map((m) => (
              <TableRow key={m._id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell className="py-4">
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-orange-400" />
                    {m.name}
                    {m.currentStock <= m.minStockLevel && (
                      <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                        LOW STOCK
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{m.sku}</div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium">
                    {m.unit}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{m.minStockLevel} {m.unit}</span>
                </TableCell>
                <TableCell>
                  <Switch 
                    checked={m.status === 'Active'} 
                    onCheckedChange={() => toggleStatus(m._id, m.status)} 
                    className="data-[state=checked]:bg-green-500"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditModal(m)}>
                      <Edit className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => confirmDelete(m._id)}>
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
              Are you absolutely sure you want to delete this raw material? This action cannot be undone and may affect inventory calculations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={deleteMaterial}>
              Yes, Delete It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
