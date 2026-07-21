"use client"
import { toast } from 'sonner';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Edit, Trash2, Scale, Droplets, Hash, Box } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Delete Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [type, setType] = useState("Other")
  const [isBaseUnit, setIsBaseUnit] = useState(true)
  const [baseUnitCode, setBaseUnitCode] = useState("")
  const [conversionFactor, setConversionFactor] = useState("1")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/units')
      if (res.ok) {
        const data = await res.json()
        setUnits(data)
      }
    } catch (error) {
      toast.error("Failed to load units")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const availableBaseUnits = units.filter(u => u.isBaseUnit && u.type === type && u.code !== code)

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    if (units.some(u => u.code.toLowerCase() === code.toLowerCase() && u._id !== editingId)) {
      toast.error("A unit with this short code already exists!")
      setIsSaving(false)
      return
    }

    if (!isBaseUnit && (!baseUnitCode || parseFloat(conversionFactor) <= 0)) {
      toast.error("Please select a base unit and provide a valid conversion factor.")
      setIsSaving(false)
      return
    }

    const unitData = {
      name,
      code,
      type,
      isBaseUnit,
      baseUnitCode: isBaseUnit ? undefined : baseUnitCode,
      conversionFactor: isBaseUnit ? 1 : parseFloat(conversionFactor),
      status: isActive ? "Active" : "Inactive"
    }

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/units/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(unitData)
        })
      } else {
        res = await fetch('/api/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(unitData)
        })
      }

      if (res.ok) {
        toast.success(editingId ? "Unit updated!" : "Unit created!")
        fetchUnits()
        setIsDialogOpen(false)
        resetForm()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to save unit")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setCode("")
    setType("Other")
    setIsBaseUnit(true)
    setBaseUnitCode("")
    setConversionFactor("1")
    setIsActive(true)
  }

  const openEdit = (unit: any) => {
    setEditingId(unit._id)
    setName(unit.name)
    setCode(unit.code)
    setType(unit.type || "Other")
    setIsBaseUnit(unit.isBaseUnit !== false)
    setBaseUnitCode(unit.baseUnitCode || "")
    setConversionFactor(unit.conversionFactor?.toString() || "1")
    setIsActive(unit.status === "Active")
    setIsDialogOpen(true)
  }

  const toggleStatus = async (unit: any) => {
    try {
      const res = await fetch(`/api/units/${unit._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: unit.status === 'Active' ? 'Inactive' : 'Active' })
      })
      if (res.ok) {
        toast.success("Status updated")
        fetchUnits()
      }
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setIsDeleteDialogOpen(true)
  }

  const deleteUnit = async () => {
    if(!deletingId) return;
    try {
      const res = await fetch(`/api/units/${deletingId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Unit deleted")
        fetchUnits()
      } else {
        toast.error("Failed to delete unit")
      }
    } catch (error) {
      toast.error("Error deleting unit")
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'Weight': return <Scale className="h-4 w-4 text-orange-400" />
      case 'Volume': return <Droplets className="h-4 w-4 text-blue-400" />
      case 'Count': return <Hash className="h-4 w-4 text-green-400" />
      default: return <Box className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Units Management</h2>
          <p className="text-muted-foreground">Manage measurement units and conversion logic.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-orange-500 hover:bg-orange-600 text-white" />}>
            <Plus className="mr-2 h-4 w-4" /> Add New Unit
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSaveUnit}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Unit" : "Add New Unit"}</DialogTitle>
                <DialogDescription>
                  Define standard measurements like Grams, Liters, or Pieces.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Unit Name *</Label>
                  <Input id="name" placeholder="e.g. Kilogram" value={name} onChange={(e) => setName(e.target.value)} required className="border-gray-300" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="code" className="text-sm font-medium text-gray-700">Short Code *</Label>
                    <Input id="code" placeholder="e.g. kg" value={code} onChange={(e) => setCode(e.target.value)} required className="border-gray-300" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-gray-700">Unit Type *</Label>
                    <Select value={type} onValueChange={(val) => val && setType(val)}>
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Weight">Weight (g, kg)</SelectItem>
                        <SelectItem value="Volume">Volume (ml, L)</SelectItem>
                        <SelectItem value="Count">Count (pcs, box)</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="base-unit-toggle" className="text-sm font-medium text-gray-700">Is this a Base Unit?</Label>
                      <p className="text-xs text-gray-500">E.g., Grams (g) is a base unit. Kilograms (kg) is NOT.</p>
                    </div>
                    <Switch 
                      id="base-unit-toggle" 
                      checked={isBaseUnit} 
                      onCheckedChange={setIsBaseUnit} 
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>

                  {!isBaseUnit && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="grid gap-2">
                        <Label className="text-xs font-medium text-gray-700">Base Unit</Label>
                        <Select value={baseUnitCode} onValueChange={(val) => val && setBaseUnitCode(val)}>
                          <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableBaseUnits.map(u => (
                              <SelectItem key={u.code} value={u.code}>{u.name} ({u.code})</SelectItem>
                            ))}
                            {availableBaseUnits.length === 0 && (
                              <SelectItem value="none" disabled>No base units available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs font-medium text-gray-700">1 {code || '[New]'} equals</Label>
                        <div className="flex items-center gap-2">
                          <Input type="number" min="0.0001" step="any" value={conversionFactor} onChange={(e) => setConversionFactor(e.target.value)} required className="border-gray-300 flex-1" />
                          <span className="text-xs text-gray-500 font-medium">{baseUnitCode || '?'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="status-toggle" className="text-sm font-medium text-gray-700">Active Status</Label>
                  <Switch 
                    id="status-toggle" 
                    checked={isActive} 
                    onCheckedChange={setIsActive} 
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
              
              <DialogFooter className="mt-4 flex gap-3 sm:justify-end">
                <DialogClose render={<Button type="button" variant="outline" className="w-full sm:w-auto" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingId ? 'Update' : 'Create'}
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

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <TableHead className="py-3">Unit Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Conversion Logic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredUnits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No units found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUnits.map((u) => (
                  <TableRow key={u._id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <TableCell className="py-4">
                      <div className="font-semibold text-gray-800 flex items-center gap-2">
                        {getTypeIcon(u.type)}
                        {u.name}
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold uppercase ml-1">
                          {u.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">
                        {u.type || 'Other'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.isBaseUnit ? (
                        <span className="text-xs font-semibold text-gray-400 border border-dashed border-gray-300 px-2 py-1 rounded-full">Base Unit</span>
                      ) : (
                        <div className="text-sm bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1 rounded-full inline-block font-medium">
                          1 <span className="font-bold">{u.code}</span> = {u.conversionFactor} <span className="font-bold">{u.baseUnitCode}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={u.status === 'Active'} 
                        onCheckedChange={() => toggleStatus(u)} 
                        className="data-[state=checked]:bg-green-500"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(u)}>
                          <Edit className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete" onClick={() => confirmDelete(u._id)}>
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this unit? This action cannot be undone. Make sure no raw materials or products are using this unit.
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
