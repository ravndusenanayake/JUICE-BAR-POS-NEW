"use client"
import { toast } from 'sonner';

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, Search, Filter, History, CheckCircle, FileText } from "lucide-react"

export default function GRNPaymentsPage() {
  const { user, role } = useAuth()
  
  const [grns, setGrns] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"ALL" | "UNPAID" | "PARTIALLY_PAID" | "FULLY_PAID">("UNPAID")
  const [isLoading, setIsLoading] = useState(true)

  // Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedGRN, setSelectedGRN] = useState<any>(null)
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [amountPaid, setAmountPaid] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")

  // History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historyGRN, setHistoryGRN] = useState<any>(null)

  useEffect(() => {
    fetchGRNs()
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

  const filteredGRNs = grns.filter(grn => {
    const search = searchQuery.toLowerCase()
    const matchSearch = grn.grnNumber.toLowerCase().includes(search) || 
                        grn.poNumber.toLowerCase().includes(search) || 
                        grn.supplierName.toLowerCase().includes(search)
    
    if (activeTab === "UNPAID") return matchSearch && grn.paymentStatus === "Unpaid"
    if (activeTab === "PARTIALLY_PAID") return matchSearch && grn.paymentStatus === "Partially Paid"
    if (activeTab === "FULLY_PAID") return matchSearch && grn.paymentStatus === "Fully Paid"
    
    return matchSearch
  })

  const openPaymentModal = (grn: any) => {
    setSelectedGRN(grn)
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaymentMethod("Cash")
    setAmountPaid((grn.totalAmount - (grn.paidAmount || 0)).toString())
    setPaymentNotes("")
    setIsPaymentOpen(true)
  }

  const openHistoryModal = (grn: any) => {
    setHistoryGRN(grn)
    setIsHistoryOpen(true)
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
        toast.success("Payment recorded successfully")
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
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Wallet className="text-orange-500 w-6 h-6" /> GRN Payments
        </h2>
        <p className="text-gray-500 mt-1">Settle supplier balances and view payment history.</p>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="border-b">
          <div className="flex px-4 pt-4">
            {["UNPAID", "PARTIALLY_PAID", "FULLY_PAID", "ALL"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === tab ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="search" placeholder="Search by GRN No, PO No, or Supplier..." 
              className="pl-9 bg-white border-gray-200 h-10 shadow-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <TableHead>GRN No</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Received Date</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Paid Amount</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">Loading GRNs...</TableCell></TableRow>
            ) : filteredGRNs.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No GRNs found matching your criteria</TableCell></TableRow>
            ) : (
              filteredGRNs.map((grn) => {
                const balance = grn.totalAmount - (grn.paidAmount || 0);
                return (
                  <TableRow key={grn._id} className="group hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-bold text-gray-900">{grn.grnNumber}</TableCell>
                    <TableCell className="font-semibold text-gray-700">{grn.supplierName}</TableCell>
                    <TableCell className="text-gray-600">{new Date(grn.receivedDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-bold text-gray-900">Rs. {grn.totalAmount?.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">Rs. {(grn.paidAmount || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-black text-red-600">Rs. {balance.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        grn.paymentStatus === "Fully Paid" ? "bg-green-100 text-green-700" :
                        grn.paymentStatus === "Partially Paid" ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {grn.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        {grn.paymentStatus !== "Fully Paid" && (
                          <Button size="sm" onClick={() => openPaymentModal(grn)} className="h-8 bg-green-600 hover:bg-green-700 text-white font-bold">
                            <Wallet className="w-3.5 h-3.5 mr-1" /> Pay
                          </Button>
                        )}
                        {(grn.paidAmount > 0 || (grn.payments && grn.payments.length > 0)) && (
                          <Button size="sm" variant="outline" onClick={() => openHistoryModal(grn)} className="h-8 border-gray-200 text-gray-600 hover:bg-gray-50">
                            <History className="w-3.5 h-3.5 mr-1" /> History
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
      </div>

      {/* Make Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>Record a payment for GRN: {selectedGRN?.grnNumber}</DialogDescription>
          </DialogHeader>
          {selectedGRN && (
            <form onSubmit={handleSavePayment} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mb-2">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Total Amount</div>
                  <div className="font-bold text-gray-900">Rs. {selectedGRN.totalAmount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Balance Due</div>
                  <div className="font-black text-red-600 text-lg">Rs. {(selectedGRN.totalAmount - (selectedGRN.paidAmount || 0)).toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (Rs)</Label>
                <Input type="number" step="0.01" max={selectedGRN.totalAmount - (selectedGRN.paidAmount || 0)} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="Cheque number, reference..." />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 font-bold">Confirm Payment</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
            <DialogDescription>{historyGRN?.grnNumber} - {historyGRN?.supplierName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {historyGRN && historyGRN.payments && historyGRN.payments.length > 0 ? (
              <div className="space-y-3">
                {historyGRN.payments.map((pay: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                    <div>
                      <div className="font-bold text-gray-900">{new Date(pay.date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">{pay.method} {pay.notes ? `• ${pay.notes}` : ''}</div>
                    </div>
                    <div className="font-black text-green-600">Rs. {pay.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">No payment records found.</div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHistoryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
