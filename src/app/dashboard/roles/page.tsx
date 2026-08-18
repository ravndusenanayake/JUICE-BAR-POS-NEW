"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, ShieldAlert, Edit, Trash2, ShieldCheck, CheckCircle2, Circle, Eye } from "lucide-react"
import { PERMISSION_GROUPS, PERMISSIONS } from "@/lib/permissions"
import Swal from 'sweetalert2'
import { toast } from "sonner"

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
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.UPDATE_INVENTORY,
      PERMISSIONS.VIEW_PO,
      PERMISSIONS.CREATE_PO,
      PERMISSIONS.APPROVE_PO,
      PERMISSIONS.VIEW_GRN,
      PERMISSIONS.CREATE_GRN,
      PERMISSIONS.VIEW_WASTAGE,
      PERMISSIONS.CREATE_WASTAGE,
      PERMISSIONS.VIEW_EXPENSES,
      PERMISSIONS.CREATE_EXPENSE,
      PERMISSIONS.VIEW_BRANCH_REPORTS,
      PERMISSIONS.APPROVE_STOCK_TRANSFER,
      PERMISSIONS.VOID_SALE,
      PERMISSIONS.PROCESS_REFUND,
      PERMISSIONS.VIEW_SHIFT_SUMMARY,
      PERMISSIONS.MANAGE_CASH_DRAWER
    ]
  },
  {
    id: "ROLE-003",
    name: "Store Keeper",
    permissions: [
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.UPDATE_INVENTORY,
      PERMISSIONS.VIEW_PO,
      PERMISSIONS.CREATE_PO,
      PERMISSIONS.VIEW_GRN,
      PERMISSIONS.CREATE_GRN,
      PERMISSIONS.VIEW_STOCK_TRANSFERS,
      PERMISSIONS.CREATE_STOCK_TRANSFER,
      PERMISSIONS.VIEW_WASTAGE,
      PERMISSIONS.CREATE_WASTAGE
    ]
  },
  {
    id: "ROLE-004",
    name: "Cashier",
    permissions: [
      PERMISSIONS.ACCESS_POS,
      PERMISSIONS.PROCESS_SALES,
      PERMISSIONS.VIEW_CUSTOMERS,
      PERMISSIONS.CREATE_CUSTOMER
    ]
  }
]

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewRole, setViewRole] = useState<any>(null)
  
  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles')
      if (res.ok) {
        setRoles(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
  }
  
  // Form State
  const [roleName, setRoleName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

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

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName) return

    try {
      if (editingRole) {
        const id = editingRole._id || editingRole.id;
        const res = await fetch(`/api/roles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: roleName, permissions: selectedPerms })
        })
        if (res.ok) {
          toast.success("Role updated successfully")
          fetchRoles()
          setIsDialogOpen(false)
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || "Failed to update role")
        }
      } else {
        const res = await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: roleName, permissions: selectedPerms })
        })
        if (res.ok) {
          toast.success("Role created successfully")
          fetchRoles()
          setIsDialogOpen(false)
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || "Failed to create role")
        }
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred")
    }
  }

  const confirmDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this! Users assigned to this role might lose access.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setRoles(roles.filter(r => (r._id || r.id) !== id));
          fetchRoles();
          Swal.fire('Deleted!', 'Role has been deleted.', 'success')
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || "Failed to delete role.");
        }
      } catch (err) {
        console.error(err);
      }
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
                <Button type="button" variant="outline"  onClick={() => setIsDialogOpen(false)}>
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
              const roleId = role._id || role.id;
              return (
                <TableRow key={roleId} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-bold text-gray-900 flex items-center gap-2 py-4 px-6">
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
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-8 w-8" title="View" onClick={() => {
                        setViewRole(role)
                        setIsViewOpen(true)
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8" title="Edit" onClick={() => openEditDialog(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!isSuperAdmin && (
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Delete" onClick={() => confirmDelete(roleId)}>
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

      {/* VIEW ROLE MODAL */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl bg-white border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
          <div className="p-6 border-b bg-gray-50 flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full border border-blue-200">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {viewRole?.name}
              </DialogTitle>
              <DialogDescription className="text-gray-500 mt-1 font-medium">
                Assigned Permissions
              </DialogDescription>
            </div>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto bg-gray-50/50">
            {(!viewRole?.permissions || viewRole.permissions.length === 0) ? (
              <p className="text-sm text-gray-500 w-full text-center py-4 bg-white rounded-xl border border-dashed">No permissions assigned.</p>
            ) : (
              <div className="space-y-6">
                {PERMISSION_GROUPS.map(group => {
                  const assignedInGroup = group.permissions.filter(p => viewRole?.permissions?.includes(p));
                  if (assignedInGroup.length === 0) return null;
                  
                  return (
                    <div key={group.group} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gray-100/80 px-4 py-2 border-b flex items-center justify-between">
                        <h4 className="font-bold text-gray-800 text-sm">{group.group}</h4>
                        <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                          {assignedInGroup.length}
                        </span>
                      </div>
                      <div className="p-4 flex flex-wrap gap-2">
                        {assignedInGroup.map((perm: string) => (
                          <div key={perm} className="bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg text-xs font-bold text-orange-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                            {perm.replace(/_/g, ' ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter className="p-6 border-t bg-gray-50">
            <Button variant="outline" className="font-bold w-full" onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
