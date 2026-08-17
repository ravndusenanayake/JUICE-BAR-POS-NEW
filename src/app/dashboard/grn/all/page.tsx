"use client"
import { toast } from 'sonner';

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PackageOpen, Search, Filter, Eye, Banknote, Calendar as CalendarIcon, ArrowRight, LayoutList, ChevronLeft, ChevronRight } from "lucide-react"

export default function AllGRNPage() {
  const { user, role } = useAuth()
  
  const [grns, setGrns] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  // Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedGRN, setSelectedGRN] = useState<any>(null)
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [amountPaid, setAmountPaid] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")

  // View Details Modal State
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewGrn, setViewGrn] = useState<any>(null)

  const [filterBranch, setFilterBranch] = useState("All")
  const [filterSupplier, setFilterSupplier] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")
  const [filterDate, setFilterDate] = useState("All")
  const [filterAmount, setFilterAmount] = useState("All")
  const [branches, setBranches] = useState<any[]>([])
  
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    fetchGRNs()
    fetchBranches()
  }, [])

  const fetchGRNs = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/grn')
      if (res.ok) {
        setGrns(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches')
      if (res.ok) setBranches(await res.json())
    } catch (e) {
      console.error(e)
    }
  }

  const filteredGRNs = grns.filter(grn => {
    const search = searchQuery.toLowerCase()
    const matchesSearch = grn.grnNumber.toLowerCase().includes(search) || 
           grn.poNumber.toLowerCase().includes(search) || 
           grn.supplierName.toLowerCase().includes(search)
           
    const matchesBranch = filterBranch === "All" || grn.branch === filterBranch;
    const matchesSupplier = filterSupplier === "All" || grn.supplierName === filterSupplier;
    const matchesStatus = filterStatus === "All" || grn.paymentStatus === filterStatus;
    
    let matchesDate = true;
    if (filterDate !== "All") {
      const gDate = new Date(grn.receivedDate || grn.createdAt);
      const today = new Date();
      if (filterDate === "Today") {
        matchesDate = gDate.toDateString() === today.toDateString();
      } else if (filterDate === "Yesterday") {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        matchesDate = gDate.toDateString() === y.toDateString();
      } else if (filterDate === "Last 7 Days") {
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        matchesDate = gDate >= last7;
      } else if (filterDate === "This Month") {
        matchesDate = gDate.getMonth() === today.getMonth() && gDate.getFullYear() === today.getFullYear();
      }
    }
    
    let matchesAmount = true;
    if (filterAmount !== "All") {
      const total = Number(grn.totalAmount) || 0;
      if (filterAmount === "< 10,000") matchesAmount = total < 10000;
      else if (filterAmount === "10,000 - 50,000") matchesAmount = total >= 10000 && total <= 50000;
      else if (filterAmount === "> 50,000") matchesAmount = total > 50000;
    }
    
    return matchesSearch && matchesBranch && matchesSupplier && matchesStatus && matchesDate && matchesAmount;
  })

  const uniqueSuppliers = Array.from(new Set(grns.map(g => g.supplierName))).filter(Boolean).sort();

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const openPaymentModal = (grn: any) => {
    setSelectedGRN(grn)
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaymentMethod("Cash")
    setAmountPaid((grn.totalAmount - (grn.paidAmount || 0)).toString())
    setPaymentNotes("")
    setIsPaymentOpen(true)
  }

  const openViewModal = (grn: any) => {
    setViewGrn(grn)
    setIsViewOpen(true)
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGRN) return

    const amt = parseFloat(amountPaid)
    if (isNaN(amt) || amt <= 0) {
      toast.info("Please enter a valid amount")
      return
    }

    try {
      const res = await fetch('/api/grn/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grnId: selectedGRN._id,
          amount: amt,
          method: paymentMethod,
          date: paymentDate,
          notes: paymentNotes
        })
      })

      if (res.ok) {
        setIsPaymentOpen(false)
        fetchGRNs()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to save payment")
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to save payment")
    }
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <PackageOpen className="text-orange-500 w-6 h-6" /> GRN Directory
          </h2>
          <p className="text-gray-500 mt-1">Manage and track all Goods Receipt Notes and Payments.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg border">
          <Button 
            variant={viewMode === "list" ? "default" : "ghost"} 
            size="sm" 
            className={`shadow-none ${viewMode === "list" ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="w-4 h-4 mr-2" /> List
          </Button>
          <Button 
            variant={viewMode === "calendar" ? "default" : "ghost"} 
            size="sm" 
            className={`shadow-none ${viewMode === "calendar" ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
            onClick={() => setViewMode("calendar")}
          >
            <CalendarIcon className="w-4 h-4 mr-2" /> Calendar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-center">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total GRNs</div>
          <div className="text-2xl font-black text-gray-900">{grns.length}</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-center">
          <div className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Fully Paid</div>
          <div className="text-2xl font-black text-green-700">{grns.filter(g => g.paymentStatus === 'Fully Paid').length}</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-center">
          <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Unpaid</div>
          <div className="text-2xl font-black text-red-700">{grns.filter(g => g.paymentStatus === 'Unpaid').length}</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-center bg-orange-50">
          <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">Total Amount</div>
          <div className="text-2xl font-black text-orange-700">Rs. {grns.reduce((a, b) => a + (b.totalAmount || 0), 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col xl:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="search" placeholder="Search by GRN No, PO No, or Supplier..." 
              className="pl-9 bg-white border-gray-200 h-10 shadow-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={filterDate} onValueChange={(v) => setFilterDate(v || 'All')}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white border-gray-200 h-10 font-medium text-gray-700">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Dates</SelectItem>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Yesterday">Yesterday</SelectItem>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSupplier} onValueChange={(v) => setFilterSupplier(v || 'All')}>
              <SelectTrigger className="w-full sm:w-[160px] bg-white border-gray-200 h-10 font-medium text-gray-700">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Suppliers</SelectItem>
                {uniqueSuppliers.map((s: string) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterBranch} onValueChange={v => setFilterBranch(v || 'All')}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white border-gray-200 h-10 font-medium text-gray-700">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Branches</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b._id} value={b.name}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAmount} onValueChange={(v) => setFilterAmount(v || 'All')}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white border-gray-200 h-10 font-medium text-gray-700">
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Prices</SelectItem>
                <SelectItem value="< 10,000">Below Rs.10,000</SelectItem>
                <SelectItem value="10,000 - 50,000">Rs.10k - 50k</SelectItem>
                <SelectItem value="> 50,000">Above Rs.50,000</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v || 'All')}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white border-gray-200 h-10 font-medium text-gray-700">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Fully Paid">Fully Paid</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {viewMode === "list" ? (
          <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <TableHead className="py-4 px-4">Date</TableHead>
              <TableHead>GRN Details</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-center">Payment Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">Loading GRNs...</TableCell>
              </TableRow>
            ) : filteredGRNs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">No GRNs found.</TableCell>
              </TableRow>
            ) : (
              filteredGRNs.map((grn) => {
                let statusColor = "bg-red-100 text-red-700 border-red-200"
                if (grn.paymentStatus === "Fully Paid") statusColor = "bg-green-100 text-green-700 border-green-200"
                if (grn.paymentStatus === "Partially Paid") statusColor = "bg-amber-100 text-amber-700 border-amber-200"

                return (
                  <TableRow key={grn._id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4 px-4">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        {new Date(grn.receivedDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-black text-gray-900">{grn.grnNumber}</div>
                      <div className="text-xs text-gray-500 mt-1">PO: {grn.poNumber}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-gray-800">{grn.supplierName}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {grn.branch}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-bold text-gray-900">Rs. {(grn.totalAmount || 0).toFixed(2)}</div>
                      {grn.paymentStatus !== 'Unpaid' && (
                        <div className="text-xs text-green-600 font-medium mt-1">Paid: Rs. {(grn.paidAmount || 0).toFixed(2)}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusColor}`}>
                        {grn.paymentStatus || 'Unpaid'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700">{grn.receivedBy}</div>
                    </TableCell>
                    <TableCell className="text-right px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="View Details" onClick={() => openViewModal(grn)}>
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Button>
                        {grn.paymentStatus !== "Fully Paid" && (
                          <Button 
                            size="sm" 
                            onClick={() => openPaymentModal(grn)}
                            className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Banknote className="w-4 h-4 mr-1.5" /> Pay
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-5 h-5" /></Button>
                <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-5 h-5" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200 border rounded-xl overflow-hidden">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-gray-50 py-2 text-center text-xs font-bold text-gray-500 uppercase">{day}</div>
              ))}
              {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white min-h-[120px] opacity-50 p-2"></div>
              ))}
              {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
                const day = i + 1;
                const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
                const dayGrns = filteredGRNs.filter(g => new Date(g.receivedDate).toDateString() === dateStr);
                
                return (
                  <div key={day} className="bg-white min-h-[120px] p-2 hover:bg-gray-50 transition-colors border-t border-l border-gray-100 first:border-l-0">
                    <div className="text-sm font-bold text-gray-400 mb-2">{day}</div>
                    <div className="space-y-2">
                      {dayGrns.map(grn => {
                        let statusColor = "bg-red-50 text-red-700 border-red-200";
                        if (grn.paymentStatus === "Fully Paid") statusColor = "bg-green-50 text-green-700 border-green-200";
                        if (grn.paymentStatus === "Partially Paid") statusColor = "bg-amber-50 text-amber-700 border-amber-200";

                        return (
                          <div 
                            key={grn._id} 
                            onClick={() => openViewModal(grn)}
                            className={`border rounded-md p-1.5 cursor-pointer hover:opacity-80 transition-colors ${statusColor}`}
                          >
                            <div className="text-[10px] font-bold truncate">{grn.grnNumber}</div>
                            <div className="text-[10px] truncate opacity-80">{grn.supplierName}</div>
                            <div className="text-[10px] font-black mt-0.5">Rs. {(grn.totalAmount || 0).toFixed(2)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* --- PAYMENT MODAL --- */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-blue-600" /> Pay for GRN
            </DialogTitle>
            <DialogDescription>
              Record a payment for {selectedGRN?.grnNumber}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePayment} className="space-y-4 px-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">GRN Number *</Label>
              <Input value={selectedGRN?.grnNumber} readOnly className="bg-gray-50" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Payment Date *</Label>
                <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val || 'Cash')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Amount Paid (Rs.) *</Label>
              <Input 
                type="number" min="0.01" step="0.01" max={selectedGRN ? selectedGRN.totalAmount - (selectedGRN.paidAmount || 0) : undefined}
                value={amountPaid} onChange={e => setAmountPaid(e.target.value)} required 
                className="font-bold text-lg"
              />
              <p className="text-[10px] text-gray-500">
                Maximum: Rs. {selectedGRN ? (selectedGRN.totalAmount - (selectedGRN.paidAmount || 0)).toFixed(2) : '0.00'}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Notes</Label>
              <textarea 
                value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)}
                placeholder="Cheque number, reference ID..."
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 grid gap-2 mt-4">
              <div className="text-sm font-bold text-blue-900 mb-2 border-b border-blue-200 pb-2">Payment Summary</div>
              <div className="flex justify-between text-xs text-blue-800">
                <span>Amount Paying:</span>
                <span className="font-bold">Rs. {parseFloat(amountPaid || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-blue-800">
                <span>Remaining Balance:</span>
                <span className="font-bold">
                  Rs. {selectedGRN ? (selectedGRN.totalAmount - (selectedGRN.paidAmount || 0) - parseFloat(amountPaid || '0')).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-blue-800">
                <span>Method:</span>
                <span className="font-bold">{paymentMethod}</span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Save Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
          <div className="p-6 border-b bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <PackageOpen className="text-orange-500" /> {viewGrn?.grnNumber}
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2 font-medium">
                  <span className="block mb-1">Received from <strong className="text-gray-900">{viewGrn?.supplierName}</strong> on {viewGrn ? new Date(viewGrn.receivedDate).toLocaleDateString() : ''}.</span>
                  <span className="block">Created By: <strong className="text-gray-900">{viewGrn?.createdBy || 'Admin'}</strong> | Date: {viewGrn ? new Date(viewGrn.createdAt || viewGrn.receivedDate).toLocaleString() : ''}</span>
                </DialogDescription>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Linked PO</div>
                <div className="font-black text-blue-600 mt-0.5">{viewGrn?.poNumber}</div>
              </div>
            </div>
            
            {viewGrn?.notes && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800 font-medium">
                <strong className="text-yellow-900">Notes:</strong> {viewGrn.notes}
              </div>
            )}
          </div>

          <div className="p-6 max-h-[50vh] overflow-y-auto">
            <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 text-xs uppercase tracking-wider">
                    <TableHead className="py-3 font-bold">Product</TableHead>
                    <TableHead className="font-bold">Ordered</TableHead>
                    <TableHead className="font-bold text-green-700 bg-green-50/50">Good Received</TableHead>
                    <TableHead className="font-bold text-red-700 bg-red-50/50">Damaged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewGrn?.items?.map((item: any, idx: number) => (
                    <TableRow key={idx} className="text-sm border-b last:border-0">
                      <TableCell className="font-bold py-3 text-gray-900">{item.itemName}</TableCell>
                      <TableCell className="text-gray-500 font-medium">{item.orderedQty} {item.unit}</TableCell>
                      <TableCell className="bg-green-50/20 font-black text-green-600">{item.receivedGoodQty} {item.unit}</TableCell>
                      <TableCell className="bg-red-50/20 font-bold text-red-600">{item.damagedQty > 0 ? `${item.damagedQty} ${item.unit}` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="p-6 border-t bg-white flex justify-end">
            <Button variant="outline" className="h-10 px-6 font-bold" onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
