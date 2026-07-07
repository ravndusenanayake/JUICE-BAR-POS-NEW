"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, PowerOff, Power } from "lucide-react"

// Dummy Data
const INITIAL_USERS = [
  { id: "USR-001", name: "Admin User", email: "admin@juicebar.com", role: "Super Admin", branch: "All Branches", status: "Active" },
  { id: "USR-002", name: "Sarah Smith", email: "sarah@juicebar.com", role: "Branch Manager", branch: "Colombo 07", status: "Active" },
  { id: "USR-003", name: "Mike Johnson", email: "mike@juicebar.com", role: "Cashier", branch: "Colombo 07", status: "Active" },
  { id: "USR-004", name: "David Brown", email: "david@juicebar.com", role: "Store Keeper", branch: "Nugegoda", status: "Inactive" },
]

export default function UsersPage() {
  const [users, setUsers] = useState(INITIAL_USERS)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [maxUsersLimit, setMaxUsersLimit] = useState(10) // Default 10

  useEffect(() => {
    const limit = localStorage.getItem("maxUsers")
    if (limit) setMaxUsersLimit(parseInt(limit))
  }, [])
  
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

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check Limits (SaaS License Logic)
    if (users.length >= maxUsersLimit) {
      alert(`License Limit Reached! You can only create up to ${maxUsersLimit} users. Please contact the Super Admin to upgrade your plan.`)
      return
    }

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      alert("A user with this email already exists!")
      return
    }

    const newUser = {
      id: `USR-00${users.length + 1}`,
      name,
      email,
      role,
      branch: (role === 'Super Admin' || role === 'Admin') ? 'All Branches' : branch,
      status
    }

    setUsers([newUser, ...users])
    setIsDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    setRole("")
    setBranch("")
    setStatus("Active")
  }

  const toggleStatus = (id: string, currentStatus: string) => {
    setUsers(users.map(user => 
      user.id === id 
        ? { ...user, status: currentStatus === 'Active' ? 'Inactive' : 'Active' }
        : user
    ))
  }

  const deleteUser = (id: string) => {
    if(confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter(user => user.id !== id))
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
                        <SelectItem value="Nugegoda">Nugegoda</SelectItem>
                        <SelectItem value="Mount Lavinia">Mount Lavinia</SelectItem>
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
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'Super Admin' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-foreground'}`}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.branch}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {user.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      title={user.status === 'Active' ? 'Deactivate' : 'Activate'}
                      onClick={() => toggleStatus(user.id, user.status)}
                      disabled={user.role === 'Super Admin'}
                    >
                      {user.status === 'Active' ? <PowerOff className="h-4 w-4 text-orange-500" /> : <Power className="h-4 w-4 text-green-500" />}
                    </Button>
                    <Button variant="ghost" size="icon" title="Edit">
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => deleteUser(user.id)} disabled={user.role === 'Super Admin'}>
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
