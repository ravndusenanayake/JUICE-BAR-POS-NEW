"use client"

import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search, Download, Calendar } from "lucide-react"

const dummySales = [
  { id: "#INV-4201", date: "2026-07-05 10:24 AM", customer: "Walk-in", items: 3, total: "$18.50", status: "Paid" },
  { id: "#INV-4202", date: "2026-07-05 10:45 AM", customer: "John Doe", items: 1, total: "$6.50", status: "Paid" },
  { id: "#INV-4203", date: "2026-07-05 11:12 AM", customer: "Sarah Smith", items: 5, total: "$32.00", status: "Paid" },
  { id: "#INV-4204", date: "2026-07-05 11:30 AM", customer: "Walk-in", items: 2, total: "$9.00", status: "Paid" },
  { id: "#INV-4205", date: "2026-07-05 12:05 PM", customer: "Mike Johnson", items: 4, total: "$24.50", status: "Pending" },
]

export default function SalesHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales History</h2>
          <p className="text-muted-foreground">View and export recent transactions.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search invoice or customer..." className="pl-8" />
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <Calendar className="h-4 w-4" /> Filter by Date
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Invoice</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dummySales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium text-primary">{sale.id}</TableCell>
                <TableCell>{sale.date}</TableCell>
                <TableCell>{sale.customer}</TableCell>
                <TableCell>{sale.items}</TableCell>
                <TableCell className="font-bold">{sale.total}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${sale.status === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                    {sale.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700">View Details</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
