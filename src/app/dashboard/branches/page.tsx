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
import { Plus, Search, Edit, Trash2, MapPin } from "lucide-react"

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [maxBranchesLimit, setMaxBranchesLimit] = useState(3) // Default 3
  const [isLoading, setIsLoading] = useState(true)

  // Delete Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches')
      if (res.ok) {
        const data = await res.json()
        setBranches(data)
      }
    } catch (err) {
      console.error("Failed to fetch branches", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const limit = localStorage.getItem("maxBranches")
    if (limit) setMaxBranchesLimit(parseInt(limit))
    fetchBranches()
  }, [])
  
  // Form State
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState("Active")

  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    branch.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (branches.length >= maxBranchesLimit) {
      toast.error(`License Limit Reached! You can only create up to ${maxBranchesLimit} branches. Please contact the Super Admin to upgrade your plan.`)
      return
    }

    if (branches.some(b => b.code.toLowerCase() === code.toLowerCase())) {
      toast.error("A branch with this code already exists!")
      return
    }

    const newBranch = {
      code: code.toUpperCase(),
      name,
      address,
      phone,
      status
    }

    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBranch)
      })
      if (res.ok) {
        fetchBranches()
        setIsDialogOpen(false)
        resetForm()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to add branch")
      }
    } catch (err) {
      console.error("Failed to add branch", err)
      toast.error("An error occurred while adding the branch.")
    }
  }

  const resetForm = () => {
    setCode("")
    setName("")
    setAddress("")
    setPhone("")
    setStatus("Active")
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
    try {
      const res = await fetch(`/api/branches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchBranches()
      }
    } catch (err) {
      console.error("Failed to update status", err)
    }
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setIsDeleteDialogOpen(true)
  }

  const deleteBranch = async () => {
    if(!deletingId) return;
    try {
      const res = await fetch(`/api/branches/${deletingId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchBranches()
      }
    } catch (err) {
      console.error("Failed to delete branch", err)
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Branch Management</h2>
          <p className="text-muted-foreground">Manage your store locations, branches, and statuses.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-orange-500 hover:bg-orange-600 text-white" />}>
            <Plus className="mr-2 h-4 w-4" /> Add Branch
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddBranch}>
              <DialogHeader>
                <DialogTitle>Create New Branch</DialogTitle>
                <DialogDescription>
                  Add a new store location to your POS system.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="code">Branch Code <span className="text-red-500">*</span></Label>
                    <Input id="code" placeholder="e.g. COL-07" value={code} onChange={(e) => setCode(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Branch Name <span className="text-red-500">*</span></Label>
                    <Input id="name" placeholder="e.g. Colombo 07" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="e.g. 123 Ward Place" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="e.g. 011-2345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                    <Select value={status} onValueChange={(val) => setStatus(val || "")} required>
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
              </div>
              <DialogFooter>
                <Button type="submit">Save Branch</Button>
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
            placeholder="Search branches..." 
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
              <TableHead>Branch Details</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Loading branches...
                </TableCell>
              </TableRow>
            ) : filteredBranches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No branches found.
                </TableCell>
              </TableRow>
            ) : filteredBranches.map((branch) => (
              <TableRow key={branch._id || branch.id}>
                <TableCell>
                  <div className="font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {branch.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 px-6 font-mono bg-muted inline-block rounded">
                    Code: {branch.code}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{branch.phone || 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">{branch.address || 'N/A'}</div>
                </TableCell>
                <TableCell>
                  <Switch 
                    checked={branch.status === 'Active'} 
                    onCheckedChange={() => toggleStatus(branch._id || branch.id, branch.status)} 
                    className="data-[state=checked]:bg-green-500"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Edit">
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => confirmDelete(branch._id || branch.id)}>
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
              Are you sure you want to delete this branch? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={deleteBranch}>
              Yes, Delete Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
