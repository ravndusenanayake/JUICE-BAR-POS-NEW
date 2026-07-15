"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, PowerOff, Power, MapPin } from "lucide-react"

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [maxBranchesLimit, setMaxBranchesLimit] = useState(3) // Default 3
  const [isLoading, setIsLoading] = useState(true)

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
      alert(`License Limit Reached! You can only create up to ${maxBranchesLimit} branches. Please contact the Super Admin to upgrade your plan.`)
      return
    }

    if (branches.some(b => b.code.toLowerCase() === code.toLowerCase())) {
      alert("A branch with this code already exists!")
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
        alert(errorData.error || "Failed to add branch")
      }
    } catch (err) {
      console.error("Failed to add branch", err)
      alert("An error occurred while adding the branch.")
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

  const deleteBranch = async (id: string) => {
    if(confirm("Are you sure you want to delete this branch?")) {
      try {
        const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' })
        if (res.ok) {
          fetchBranches()
        }
      } catch (err) {
        console.error("Failed to delete branch", err)
      }
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
          <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-primary-foreground" />}>
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${branch.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {branch.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      title={branch.status === 'Active' ? 'Deactivate' : 'Activate'}
                      onClick={() => toggleStatus(branch._id || branch.id, branch.status)}
                    >
                      {branch.status === 'Active' ? <PowerOff className="h-4 w-4 text-orange-500" /> : <Power className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Button variant="ghost" size="icon" title="Edit">
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => deleteBranch(branch._id || branch.id)}>
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
