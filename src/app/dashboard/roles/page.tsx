"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, ShieldAlert, Edit, Trash2, ShieldCheck, CheckCircle2, Circle } from "lucide-react"
import { PERMISSION_GROUPS, PERMISSIONS } from "@/lib/permissions"

// Dummy Data mapped exactly to user requirements
const INITIAL_ROLES = [
  {
    id: "ROLE-001",
    name: "Super Admin",
    permissions: Object.values(PERMISSIONS) // Has everything
  },
  {
    id: "ROLE-001-A",
    name: "Admin",
    permissions: Object.values(PERMISSIONS).filter(p => p !== PERMISSIONS.MANAGE_SYSTEM_SETTINGS) // Has everything except System Settings
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
  const [searchQuery, setSearchQuery] = useState("")

  // Delete Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
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

  const toggleGroup = (groupPerms: string[]) => {
    const allSelected = groupPerms.every(p => selectedPerms.includes(p))
    if (allSelected) {
      setSelectedPerms(prev => prev.filter(p => !groupPerms.includes(p)))
    } else {
      setSelectedPerms(prev => {
        const newPerms = [...prev]
        groupPerms.forEach(p => {
          if (!newPerms.includes(p)) newPerms.push(p)
        })
        return newPerms
      })
    }
  }

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName) return

    if (editingRole) {
      setRoles(roles.map(r => r.id === editingRole.id ? { ...r, name: roleName, permissions: selectedPerms as any } : r))
    } else {
      const newRole = {
        id: `ROLE-00${roles.length + 1}`,
        name: roleName,
        permissions: selectedPerms as any
      }
      setRoles([...roles, newRole])
    }
    
    setIsDialogOpen(false)
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setIsDeleteDialogOpen(true)
  }

  const deleteRole = () => {
    if(!deletingId) return;
    setRoles(roles.filter(r => r.id !== deletingId))
    setIsDeleteDialogOpen(false)
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-muted-foreground">Manage system access levels via Role-Based Access Control (RBAC).</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-md rounded-lg px-4" onClick={openCreateDialog} />}>
            <Plus className="mr-2 h-4 w-4" /> Create Role
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl md:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-gray-50 border-0 shadow-2xl rounded-2xl">
            <div className="bg-white px-6 py-5 border-b shadow-sm z-10 flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-full border border-orange-200">
                <ShieldCheck className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {editingRole ? 'Edit Role Configuration' : 'Create New Role'}
                </DialogTitle>
                <DialogDescription className="text-gray-500 mt-1">
                  Define the role name and toggle specific permissions.
                </DialogDescription>
              </div>
            </div>
            
            <form onSubmit={handleSaveRole} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                
                {/* Role Name Input */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    Role Name <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Assistant Manager, Cashier, Kitchen Staff" 
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    required
                    className="h-12 text-lg border-gray-300 bg-gray-50/50 focus-visible:ring-orange-500"
                  />
                </div>

                {/* Permissions Matrix */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-lg text-gray-800">Permissions Matrix</h3>
                    <span className="text-sm font-medium text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                      {selectedPerms.length} Selected
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {PERMISSION_GROUPS.map((group) => {
                      const isAllSelected = group.permissions.every(p => selectedPerms.includes(p))
                      
                      return (
                        <div key={group.group} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                          {/* Group Header */}
                          <div className="bg-gray-50/80 border-b px-5 py-3 flex items-center justify-between">
                            <h4 className="font-semibold text-gray-800">{group.group}</h4>
                            <button 
                              type="button" 
                              onClick={() => toggleGroup(group.permissions)}
                              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-white px-2 py-1 rounded border hover:bg-orange-50 transition-colors"
                            >
                              {isAllSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          
                          {/* Group Permissions */}
                          <div className="p-4 flex flex-wrap gap-2">
                            {group.permissions.map((perm) => {
                              const isSelected = selectedPerms.includes(perm)
                              return (
                                <div 
                                  key={perm} 
                                  onClick={() => togglePermission(perm)}
                                  className={`
                                    cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 select-none
                                    ${isSelected 
                                      ? 'bg-orange-500 border-orange-500 text-white shadow-md transform scale-[1.02]' 
                                      : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50'
                                    }
                                  `}
                                >
                                  {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5 opacity-40" />}
                                  {perm.replace(/_/g, ' ')}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white px-6 py-4 border-t shrink-0 flex justify-end gap-3 rounded-b-2xl">
                <Button type="button" variant="outline" className="border-gray-300" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg px-8">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="font-semibold text-gray-600">Role Name</TableHead>
              <TableHead className="font-semibold text-gray-600">Access Level</TableHead>
              <TableHead className="font-semibold text-gray-600">Permissions Count</TableHead>
              <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => {
              const isSuperAdmin = role.name === "Super Admin";
              return (
                <TableRow key={role.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-bold text-gray-900 flex items-center gap-2 py-4">
                    {isSuperAdmin && <ShieldAlert className="h-4 w-4 text-orange-500" />}
                    {role.name}
                  </TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${isSuperAdmin ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                      {isSuperAdmin ? 'FULL ACCESS' : 'CUSTOM'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border text-xs font-semibold text-gray-600">
                      <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                      {role.permissions.length} Allowed Actions
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="hover:bg-blue-50 hover:text-blue-600 text-gray-400" title="Edit" onClick={() => openEditDialog(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!isSuperAdmin && (
                        <Button variant="ghost" size="icon" title="Delete" onClick={() => confirmDelete(role.id)}>
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
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

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this role? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={deleteRole}>
              Yes, Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
