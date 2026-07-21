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
import { Plus, Search, Trash2, Pencil } from "lucide-react"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [maxUsersLimit, setMaxUsersLimit] = useState(10) // Default 10
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Form State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [branch, setBranch] = useState("")
  const [status, setStatus] = useState("Active")

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check Limits (SaaS License Logic)
    if (users.length >= maxUsersLimit) {
      toast.error(`License Limit Reached! You can only create up to ${maxUsersLimit} users. Please contact the Super Admin to upgrade your plan.`)
      return
    }

    const payload = {
      name,
      email,
      password,
      role,
      branch: (role === 'Super Admin' || role === 'Admin') ? 'All Branches' : branch,
      status
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        fetchUsers()
        setIsDialogOpen(false)
        resetForm()
      } else {
        const err = await res.json()
        toast.error("Failed to create user: " + (err.error || ""))
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast.error("Error creating user")
    }
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    setRole("")
    setBranch("")
    setStatus("Active")
    setEditingUserId(null)
  }

  const openEditDialog = (user: any) => {
    setName(user.name)
    setEmail(user.email)
    setPassword("") // Leave blank for security
    setRole(user.role)
    setBranch(user.branch)
    setStatus(user.status)
    setEditingUserId(user._id)
    setIsEditDialogOpen(true)
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUserId) return;

    const payload: any = {
      name,
      email,
      role,
      branch: (role === 'Super Admin' || role === 'Admin') ? 'All Branches' : branch,
      status
    }
    
    if (password.trim() !== "") {
      payload.password = password
    }

    try {
      const res = await fetch(`/api/users/${editingUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        fetchUsers()
        setIsEditDialogOpen(false)
        resetForm()
        toast.success("User updated successfully")
      } else {
        const err = await res.json()
        toast.error("Failed to update user: " + (err.error || ""))
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Error updating user")
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: currentStatus === 'Active' ? 'Inactive' : 'Active' })
      })
      if (res.ok) fetchUsers()
    } catch (e) {
      console.error(e)
    }
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setIsDeleteDialogOpen(true)
  }

  const deleteUser = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/users?id=${deletingId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("User deleted successfully!");
        fetchUsers();
      } else {
        toast.error("Failed to delete user.");
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage staff accounts, assign roles, and allocate branches.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-primary-foreground" />}>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleAddUser}>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Create a new staff account and assign their role and branch.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Temporary Password <span className="text-red-500">*</span></Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                    <Select value={role} onValueChange={(val) => setRole(val || "")} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Super Admin">Super Admin</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Branch Manager">Branch Manager</SelectItem>
                        <SelectItem value="Store Keeper">Store Keeper</SelectItem>
                        <SelectItem value="Cashier">Cashier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Select value={branch} onValueChange={(val) => setBranch(val || "")} disabled={role === 'Super Admin' || role === 'Admin'} required={role !== 'Super Admin' && role !== 'Admin'}>
                      <SelectTrigger>
                        <SelectValue placeholder={(role === 'Super Admin' || role === 'Admin') ? 'All Branches' : 'Select branch'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Colombo 07">Colombo 07</SelectItem>
                        <SelectItem value="Kandy Branch">Kandy Branch</SelectItem>
                        <SelectItem value="Galle Branch">Galle Branch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create User</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if(!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleEditUser}>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update the user's details, role, and branch.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Full Name <span className="text-red-500">*</span></Label>
                    <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-email">Email Address <span className="text-red-500">*</span></Label>
                    <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-password">New Password (Optional)</Label>
                  <Input id="edit-password" type="password" placeholder="Leave blank to keep current" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-role">Role <span className="text-red-500">*</span></Label>
                    <Select value={role} onValueChange={(val) => setRole(val || "")} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Super Admin">Super Admin</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Branch Manager">Branch Manager</SelectItem>
                        <SelectItem value="Store Keeper">Store Keeper</SelectItem>
                        <SelectItem value="Cashier">Cashier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-branch">Branch</Label>
                    <Select value={branch} onValueChange={(val) => setBranch(val || "")} disabled={role === 'Super Admin' || role === 'Admin'} required={role !== 'Super Admin' && role !== 'Admin'}>
                      <SelectTrigger>
                        <SelectValue placeholder={(role === 'Super Admin' || role === 'Admin') ? 'All Branches' : 'Select branch'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Colombo 07">Colombo 07</SelectItem>
                        <SelectItem value="Kandy Branch">Kandy Branch</SelectItem>
                        <SelectItem value="Galle Branch">Galle Branch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update User</Button>
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
            placeholder="Search users..." 
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
              <TableHead>User Details</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading users...</TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : filteredUsers.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400">
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{user.branch}</span>
                </TableCell>
                <TableCell>
                  <Switch 
                    checked={user.status === 'Active'} 
                    onCheckedChange={() => toggleStatus(user._id, user.status)} 
                    className="data-[state=checked]:bg-green-500"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditDialog(user)}>
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => confirmDelete(user._id)}>
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
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={deleteUser}>
              Yes, Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
