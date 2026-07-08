"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatStockDisplay, BaseUnit } from "@/lib/units"
import { ArrowDownRight, ArrowUpRight, History, Box } from "lucide-react"

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

  useEffect(() => {
    const fetchLedger = () => {
      const stored = localStorage.getItem("mock_stock_ledger")
      if (stored) {
        const parsed: LedgerEntry[] = JSON.parse(stored)
        
        // Filter by branch if not Super Admin / Admin
        if (role === "Super Admin" || role === "Admin") {
          setLedger(parsed.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
        } else {
          setLedger(parsed.filter(e => e.branch === user?.branch).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
        }
      }
    }
    fetchLedger()
    
    // Auto refresh every 2 seconds to see POS updates instantly in another tab
    const interval = setInterval(fetchLedger, 2000)
    return () => clearInterval(interval)
  }, [role, user?.branch])

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

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {ledger.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Box className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No stock movements found</h3>
            <p className="text-sm">Make a sale at the POS terminal to see stock deductions here.</p>
          </div>
        ) : (
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
              {ledger.map((entry) => (
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
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
