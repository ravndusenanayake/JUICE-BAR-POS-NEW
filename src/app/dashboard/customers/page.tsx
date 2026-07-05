"use client"

import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search, Download, UserPlus, MoreHorizontal } from "lucide-react"

const dummyCustomers = [
  { id: "CUST-001", name: "John Doe", phone: "+1 234 567 890", email: "john@example.com", totalSpend: "$145.50", points: 145, status: "Active" },
  { id: "CUST-002", name: "Sarah Smith", phone: "+1 234 567 891", email: "sarah@example.com", totalSpend: "$320.00", points: 320, status: "VIP" },
  { id: "CUST-003", name: "Mike Johnson", phone: "+1 234 567 892", email: "mike@example.com", totalSpend: "$24.50", points: 24, status: "Active" },
  { id: "CUST-004", name: "Emma Wilson", phone: "+1 234 567 893", email: "emma@example.com", totalSpend: "$89.00", points: 89, status: "Active" },
  { id: "CUST-005", name: "David Brown", phone: "+1 234 567 894", email: "david@example.com", totalSpend: "$540.25", points: 540, status: "VIP" },
]

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">Manage customer profiles and loyalty points.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search customers..." className="pl-8" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Total Spend</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dummyCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.totalSpend}</TableCell>
                <TableCell className="font-bold text-primary">{customer.points}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.status === 'VIP' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    {customer.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
