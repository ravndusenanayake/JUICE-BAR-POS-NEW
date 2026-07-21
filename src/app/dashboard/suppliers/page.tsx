"use client"
import { toast } from 'sonner';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, Edit, Trash2, Building2 } from "lucide-react"

export interface Supplier {
  _id: string
  id: string // mapping for UI ease
  name: string
  contactPerson: string
  mobile: string
  email: string
  address: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [name, setName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [mobile, setMobile] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) {
        const data = await res.json()
        const mapped = data.map((s: any) => ({ ...s, id: s._id }))
        setSuppliers(mapped)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id)
      setName(supplier.name)
      setContactPerson(supplier.contactPerson || "")
      setMobile(supplier.mobile || "")
      setEmail(supplier.email || "")
      setAddress(supplier.address || "")
    } else {
      setEditingId(null)
      setName("")
      setContactPerson("")
      setMobile("")
      setEmail("")
      setAddress("")
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        const payload = { id: editingId, name, contactPerson, mobile, email, address }
        const res = await fetch('/api/suppliers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          fetchSuppliers()
          setIsModalOpen(false)
        } else {
          toast.error("Failed to update supplier")
        }
      } else {
        const payload = { name, contactPerson, mobile, email, address }
        const res = await fetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          fetchSuppliers()
          setIsModalOpen(false)
        } else {
          toast.error("Failed to create supplier")
        }
      }
    } catch (err) {
      console.error(err)
      toast.error("Error saving supplier")
    }
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if(!deletingId) return;
    try {
      const res = await fetch(`/api/suppliers?id=${deletingId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchSuppliers()
      } else {
        toast.error("Failed to delete supplier")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Supplier Management</h2>
          <p className="text-gray-500">Manage all raw material and product suppliers.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 px-4">
          <Plus className="w-4 h-4 mr-2" /> Add New Supplier
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="search" placeholder="Search suppliers..." 
              className="pl-9 bg-white border-gray-200 h-10 shadow-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <TableHead className="py-4">Supplier</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-gray-400">Loading suppliers...</TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                  <Building2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No suppliers found.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((sup) => (
                <TableRow key={sup.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <TableCell className="py-4">
                    <div className="font-bold text-gray-900">{sup.name}</div>
                    <div className="text-xs font-medium text-gray-400 mt-0.5 font-mono">{sup._id.substring(0, 8).toUpperCase()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-semibold text-gray-700">{sup.contactPerson || "N/A"}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex flex-col">
                      <span>{sup.mobile || "-"}</span>
                      <span>{sup.email || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 max-w-xs truncate" title={sup.address}>
                      {sup.address || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(sup)}>
                        <Edit className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Delete" onClick={() => confirmDelete(sup.id)}>
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
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
              Are you sure you want to delete this supplier? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
              Yes, Delete Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update supplier details." : "Enter details for the new supplier."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Supplier Name *</Label>
              <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Fresh Farms Ltd" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="e.g. Kamal" />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="e.g. 0771234567" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. supplier@domain.com" />
            </div>
            <div className="space-y-2">
              <Label>Physical Address</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 123, Kandy Road" />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Save Supplier</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
