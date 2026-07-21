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

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [returnItems, setReturnItems] = useState<any[]>([])
  const [isProcessingReturn, setIsProcessingReturn] = useState(false)

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

  const filteredSales = sales.filter(s => 
    s.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.customer.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        <Button variant="outline" className="gap-2">
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
                  <TableCell>{sale.items?.length || 0}</TableCell>
                  <TableCell className="font-bold">Rs. {sale.total?.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700">View Details</Button>
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
    </div>
  )
}
