"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Download, UserPlus, MoreHorizontal, Users } from "lucide-react"

export interface Customer {
  id: string
  name: string
  mobile: string
  email: string
  birthday: string
  totalSpend: number
  points: number
  status: "Active" | "VIP"
}

const INITIAL_CUSTOMERS: Customer[] = [
  { id: "CUST-001", name: "Walk-In Customer", mobile: "N/A", email: "N/A", birthday: "", totalSpend: 0, points: 0, status: "Active" },
  { id: "CUST-002", name: "John Doe", mobile: "0771234567", email: "john@example.com", birthday: "1990-05-12", totalSpend: 15000, points: 150, status: "Active" },
  { id: "CUST-003", name: "Sarah Smith", mobile: "0719876543", email: "sarah@example.com", birthday: "1988-11-20", totalSpend: 85000, points: 850, status: "VIP" },
]

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Modal state
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [mobile, setMobile] = useState("")
  const [email, setEmail] = useState("")
  const [birthday, setBirthday] = useState("")

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
      }
    } catch (err) {
      console.error("Failed to fetch customers", err)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.mobile.includes(searchQuery)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !mobile) {
      alert("Name and Mobile are required.")
      return
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mobile,
          email,
          birthday,
          loyaltyPoints: 0,
          status: "Active"
        })
      })

      if (res.ok) {
        await fetchCustomers()
        setIsOpen(false)
        setName("")
        setMobile("")
        setEmail("")
        setBirthday("")
      } else {
        alert("Failed to add customer")
      }
    } catch (err) {
      console.error("Error adding customer", err)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Users className="text-orange-500 w-6 h-6" /> Customer Management
          </h2>
          <p className="text-gray-500">Manage customer profiles, contact info, and loyalty points.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 font-bold border-gray-300">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={() => setIsOpen(true)} className="h-10 font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm">
            <UserPlus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="search" placeholder="Search by name or mobile number..." 
              className="pl-9 bg-white border-gray-200 h-10 shadow-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <TableHead className="py-4">Customer Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Birthday</TableHead>
              <TableHead className="text-right">Total Spend (Rs.)</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No customers found.</p>
                </TableCell>
              </TableRow>
            )}
            {filteredCustomers.map((customer: any) => (
              <TableRow key={customer._id || customer.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell className="py-4 font-bold text-gray-900">
                  {customer.name}
                  {customer.name === "Walk-In Customer" && <span className="ml-2 bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold">DEFAULT</span>}
                </TableCell>
                <TableCell className="font-mono text-gray-600">{customer.mobile}</TableCell>
                <TableCell className="text-gray-500">{customer.email || "-"}</TableCell>
                <TableCell className="text-gray-500">{customer.birthday || "-"}</TableCell>
                <TableCell className="text-right font-black text-gray-900">{(customer.totalSpend || 0).toFixed(2)}</TableCell>
                <TableCell className="text-right font-black text-orange-600">{customer.points}</TableCell>
                <TableCell className="text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${customer.status === 'VIP' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                    {customer.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b bg-orange-50">
              <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                <UserPlus className="text-orange-600 w-5 h-5" /> Add New Customer
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2 font-medium">
                Register a customer to track loyalty points and purchase history.
              </DialogDescription>
            </div>
            
            <div className="p-6 space-y-4 bg-white">
              <div className="grid gap-2">
                <Label className="font-bold text-gray-700">Full Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nimal Perera" required className="h-11 border-gray-300" />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-gray-700">Mobile Number *</Label>
                <Input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="e.g. 0771234567" required className="h-11 border-gray-300" />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-gray-700">Email Address</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. nimal@example.com" className="h-11 border-gray-300" />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-gray-700">Birthday (For promotions)</Label>
                <Input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="h-11 border-gray-300" />
              </div>
            </div>
            
            <DialogFooter className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
              <Button type="button" variant="outline" className="h-11 px-6 font-bold" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" className="h-11 px-6 font-bold bg-orange-500 text-white hover:bg-orange-600 shadow-lg">Save Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
