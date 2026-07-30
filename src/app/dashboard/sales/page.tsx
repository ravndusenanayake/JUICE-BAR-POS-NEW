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
                          s.customer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDate = dateFilter ? new Date(s.createdAt).toISOString().split('T')[0] === dateFilter : true
    return matchesSearch && matchesDate
  })

  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      toast.error("No sales to export");
      return;
    }
    const headers = ["Invoice", "Date", "Customer", "Order Type", "Items", "Total Amount", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredSales.map(sale => [
        sale.invoiceNo,
        new Date(sale.createdAt).toLocaleString().replace(/,/g, ''),
        sale.customer,
        sale.orderType || 'Takeaway',
        sale.items?.length || 0,
        sale.total?.toFixed(2),
        sale.status
      ].join(","))
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
      case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Refunded': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Partially Refunded': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-700';
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

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search invoice or customer..." 
            className="pl-8" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-auto">
          <Input 
            type="date" 
            className="w-full sm:w-[200px]" 
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
          {dateFilter && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7 text-gray-500" onClick={() => setDateFilter("")}>
              <Undo2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Invoice</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Order Type</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading sales history...</TableCell>
              </TableRow>
            ) : filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">No sales found.</TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale._id}>
                  <TableCell className="font-medium text-primary">{sale.invoiceNo}</TableCell>
                  <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{sale.customer}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 font-medium text-xs rounded-md">
                      {sale.orderType || 'Takeaway'}
                    </span>
                  </TableCell>
                  <TableCell>{sale.items?.length || 0}</TableCell>
                  <TableCell className="font-bold">Rs. {sale.total?.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700" onClick={() => openViewModal(sale)}>View Details</Button>
                      {sale.status !== 'Refunded' && sale.status !== 'Voided' && (
                        <Button variant="outline" size="sm" className="text-orange-500 border-orange-200 hover:bg-orange-50" onClick={() => openReturnModal(sale)}>
                          <Undo2 className="h-4 w-4 mr-1" /> Return
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sale Details - {viewSale?.invoiceNo}</DialogTitle>
            <DialogDescription>
              {viewSale && new Date(viewSale.createdAt).toLocaleString()} | Cashier: {viewSale?.cashier}
            </DialogDescription>
          </DialogHeader>
          
          {viewSale && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div><span className="text-gray-500 block text-xs">Customer</span><span className="font-semibold">{viewSale.customer}</span></div>
                <div><span className="text-gray-500 block text-xs">Order Type</span><span className="font-semibold">{viewSale.orderType || 'Takeaway'}</span></div>
                <div><span className="text-gray-500 block text-xs">Payment Method</span><span className="font-semibold">{viewSale.paymentMethod}</span></div>
                <div><span className="text-gray-500 block text-xs">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewSale.status)}`}>{viewSale.status}</span></div>
              </div>

              <div>
                <h3 className="font-bold mb-2">Items Purchased</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewSale.items?.map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          {(item.variant || item.addons?.length > 0 || item.note) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.variant && <div>Variant: {item.variant}</div>}
                              {item.addons?.map((a:any, ai:number) => <div key={ai}>+ {a.name} (Rs.{a.price})</div>)}
                              {item.note && <div className="italic">Note: {item.note}</div>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">Rs. {item.totalPrice?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {viewSale.returnedItems?.length > 0 && (
                <div>
                  <h3 className="font-bold text-red-600 mb-2">Returned Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Refund Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewSale.returnedItems.map((item: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-red-600">{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-xs">{item.reason}</TableCell>
                          <TableCell className="text-right text-red-600 font-bold">-Rs. {item.refundAmount?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="space-y-1 text-sm text-right pt-4 border-t">
                <div>Subtotal: Rs. {viewSale.subtotal?.toFixed(2)}</div>
                {viewSale.discount > 0 && <div>Discount: -Rs. {viewSale.discount?.toFixed(2)}</div>}
                <div className="text-lg font-bold">Total: Rs. {viewSale.total?.toFixed(2)}</div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
