"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Activity, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuditLog } from "@/lib/auditLogger"

const CATEGORIES = ["All", "Login", "Product", "Inventory", "Wastage", "Sales", "User Management", "Other"]

export default function AuditLogsPage() {
  const { role } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [dateFilter, setDateFilter] = useState("") // simple YYYY-MM-DD string

  useEffect(() => {
    const stored = localStorage.getItem("mock_audit_logs")
    if (stored) {
      setLogs(JSON.parse(stored))
    }
  }, [])

  if (role !== "Super Admin" && role !== "Admin") {
    return (
      <div className="flex items-center justify-center h-[60vh] text-center px-4">
        <div>
          <Activity className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 font-medium">You do not have permission to view System Audit Logs.</p>
        </div>
      </div>
    )
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.action.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "All" || log.category === categoryFilter
    const matchesDate = !dateFilter || log.timestamp.startsWith(dateFilter)
    
    return matchesSearch && matchesCategory && matchesDate
  })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <Activity className="text-blue-600 w-8 h-8" /> System Audit Trail
          </h2>
          <p className="text-gray-500 font-medium">Track all critical actions, inventory changes, and security events.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search by User or Action..." 
              className="pl-9 h-11 border-gray-200 shadow-sm"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-11 bg-white">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span>{categoryFilter === "All" ? "All Categories" : categoryFilter}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Input 
            type="date" 
            className="w-full sm:w-[180px] h-11 border-gray-200"
            value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <TableHead className="py-4">Date & Time</TableHead>
                <TableHead>User / Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Action Details</TableHead>
                <TableHead className="text-right">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                    <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No logs found matching your criteria.</p>
                  </TableCell>
                </TableRow>
              )}
              {filteredLogs.map(log => (
                <TableRow key={log.id} className="hover:bg-gray-50/50">
                  <TableCell className="py-4">
                    <div className="font-bold text-gray-900">{new Date(log.timestamp).toLocaleDateString()}</div>
                    <div className="text-xs font-medium text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-blue-700">{log.user}</div>
                  </TableCell>
                  <TableCell className="font-medium text-gray-600">{log.branch}</TableCell>
                  <TableCell>
                    <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full">
                      {log.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-800">{log.action}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border">{log.ipAddress}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
