"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, Edit, Trash2, Building2 } from "lucide-react"

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  mobile: string
  email: string
  address: string
}

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: "SUP-001", name: "Fresh Farms Ltd", contactPerson: "Kamal Perera", mobile: "0771234567", email: "kamal@freshfarms.lk", address: "123, Kandy Road, Colombo" },
  { id: "SUP-002", name: "Lanka Dairy Co", contactPerson: "Sunil Silva", mobile: "0719876543", email: "sunil@lankadairy.lk", address: "45, Highlevel Road, Nugegoda" },
]

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [name, setName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [mobile, setMobile] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("mock_suppliers")
    if (stored) {
      setSuppliers(JSON.parse(stored))
    } else {
      localStorage.setItem("mock_suppliers", JSON.stringify(INITIAL_SUPPLIERS))
      setSuppliers(INITIAL_SUPPLIERS)
    }
  }, [])

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id)
      setName(supplier.name)
      setContactPerson(supplier.contactPerson)
      setMobile(supplier.mobile)
      setEmail(supplier.email)
      setAddress(supplier.address)
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    let updated: Supplier[]
    
    if (editingId) {
      updated = suppliers.map(s => s.id === editingId ? { id: s.id, name, contactPerson, mobile, email, address } : s)
    } else {
      const newSup: Supplier = {
        id: `SUP-${Date.now().toString().slice(-4)}`,
        name, contactPerson, mobile, email, address
      }
      updated = [...suppliers, newSup]
    }
    
    setSuppliers(updated)
    localStorage.setItem("mock_suppliers", JSON.stringify(updated))
    setIsModalOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      const updated = suppliers.filter(s => s.id !== id)
      setSuppliers(updated)
      localStorage.setItem("mock_suppliers", JSON.stringify(updated))
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
            {filteredSuppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                  <Building2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No suppliers found.</p>
                </TableCell>
              </TableRow>
            )}
            {filteredSuppliers.map((sup) => (
              <TableRow key={sup.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell className="py-4">
                  <div className="font-bold text-gray-900">{sup.name}</div>
                  <div className="text-xs font-medium text-gray-400 mt-0.5 font-mono">{sup.id}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-semibold text-gray-700">{sup.contactPerson}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex flex-col">
                    <span>{sup.mobile}</span>
                    <span>{sup.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600 max-w-xs truncate">{sup.address}</div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => handleOpenModal(sup)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={() => handleDelete(sup.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
              <DialogDescription>Fill in the supplier details below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Supplier Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Fresh Farms" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Contact Person *</Label>
                  <Input value={contactPerson} onChange={e => setContactPerson(e.target.value)} required placeholder="e.g. Nimal" />
                </div>
                <div className="grid gap-2">
                  <Label>Mobile Number *</Label>
                  <Input value={mobile} onChange={e => setMobile(e.target.value)} required placeholder="07XXXXXXXX" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="supplier@example.com" />
              </div>
              <div className="grid gap-2">
                <Label>Address *</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} required placeholder="Full Address" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">Save Supplier</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
