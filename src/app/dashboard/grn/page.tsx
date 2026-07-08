"use client"

import { useState, useEffect } from "react"
import { Search, Truck, FileText, Calendar, User, Eye, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function AllGRNPage() {
  const [grns, setGrns] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  
  const [selectedGrn, setSelectedGrn] = useState<any>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("mock_grns")
    if (stored) {
      setGrns(JSON.parse(stored))
    }
  }, [])

  const filteredGrns = grns.filter(g => 
    g.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openViewModal = (grn: any) => {
    setSelectedGrn(grn)
    setIsViewOpen(true)
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Truck className="text-orange-500 w-6 h-6" /> All Goods Received Notes (GRN)
          </h2>
          <p className="text-gray-500">Historical record of all received stock deliveries.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="search" placeholder="Search GRN number, PO, or supplier..." 
              className="pl-9 bg-white border-gray-200 h-10 shadow-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4 text-sm text-gray-500 font-medium">
            <div className="bg-gray-100 px-3 py-1.5 rounded-lg border">
              Total GRNs: <strong className="text-gray-900">{filteredGrns.length}</strong>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <TableHead className="py-4">GRN Number & Date</TableHead>
              <TableHead>PO Reference</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Received By</TableHead>
              <TableHead className="text-right">Items Received</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGrns.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No GRNs found.</p>
                </TableCell>
              </TableRow>
            )}
            {filteredGrns.map((grn) => (
              <TableRow key={grn.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                <TableCell className="py-4">
                  <div className="font-black text-gray-900 flex items-center gap-1.5">
                    {grn.grnNumber}
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
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
                  <Button variant="outline" size="sm" onClick={() => openViewModal(grn)} className="font-semibold shadow-sm hover:bg-gray-100">
                    <Eye className="w-4 h-4 mr-2" /> View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
                  Received from <strong className="text-gray-900">{selectedGrn?.supplierName}</strong> on {selectedGrn ? new Date(selectedGrn.receivedDate).toLocaleDateString() : ''}.
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

          <DialogFooter className="p-6 border-t bg-white flex justify-end">
            <Button variant="outline" className="h-10 px-6 font-bold" onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
