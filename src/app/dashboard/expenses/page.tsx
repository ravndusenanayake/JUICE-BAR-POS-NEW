"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, FileText, Calendar, Wallet, UploadCloud, Image as ImageIcon, Trash2 } from "lucide-react"

export interface Expense {
  id: string
  branch: string
  expenseDate: string
  category: string
  amount: number
  note: string
  attachmentUrl?: string // For mock purposes
  createdBy: string
}

const CATEGORIES = [
  "Rent",
  "Electricity",
  "Water",
  "Internet",
  "Marketing",
  "Transportation",
  "Office Supplies",
  "Other"
]

const BRANCHES = ["Colombo 07", "Kandy Branch", "Galle Branch"]

export default function ExpensesPage() {
  const { user, role } = useAuth()
  
  const defaultBranch = user?.branch === "All Branches" ? "Colombo 07" : (user?.branch || "Colombo 07")
  const canSeeAllBranches = role === "Super Admin" || role === "Admin"

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBranch, setFilterBranch] = useState(canSeeAllBranches ? "All" : defaultBranch)

  // Modal State
  const [isOpen, setIsOpen] = useState(false)
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [branch, setBranch] = useState(defaultBranch)
  const [category, setCategory] = useState("Rent")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [fileName, setFileName] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem("mock_expenses")
    if (stored) {
      setExpenses(JSON.parse(stored))
    }
  }, [])

  const filteredExpenses = expenses.filter(e => {
    const matchSearch = e.note.toLowerCase().includes(searchQuery.toLowerCase()) || e.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchBranch = filterBranch === "All" ? true : e.branch === filterBranch
    // Security check: if not admin, strictly limit to their own branch regardless of filter state
    const securityCheck = canSeeAllBranches ? true : e.branch === defaultBranch
    
    return matchSearch && matchBranch && securityCheck
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount.")
      return
    }

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      branch,
      expenseDate,
      category,
      amount: parseFloat(amount),
      note,
      attachmentUrl: fileName ? `mock-url-for-${fileName}` : undefined,
      createdBy: user?.name || "System"
    }

    const updated = [newExpense, ...expenses]
    setExpenses(updated)
    localStorage.setItem("mock_expenses", JSON.stringify(updated))
    
    // Reset
    setIsOpen(false)
    setExpenseDate(new Date().toISOString().split('T')[0])
    setCategory("Rent")
    setAmount("")
    setNote("")
    setFileName("")
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense record? This will impact profit reports.")) {
      const updated = expenses.filter(e => e.id !== id)
      setExpenses(updated)
      localStorage.setItem("mock_expenses", JSON.stringify(updated))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name)
    }
  }

  // Calculate totals
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Wallet className="text-red-500 w-6 h-6" /> Expense Management
          </h2>
          <p className="text-gray-500">Track and manage operational costs for your branches.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-red-500 hover:bg-red-600 text-white font-bold h-10 px-4 shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Record Expense
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-4 items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                type="search" placeholder="Search by category or note..." 
                className="pl-9 bg-white border-gray-200 h-10 shadow-sm"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {canSeeAllBranches && (
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="w-48 h-10 bg-white">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Branches</SelectItem>
                  {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="bg-red-50 border border-red-100 px-4 py-2 rounded-lg">
            <span className="text-sm font-bold text-red-800">Total Shown: </span>
            <span className="text-lg font-black text-red-600">Rs. {totalExpenses.toFixed(2)}</span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <TableHead className="py-4">Date & Category</TableHead>
              <TableHead>Branch & User</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Attachment</TableHead>
              <TableHead className="text-right">Amount (Rs.)</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  <Wallet className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No expenses found for the selected criteria.</p>
                </TableCell>
              </TableRow>
            )}
            {filteredExpenses.map((exp) => (
              <TableRow key={exp.id} className="border-b last:border-0 hover:bg-gray-50/50">
                <TableCell className="py-4">
                  <div className="font-bold text-gray-900">{exp.category}</div>
                  <div className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(exp.expenseDate).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-gray-800">{exp.branch}</div>
                  <div className="text-xs text-gray-400">By: {exp.createdBy}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600 max-w-[250px] truncate">{exp.note || "-"}</div>
                </TableCell>
                <TableCell>
                  {exp.attachmentUrl ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <ImageIcon className="w-3 h-3" /> View
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-black text-red-600 text-base">Rs. {exp.amount.toFixed(2)}</div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(exp.id)} className="h-8 w-8 p-0 text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b bg-red-50">
              <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Wallet className="text-red-600" /> Record New Expense
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2 font-medium">
                Log branch operational costs. These will be deducted from your Net Profit.
              </DialogDescription>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-bold text-gray-700">Date *</Label>
                  <Input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} required className="h-11" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-gray-700">Branch *</Label>
                  <Select value={branch} onValueChange={setBranch} disabled={!canSeeAllBranches}>
                    <SelectTrigger className="h-11 bg-gray-50"><SelectValue /></SelectTrigger>
                    <SelectContent>{BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-bold text-gray-700">Category *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-red-700">Amount (Rs.) *</Label>
                  <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required className="h-11 border-red-200 font-bold text-red-600 focus-visible:ring-red-500" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="font-bold text-gray-700">Note / Description</Label>
                <Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Electricity bill for June" className="h-11" />
              </div>

              <div className="grid gap-2">
                <Label className="font-bold text-gray-700">Attachment (Bill / Receipt)</Label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                  {fileName ? (
                    <span className="text-sm font-bold text-green-600">{fileName} selected</span>
                  ) : (
                    <>
                      <span className="text-sm font-bold text-blue-600">Click to upload a file</span>
                      <span className="text-xs text-gray-500 mt-1">JPG, PNG, or PDF</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
              <Button type="button" variant="outline" className="h-11 px-6 font-bold" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" className="h-11 px-6 font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg">Save Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
