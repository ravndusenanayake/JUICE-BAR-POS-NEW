"use client"

import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search, Download, Calendar, Undo2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"

export default function SalesHistoryPage() {
  const { user } = useAuth()
  const [sales, setSales] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [returnItems, setReturnItems] = useState<any[]>([])
  const [isProcessingReturn, setIsProcessingReturn] = useState(false)

  // View Details Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewSale, setViewSale] = useState<any>(null)

  // Date Filter State
  const [dateFilter, setDateFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [orderTypeFilter, setOrderTypeFilter] = useState("All")

  useEffect(() => {
    if (user) {
      fetchSales()
    }
  }, [user])

  const fetchSales = async () => {
    setIsLoading(true)
    try {
      const branchQuery = (user?.role === "Super Admin" || user?.role === "Admin") ? "" : `?branch=${encodeURIComponent(user?.branch || "")}`;
      const res = await fetch(`/api/sales${branchQuery}`)
      if (res.ok) {
        const data = await res.json()
        setSales(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.cashier || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDate = dateFilter ? new Date(s.createdAt).toISOString().split('T')[0] === dateFilter : true
    const matchesStatus = statusFilter === "All" || s.status === statusFilter
    const matchesOrderType = orderTypeFilter === "All" || (s.orderType || 'Takeaway') === orderTypeFilter
    return matchesSearch && matchesDate && matchesStatus && matchesOrderType
  })

  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      toast.error("No sales to export");
      return;
    }
    const headers = ["Invoice", "Date", "Time", "Cashier", "Customer", "Order Type", "Items", "Total Amount", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredSales.map(sale => {
        const dateObj = new Date(sale.createdAt);
        return [
          sale.invoiceNo,
          dateObj.toLocaleDateString(),
          dateObj.toLocaleTimeString(),
          sale.cashier || "System",
          sale.customer,
          sale.orderType || 'Takeaway',
          sale.items?.length || 0,
          sale.total?.toFixed(2),
          sale.status
        ].join(",")
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sales_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const openViewModal = (sale: any) => {
    setViewSale(sale)
    setIsViewModalOpen(true)
  }

  const openReturnModal = (sale: any) => {
    setSelectedSale(sale)
    // Initialize return state with 0 quantity
    const initialItems = sale.items.map((item: any) => ({
      originalItem: item,
      productId: item.productId,
      name: item.name,
      returnQty: 0,
      refundAmount: 0,
      reason: 'Customer Return',
      action: 'Wastage' // Default for food/beverage
    }))
    setReturnItems(initialItems)
    setIsReturnModalOpen(true)
  }

  const handleReturnQtyChange = (index: number, qty: number) => {
    const newItems = [...returnItems];
    const maxQty = newItems[index].originalItem.quantity;
    
    // Check if already partially returned (requires calculating from sale.returnedItems if we want strict limits, but assuming standard return for now)
    const alreadyReturned = selectedSale.returnedItems?.filter((r:any) => r.productId === newItems[index].productId).reduce((sum:number, r:any) => sum + r.quantity, 0) || 0;
    const availableQty = maxQty - alreadyReturned;

    const validQty = Math.max(0, Math.min(qty, availableQty));
    newItems[index].returnQty = validQty;
    // Refund amount logic: proportional based on basePrice or totalPrice. Simple approach: unit price * qty
    const unitPrice = newItems[index].originalItem.totalPrice / maxQty;
    newItems[index].refundAmount = validQty * unitPrice;
    
    setReturnItems(newItems);
  }

  const handleReturnActionChange = (index: number, action: 'Wastage' | 'Restock') => {
    const newItems = [...returnItems];
    newItems[index].action = action;
    setReturnItems(newItems);
  }

  const processReturn = async () => {
    const itemsToReturn = returnItems
      .filter(item => item.returnQty > 0)
      .map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.returnQty,
        refundAmount: item.refundAmount,
        reason: item.reason,
        action: item.action
      }));

    if (itemsToReturn.length === 0) {
      toast.error("Please specify a quantity to return for at least one item.");
      return;
    }

    setIsProcessingReturn(true);
    try {
      const res = await fetch(`/api/sales/${selectedSale._id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnedItems: itemsToReturn })
      });

      if (res.ok) {
        toast.success("Return processed successfully!");
        setIsReturnModalOpen(false);
        fetchSales(); // Refresh the list
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to process return.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while processing the return.");
    } finally {
      setIsProcessingReturn(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Refunded': return 'bg-red-100 text-red-700 border-red-200';
      case 'Partially Refunded': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  const totalRefundPreview = returnItems.reduce((acc, curr) => acc + curr.refundAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales History</h2>
          <p className="text-muted-foreground">View and export recent transactions.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative w-full sm:max-w-xs flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input 
            type="search" 
            placeholder="Search invoice, customer, or cashier..." 
            className="pl-9 bg-white border-gray-200 focus:border-orange-500 h-10 rounded-lg shadow-sm" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-auto">
          <Input 
            type="date" 
            className="w-full sm:w-[160px] bg-white border-gray-200 h-10 rounded-lg shadow-sm text-gray-600" 
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
          {dateFilter && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1.5 h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100" onClick={() => setDateFilter("")}>
              <Undo2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="w-full sm:w-[160px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white border-gray-200 h-10 rounded-lg shadow-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Refunded">Refunded</SelectItem>
              <SelectItem value="Partially Refunded">Partially Refunded</SelectItem>
              <SelectItem value="Voided">Voided</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-[160px]">
          <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
            <SelectTrigger className="bg-white border-gray-200 h-10 rounded-lg shadow-sm">
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Takeaway">Takeaway</SelectItem>
              <SelectItem value="Dine-In">Dine-In</SelectItem>
              <SelectItem value="Delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 border-b-gray-200">
              <TableHead className="font-bold text-gray-700 py-4">Invoice</TableHead>
              <TableHead className="font-bold text-gray-700 py-4">Date</TableHead>
              <TableHead className="font-bold text-gray-700 py-4">Time</TableHead>
              <TableHead className="font-bold text-gray-700 py-4">Cashier</TableHead>
              <TableHead className="font-bold text-gray-700 py-4">Customer</TableHead>
              <TableHead className="font-bold text-gray-700 py-4">Order Type</TableHead>
              <TableHead className="font-bold text-gray-700 py-4 text-center">Items</TableHead>
              <TableHead className="font-bold text-gray-700 py-4 text-right">Total</TableHead>
              <TableHead className="font-bold text-gray-700 py-4">Status</TableHead>
              <TableHead className="text-right font-bold text-gray-700 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-gray-500 font-medium">Loading sales history...</TableCell>
              </TableRow>
            ) : filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-gray-500 font-medium">No sales found.</TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => {
                const dateObj = new Date(sale.createdAt);
                return (
                <TableRow key={sale._id} className="hover:bg-orange-50/30 transition-colors">
                  <TableCell className="font-black text-gray-900 py-4">{sale.invoiceNo}</TableCell>
                  <TableCell className="text-gray-600 font-medium py-4">{dateObj.toLocaleDateString()}</TableCell>
                  <TableCell className="text-gray-500 py-4">{dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-black text-[10px]">
                        {(sale.cashier || 'S')[0].toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-800">{sale.cashier || 'System'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-gray-700 py-4">{sale.customer}</TableCell>
                  <TableCell className="py-4">
                    <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-[11px] rounded-md uppercase tracking-wider">
                      {sale.orderType || 'Takeaway'}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-gray-600 text-center py-4">{sale.items?.length || 0}</TableCell>
                  <TableCell className="font-black text-gray-900 text-right py-4">Rs. {sale.total?.toFixed(2)}</TableCell>
                  <TableCell className="py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold border ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold" onClick={() => openViewModal(sale)}>View</Button>
                      {sale.status !== 'Refunded' && sale.status !== 'Voided' && (
                        <Button variant="outline" size="sm" className="h-8 px-3 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 font-bold shadow-sm" onClick={() => openReturnModal(sale)}>
                          <Undo2 className="h-3.5 w-3.5 mr-1.5" /> Return
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

      {/* Return Modal */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process Return - {selectedSale?.invoiceNo}</DialogTitle>
            <DialogDescription>
              Select items to return and specify if they should be restocked or marked as wastage.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Purchased Qty</TableHead>
                    <TableHead>Return Qty</TableHead>
                    <TableHead>Inventory Action</TableHead>
                    <TableHead className="text-right">Refund Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnItems.map((item, index) => {
                    const alreadyReturned = selectedSale?.returnedItems?.filter((r:any) => r.productId === item.productId).reduce((sum:number, r:any) => sum + r.quantity, 0) || 0;
                    const availableQty = item.originalItem.quantity - alreadyReturned;

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          {alreadyReturned > 0 && <div className="text-xs text-orange-500">({alreadyReturned} already returned)</div>}
                        </TableCell>
                        <TableCell>{item.originalItem.quantity}</TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            min="0" 
                            max={availableQty}
                            value={item.returnQty === 0 ? '' : item.returnQty} 
                            onChange={(e) => handleReturnQtyChange(index, parseInt(e.target.value) || 0)}
                            className="w-20 h-8"
                            disabled={availableQty <= 0}
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            disabled={item.returnQty === 0} 
                            value={item.action} 
                            onValueChange={(val: any) => handleReturnActionChange(index, val)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Wastage">Wastage (Throw Away)</SelectItem>
                              <SelectItem value="Restock">Restock</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-500">
                          {item.refundAmount > 0 ? `Rs. ${item.refundAmount.toFixed(2)}` : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-between items-center mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="text-red-800 font-medium">Total Refund Amount to Customer:</div>
              <div className="text-2xl font-bold text-red-600">Rs. {totalRefundPreview.toFixed(2)}</div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white" 
              onClick={processReturn}
              disabled={isProcessingReturn || totalRefundPreview <= 0}
            >
              {isProcessingReturn ? "Processing..." : "Confirm Return & Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border-0 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <DialogTitle className="text-2xl font-bold text-gray-900">Sale Details - {viewSale?.invoiceNo}</DialogTitle>
            <DialogDescription className="text-sm font-medium mt-1.5">
              {viewSale && new Date(viewSale.createdAt).toLocaleString()} | Cashier: {viewSale?.cashier}
            </DialogDescription>
          </DialogHeader>
          
          {viewSale && (
            <div className="space-y-8 mt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-gray-50/60 border border-gray-100 p-6 rounded-2xl">
                <div><span className="text-gray-500 block text-xs font-semibold uppercase tracking-wider mb-1.5">Customer</span><span className="font-bold text-gray-900 text-base">{viewSale.customer}</span></div>
                <div><span className="text-gray-500 block text-xs font-semibold uppercase tracking-wider mb-1.5">Order Type</span><span className="font-bold text-gray-900 text-base">{viewSale.orderType || 'Takeaway'}</span></div>
                <div><span className="text-gray-500 block text-xs font-semibold uppercase tracking-wider mb-1.5">Payment Method</span><span className="font-bold text-gray-900 text-base">{viewSale.paymentMethod}</span></div>
                <div><span className="text-gray-500 block text-xs font-semibold uppercase tracking-wider mb-1.5">Status</span><span className={`px-3 py-1 rounded-lg text-sm font-bold ${getStatusColor(viewSale.status)}`}>{viewSale.status}</span></div>
              </div>

              <div>
                <h3 className="font-black text-gray-900 text-lg mb-4 px-1">Items Purchased</h3>
                <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-gray-50/80">
                      <TableRow className="hover:bg-transparent border-b-gray-100">
                        <TableHead className="font-bold text-gray-600 px-5 py-4 text-sm">Item</TableHead>
                        <TableHead className="text-center font-bold text-gray-600 px-5 py-4 text-sm">Qty</TableHead>
                        <TableHead className="text-right font-bold text-gray-600 px-5 py-4 text-sm">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewSale.items?.map((item: any, i: number) => (
                        <TableRow key={i} className="hover:bg-gray-50/40">
                          <TableCell className="px-5 py-4">
                            <div className="font-bold text-gray-900 text-base">{item.name}</div>
                            {(item.variant || item.addons?.length > 0 || item.note) && (
                              <div className="text-sm text-gray-500 mt-1.5 space-y-1">
                                {item.variant && <div><span className="font-medium text-gray-400">Variant:</span> {item.variant}</div>}
                                {item.addons?.map((a:any, ai:number) => <div key={ai} className="text-gray-600">+ {a.name} (Rs. {a.price})</div>)}
                                {item.note && <div className="italic text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md inline-block mt-1">Note: {item.note}</div>}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-bold text-gray-700 text-base px-5 py-4">{item.quantity}</TableCell>
                          <TableCell className="text-right font-black text-gray-900 text-base px-5 py-4">Rs. {item.totalPrice?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {viewSale.returnedItems?.length > 0 && (
                <div>
                  <h3 className="font-black text-red-600 text-lg mb-4 px-1">Returned Items</h3>
                  <div className="rounded-2xl border border-red-100 overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-red-50">
                        <TableRow className="hover:bg-transparent border-b-red-100">
                          <TableHead className="font-bold text-red-700 px-5 py-4 text-sm">Item</TableHead>
                          <TableHead className="text-center font-bold text-red-700 px-5 py-4 text-sm">Qty</TableHead>
                          <TableHead className="font-bold text-red-700 px-5 py-4 text-sm">Reason</TableHead>
                          <TableHead className="text-right font-bold text-red-700 px-5 py-4 text-sm">Refund Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewSale.returnedItems.map((item: any, i: number) => (
                          <TableRow key={i} className="bg-red-50/30 hover:bg-red-50/50">
                            <TableCell className="font-bold text-red-700 text-base px-5 py-4">{item.name}</TableCell>
                            <TableCell className="text-center font-bold text-red-700 text-base px-5 py-4">{item.quantity}</TableCell>
                            <TableCell className="text-sm text-red-600 font-medium px-5 py-4">{item.reason}</TableCell>
                            <TableCell className="text-right text-red-600 font-black text-base px-5 py-4">-Rs. {item.refundAmount?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <div className="w-full sm:w-[50%] lg:w-[40%] space-y-3">
                  <div className="flex justify-between text-base text-gray-500 px-4 font-medium">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900">Rs. {viewSale.subtotal?.toFixed(2)}</span>
                  </div>
                  {viewSale.discount > 0 && (
                    <div className="flex justify-between text-base text-red-500 px-4 font-medium">
                      <span>Discount</span>
                      <span className="font-bold">-Rs. {viewSale.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t-2 border-gray-100 pt-4 mt-2 px-4">
                    <span className="font-black text-gray-900 text-xl tracking-tight">Total</span>
                    <span className="text-2xl font-black text-gray-900">Rs. {viewSale.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6 border-t border-gray-100 pt-4">
            <Button size="lg" className="rounded-xl px-8" onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
