"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, ShieldAlert, Edit, Trash2 } from "lucide-react"
import { PERMISSION_GROUPS, PERMISSIONS } from "@/lib/permissions"

// Dummy Data mapped exactly to user requirements
const INITIAL_ROLES = [
  {
    id: "ROLE-001",
    name: "Super Admin",
    permissions: Object.values(PERMISSIONS) // Has everything
  },
  {
    id: "ROLE-002",
    name: "Branch Manager",
    permissions: [
      PERMISSIONS.VIEW_ASSIGNED_BRANCH,
      PERMISSIONS.MANAGE_INVENTORY,
      PERMISSIONS.MANAGE_PO,
      PERMISSIONS.MANAGE_GRN,
      PERMISSIONS.MANAGE_WASTAGE,
      PERMISSIONS.MANAGE_EXPENSES,
      PERMISSIONS.VIEW_BRANCH_REPORTS,
      PERMISSIONS.APPROVE_STOCK_TRANSFERS
    ]
  },
  {
    id: "ROLE-003",
    name: "Store Keeper",
    permissions: [
      PERMISSIONS.MANAGE_INVENTORY,
      PERMISSIONS.MANAGE_PO,
      PERMISSIONS.MANAGE_GRN,
      PERMISSIONS.STOCK_TRANSFERS,
      PERMISSIONS.MANAGE_WASTAGE
    ]
  },
  {
    id: "ROLE-004",
    name: "Cashier",
    permissions: [
      PERMISSIONS.POS_SALES,
      PERMISSIONS.CUSTOMER_MANAGEMENT,
      PERMISSIONS.RECEIPT_PRINTING
    ]
  }
]

export default function RolesPage() {
  const [roles, setRoles] = useState(INITIAL_ROLES)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  
  // Form State
  const [roleName, setRoleName] = useState("")
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  const openCreateDialog = () => {
    setEditingRole(null)
    setRoleName("")
    setSelectedPerms([])
    setIsDialogOpen(true)
  }

  const openEditDialog = (role: any) => {
    setEditingRole(role)
    setRoleName(role.name)
    setSelectedPerms(role.permissions)
    setIsDialogOpen(true)
  }

  const togglePermission = (perm: string) => {
    setSelectedPerms(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    )
  }

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName) return

    if (editingRole) {
      setRoles(roles.map(r => r.id === editingRole.id ? { ...r, name: roleName, permissions: selectedPerms } : r))
    } else {
      const newRole = {
        id: `ROLE-00${roles.length + 1}`,
        name: roleName,
        permissions: selectedPerms
      }
      setRoles([...roles, newRole])
    }
    
    setIsDialogOpen(false)
  }

  const deleteRole = (id: string) => {
    if(confirm("Are you sure you want to delete this role?")) {
      setRoles(roles.filter(r => r.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-muted-foreground">Manage system access levels via Role-Based Access Control (RBAC).</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={openCreateDialog} />}>
            <Plus className="mr-2 h-4 w-4" /> Create Role
          </DialogTrigger>
          <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <form onSubmit={handleSaveRole} className="flex flex-col h-full">
              <DialogHeader className="shrink-0">
                <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                <DialogDescription>
                  Define the role name and select the specific permissions granted to this role.
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Role Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Assistant Manager" 
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Permissions Matrix</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PERMISSION_GROUPS.map((group) => (
                      <div key={group.group} className="space-y-3 bg-muted/30 p-4 rounded-lg border">
                        <h4 className="font-medium text-primary">{group.group}</h4>
                        {group.permissions.map((perm) => (
                          <div key={perm} className="flex items-start space-x-3">
                            <Checkbox 
                              id={perm} 
                              checked={selectedPerms.includes(perm)}
                              onCheckedChange={() => togglePermission(perm)}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={perm}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {perm.replace(/_/g, ' ')}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="shrink-0 pt-4 border-t">
                <Button type="submit">Save Role</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Access Level</TableHead>
              <TableHead>Permissions Count</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => {
              const isSuperAdmin = role.name === "Super Admin";
              return (
                <TableRow key={role.id}>
                  <TableCell className="font-bold flex items-center gap-2">
                    {isSuperAdmin && <ShieldAlert className="h-4 w-4 text-primary" />}
                    {role.name}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isSuperAdmin ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-foreground'}`}>
                      {isSuperAdmin ? 'Full Access' : 'Custom'}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.permissions.length} allowed actions
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditDialog(role)}>
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      {!isSuperAdmin && (
                        <Button variant="ghost" size="icon" title="Delete" onClick={() => deleteRole(role.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
