"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatStockDisplay, BaseUnit } from "@/lib/units"
import { ArrowDownRight, ArrowUpRight, History, Box, Search, Undo2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export interface LedgerEntry {
  id: string
  timestamp: string
  branch: string
  rawMaterialName: string
  type: "IN" | "OUT"
  reason: "SALE" | "GRN" | "WASTAGE" | "TRANSFER"
  quantityChange: number // in base unit
  baseUnit: BaseUnit
  reference: string
}

export default function StockLedgerPage() {
  const { user, role } = useAuth()
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [filterBranch, setFilterBranch] = useState("All")
  const [filterType, setFilterType] = useState("All")
  const [filterDate, setFilterDate] = useState("")

  useEffect(() => {
    const fetchLedger = async () => {
      if (!user) return;
      try {
        const branchQuery = (role === "Super Admin" || role === "Admin") ? "" : `?branch=${encodeURIComponent(user.branch || "")}`;
        const res = await fetch(`/api/stock-ledger${branchQuery}`);
        if (res.ok) {
          const data = await res.json();
          const formattedLedger: LedgerEntry[] = data.map((item: any) => ({
            id: item._id,
            timestamp: item.date,
            branch: item.branch,
            rawMaterialName: item.rawMaterialName || item.sku, 
            type: item.type === "IN" || item.type === "GRN" ? "IN" : "OUT",
            reason: item.type, // e.g. "SALE", "GRN", "WASTAGE"
            quantityChange: item.quantity,
            baseUnit: (item.unit as BaseUnit) || "Nos", 
            reference: item.reference || "Manual Adjustment"
          }));
          setLedger(formattedLedger);
        }
      } catch (err) {
        console.error("Failed to fetch stock ledger", err);
      } finally {
        setIsLoading(false);
      }
    }
    const fetchBranches = async () => {
      try {
        const res = await fetch('/api/branches')
        if (res.ok) setBranches(await res.json())
      } catch (err) {
        console.error(err)
      }
    }
    
    fetchLedger()
    if (role === "Super Admin" || role === "Admin") {
      fetchBranches()
    }
    
    // Auto refresh every 5 seconds
    const interval = setInterval(fetchLedger, 5000)
    return () => clearInterval(interval)
  }, [role, user?.branch])

  const filteredLedger = ledger.filter(entry => {
    const matchesSearch = entry.rawMaterialName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          entry.reference.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBranch = filterBranch === "All" || entry.branch === filterBranch
    const matchesType = filterType === "All" || entry.type === filterType
    const matchesDate = filterDate ? new Date(entry.timestamp).toISOString().split('T')[0] === filterDate : true
    
    return matchesSearch && matchesBranch && matchesType && matchesDate
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <History className="text-orange-500 w-6 h-6" /> Stock Ledger
          </h2>
          <p className="text-gray-500">Trace every stock movement (IN/OUT) across branches.</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative w-full sm:max-w-xs flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input 
            type="search" 
            placeholder="Search material or reference..." 
            className="pl-9 bg-white border-gray-200 h-10 rounded-lg shadow-sm" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-auto">
          <Input 
            type="date" 
            className="w-full sm:w-[160px] bg-white border-gray-200 h-10 rounded-lg shadow-sm text-gray-600" 
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
          {filterDate && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1.5 h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100" onClick={() => setFilterDate("")}>
              <Undo2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="w-full sm:w-[160px]">
          <Select value={filterType} onValueChange={(v) => setFilterType(v || "All")}>
            <SelectTrigger className="bg-white border-gray-200 h-10 rounded-lg shadow-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="IN">IN</SelectItem>
              <SelectItem value="OUT">OUT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(role === "Super Admin" || role === "Admin") && branches.length > 0 && (
          <div className="w-full sm:w-[160px]">
            <Select value={filterBranch} onValueChange={(v) => setFilterBranch(v || "All")}>
              <SelectTrigger className="bg-white border-gray-200 h-10 rounded-lg shadow-sm">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Branches</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b._id} value={b.name}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Raw Material</TableHead>
              <TableHead>Type & Reason</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-2/3"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-1/3"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
                </TableRow>
              ))
            ) : filteredLedger.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="p-12 text-center text-gray-400">
                    <Box className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">No stock movements found</h3>
                    <p className="text-sm">Make a sale at the POS terminal to see stock deductions here.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLedger.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-gray-50/50">
                  <TableCell className="text-sm text-gray-600">
                    {new Date(entry.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {entry.branch}
                  </TableCell>
                  <TableCell className="font-bold text-gray-800">
                    {entry.rawMaterialName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {entry.type === "IN" ? (
                        <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs font-bold">
                          <ArrowUpRight className="w-3 h-3" /> IN
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded-full text-xs font-bold">
                          <ArrowDownRight className="w-3 h-3" /> OUT
                        </span>
                      )}
                      <span className="text-xs font-semibold text-gray-500">{entry.reason}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-black ${entry.type === "IN" ? "text-green-600" : "text-red-600"}`}>
                      {entry.type === "IN" ? "+" : "-"}
                      {formatStockDisplay(entry.quantityChange, entry.baseUnit)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2 block">
                      ({entry.quantityChange} {entry.baseUnit})
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 font-mono">
                    {entry.reference}
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
      </div>
    </div>
  )
}
