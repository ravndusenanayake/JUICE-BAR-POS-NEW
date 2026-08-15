"use client"

import { useState, useEffect } from "react"
import { Search, Truck, FileText, Calendar as CalendarIcon, User, Eye, X, Filter, LayoutList, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AllGRNPage() {
  const [grns, setGrns] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  
  const [filterBranch, setFilterBranch] = useState("All")
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [isLoading, setIsLoading] = useState(true)
  
  const [selectedGrn, setSelectedGrn] = useState<any>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  useEffect(() => {
    fetchGRNs()
    fetchBranches()
  }, [])

  const fetchGRNs = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/grn')
      if (res.ok) {
        const data = await res.json()
        setGrns(data)
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

  const filteredGrns = grns.filter(g => {
    const matchesSearch = g.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = filterBranch === "All" || g.branch === filterBranch;
    
    return matchesSearch && matchesBranch;
  })

  const openViewModal = (grn: any) => {
    setSelectedGrn(grn)
    setIsViewOpen(true)
  }

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Truck className="text-orange-500 w-6 h-6" /> All Goods Received Notes (GRN)
          </h2>
          <p className="text-gray-500">Historical record of all received stock deliveries.</p>
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

      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            type="search" placeholder="Search GRN number, PO, or supplier..." 
            className="pl-9 bg-gray-50 border-gray-200 shadow-none"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={filterBranch} onValueChange={v => setFilterBranch(v || 'All')}>
            <SelectTrigger className="bg-gray-50 border-gray-200">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Branches</SelectItem>
              {branches.map(b => (
                <SelectItem key={b._id} value={b.name}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {viewMode === "list" ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <TableHead className="py-4">GRN Number & Date</TableHead>
                <TableHead>PO Reference</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead className="text-right">Items Received</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">Loading GRNs...</TableCell>
                </TableRow>
              ) : filteredGrns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No GRNs found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredGrns.map((grn) => (
                  <TableRow key={grn._id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="font-black text-gray-900 flex items-center gap-1.5">
                        {grn.grnNumber}
                      </div>
                      <div className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(grn.receivedDate).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-flex border border-blue-100">
                        {grn.poNumber}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{grn.branch}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-gray-800">{grn.supplierName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-orange-100 p-1.5 rounded-full"><User className="w-3 h-3 text-orange-700"/></div>
                        <span className="text-sm font-medium text-gray-700">{grn.receivedBy || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-black text-green-600 text-lg">{grn.items?.length || 0}</div>
                      <div className="text-xs text-gray-400">products</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-bold text-gray-900">Rs. {grn.totalAmount?.toFixed(2)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openViewModal(grn)} className="font-semibold shadow-sm hover:bg-gray-100">
                        <Eye className="w-4 h-4 mr-2" /> View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
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
                const dayGrns = filteredGrns.filter(g => new Date(g.receivedDate).toDateString() === dateStr);
                
                return (
                  <div key={day} className="bg-white min-h-[120px] p-2 hover:bg-gray-50 transition-colors border-t border-l border-gray-100 first:border-l-0">
                    <div className="text-sm font-bold text-gray-400 mb-2">{day}</div>
                    <div className="space-y-2">
                      {dayGrns.map(grn => (
                        <div 
                          key={grn._id} 
                          onClick={() => openViewModal(grn)}
                          className="bg-blue-50 border border-blue-100 rounded-md p-1.5 cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                          <div className="text-[10px] font-bold text-blue-700 truncate">{grn.grnNumber}</div>
                          <div className="text-[10px] text-gray-600 truncate">{grn.supplierName}</div>
                          <div className="text-[10px] font-black text-gray-900 mt-0.5">Rs. {grn.totalAmount?.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
          <div className="p-6 border-b bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Truck className="text-orange-500" /> {selectedGrn?.grnNumber}
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2 font-medium">
                  <span className="block mb-1">Received from <strong className="text-gray-900">{selectedGrn?.supplierName}</strong> on {selectedGrn ? new Date(selectedGrn.receivedDate).toLocaleDateString() : ''}.</span>
                  <span className="block">Created By: <strong className="text-gray-900">{selectedGrn?.createdBy || 'Admin'}</strong> | Date: {selectedGrn ? new Date(selectedGrn.createdAt || selectedGrn.receivedDate).toLocaleString() : ''}</span>
                </DialogDescription>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Linked PO</div>
                <div className="font-black text-blue-600 mt-0.5">{selectedGrn?.poNumber}</div>
              </div>
            </div>
            
            {selectedGrn?.notes && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800 font-medium">
                <strong className="text-yellow-900">Notes:</strong> {selectedGrn.notes}
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
                  {selectedGrn?.items?.map((item: any, idx: number) => (
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

          <DialogFooter className="p-6 border-t bg-white flex justify-between items-center">
            <div className="text-sm font-medium text-gray-500">
              Total Amount: <strong className="text-gray-900 text-lg">Rs. {selectedGrn?.totalAmount?.toFixed(2)}</strong>
            </div>
            <Button variant="outline" className="h-10 px-6 font-bold" onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
