"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, ShoppingBag, Truck, Calendar, Wallet, FileDown, Download } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { Loader2, Clock, CreditCard, Coins, Percent, ClipboardList, CheckCircle2 } from "lucide-react"

export default function ReportsPage() {
  const { user, role } = useAuth()
  const canSeeAllBranches = role === "Super Admin" || role === "Admin"
  const defaultBranch = canSeeAllBranches ? "All" : (user?.branch || "Colombo 07")
  
  const [filterBranch, setFilterBranch] = useState(defaultBranch)
  const [dateFilter, setDateFilter] = useState("This Month")
  
  // Data States
  const [sales, setSales] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [ledger, setLedger] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [grns, setGrns] = useState<any[]>([])
  const [shifts, setShifts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, invRes, expRes, ledRes, poRes, grnRes, shiftRes] = await Promise.all([
          fetch('/api/sales'),
          fetch('/api/branch-inventory'),
          fetch('/api/expenses'),
          fetch('/api/stock-ledger'),
          fetch('/api/purchase-orders'),
          fetch('/api/grn'),
          fetch('/api/shifts')
        ]);
        
        if (salesRes.ok) setSales(await salesRes.json());
        if (invRes.ok) setInventory(await invRes.json());
        if (expRes.ok) setExpenses(await expRes.json());
        if (ledRes.ok) setLedger(await ledRes.json());
        if (poRes.ok) setPurchaseOrders(await poRes.json());
        if (grnRes.ok) setGrns(await grnRes.json());
        if (shiftRes.ok) setShifts(await shiftRes.json());
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [])

  // --- Filtering Logic ---
  const isBranchMatch = (itemBranch: string) => {
    if (filterBranch === "All") return true
    return itemBranch === filterBranch
  }
  
  const isDateMatch = (dateStr: string) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const now = new Date();
    
    if (dateFilter === "Today") {
      return date.toDateString() === now.toDateString();
    } else if (dateFilter === "This Week") {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      return date >= firstDay;
    } else if (dateFilter === "This Month") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } else if (dateFilter === "This Year") {
      return date.getFullYear() === now.getFullYear();
    }
    return true;
  }
  
  const filteredSales = sales.filter(s => isBranchMatch(s.branch) && isDateMatch(s.createdAt || s.timestamp))
  const filteredInventory = inventory.filter(i => isBranchMatch(i.branch)) // Inventory is current state, not date specific
  const filteredExpenses = expenses.filter(e => isBranchMatch(e.branch) && isDateMatch(e.createdAt || e.date))
  const filteredLedger = ledger.filter(l => isBranchMatch(l.branch) && isDateMatch(l.createdAt || l.timestamp))
  const filteredPO = purchaseOrders.filter(po => isDateMatch(po.createdAt))
  const filteredGRN = grns.filter(g => isDateMatch(g.createdAt))
  const filteredShifts = shifts.filter(s => isBranchMatch(s.branch) && isDateMatch(s.createdAt || s.openedAt))
  
  // --- Sales Metrics ---
  const totalSalesRevenue = filteredSales.reduce((acc, s) => acc + (s.total || s.grandTotal || 0), 0)
  const totalSubtotal = filteredSales.reduce((acc, s) => acc + (s.subTotal || s.total || s.grandTotal || 0), 0)
  const totalDiscounts = filteredSales.reduce((acc, s) => acc + (s.discount || 0), 0)
  const totalInvoices = filteredSales.length
  const averageOrderValue = totalInvoices > 0 ? totalSalesRevenue / totalInvoices : 0
  
  // Payment Breakdown
  const paymentBreakdown = { Cash: 0, Card: 0, Split: 0 }
  filteredSales.forEach(s => {
    if (s.paymentMethod?.toLowerCase().includes('cash')) paymentBreakdown.Cash += s.total || s.grandTotal || 0
    else if (s.paymentMethod?.toLowerCase().includes('card')) paymentBreakdown.Card += s.total || s.grandTotal || 0
    else paymentBreakdown.Split += s.total || s.grandTotal || 0
  })
  
  // Best selling products
  const productSales: Record<string, {name: string, qty: number, revenue: number}> = {}
  filteredSales.forEach(sale => {
    sale.items?.forEach((item: any) => {
      if (!productSales[item.productId]) productSales[item.productId] = { name: item.name, qty: 0, revenue: 0 }
      productSales[item.productId].qty += item.quantity
      productSales[item.productId].revenue += item.totalPrice
    })
  })
  const topProducts = Object.values(productSales).sort((a,b) => b.qty - a.qty).slice(0, 5)

  // --- Expense Metrics ---
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
  
  // --- Wastage Metrics ---
  // Assuming "OUT" type with reason "WASTAGE" or "EXPIRED" in stock ledger
  const wastageRecords = filteredLedger.filter(l => l.type === "OUT" && (l.remarks?.toLowerCase().includes("wastage") || l.remarks?.toLowerCase().includes("damage") || l.reason === "Wastage" || l.reason === "Damaged" || l.reason === "Expired"))
  // In a real app, we'd lookup the unit cost of the raw material at the time of wastage. Mocking cost for now.
  const mockCostPerUnit = 50 
  const totalWastageCost = wastageRecords.reduce((acc, w) => acc + (w.quantity * mockCostPerUnit), 0)

  // --- Inventory Valuation ---
  // Assuming current stock * mock buying price
  const inventoryValuation = filteredInventory.reduce((acc, i) => acc + (i.quantity * (i.buyingPrice || 100)), 0)
  const totalStockItems = filteredInventory.reduce((acc, i) => acc + (i.quantity || 0), 0)

  // --- Profitability (COGS Mocking) ---
  // In a real app, COGS = Cost of Goods Sold (Sum of recipe ingredient costs for all sold items). 
  // We will mock COGS as 40% of sales revenue for this demo since we don't have deep historical purchase costs tied to every sale.
  const cogs = totalSalesRevenue * 0.40 
  
  const netProfit = totalSalesRevenue - cogs - totalExpenses - totalWastageCost
  const profitMargin = totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 0

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Business Analytics & Reports", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Branch: ${filterBranch} | Date Filter: ${dateFilter}`, 14, 32);

    doc.setFontSize(14);
    doc.text("Profitability Summary", 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Amount (Rs.)']],
      body: [
        ['Total Sales Revenue', totalSalesRevenue.toFixed(2)],
        ['Cost of Goods Sold (COGS)', cogs.toFixed(2)],
        ['Gross Profit', (totalSalesRevenue - cogs).toFixed(2)],
        ['Operational Expenses', totalExpenses.toFixed(2)],
        ['Wastage / Damages', totalWastageCost.toFixed(2)],
        ['Net Profit Before Tax', netProfit.toFixed(2)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] }
    });
    
    doc.save("business-report.pdf");
  };

  const handleExportExcel = () => {
    const data = [
        ['Metric', 'Amount (Rs.)'],
        ['Total Sales Revenue', totalSalesRevenue],
        ['Cost of Goods Sold (COGS)', cogs],
        ['Gross Profit', (totalSalesRevenue - cogs)],
        ['Operational Expenses', totalExpenses],
        ['Wastage / Damages', totalWastageCost],
        ['Net Profit Before Tax', netProfit],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profitability");

    const salesData = [
      ['Invoice ID', 'Date', 'Branch', 'Order Type', 'Payment Method', 'Subtotal', 'Discount', 'Grand Total (Rs.)'],
      ...filteredSales.map(s => [s.invoiceNo || s.receiptNumber || s.id, new Date(s.timestamp || s.createdAt).toLocaleString(), s.branch, s.orderType || '-', s.paymentMethod, s.subTotal || 0, s.discount || 0, s.total || s.grandTotal])
    ];
    const wsSales = XLSX.utils.aoa_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, wsSales, "Sales");

    const shiftData = [
      ['Cashier', 'Branch', 'Status', 'Opened At', 'Closed At', 'Opening Balance', 'Expected Cash', 'Actual Cash', 'Variance'],
      ...filteredShifts.map(s => [s.cashierName, s.branch, s.status, new Date(s.openedAt).toLocaleString(), s.closedAt ? new Date(s.closedAt).toLocaleString() : '-', s.openingBalance, s.expectedCash || 0, s.actualCash || 0, s.variance || 0])
    ];
    const wsShifts = XLSX.utils.aoa_to_sheet(shiftData);
    XLSX.utils.book_append_sheet(wb, wsShifts, "Shifts");

    XLSX.writeFile(wb, "business-report.xlsx");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Loading Reports...</h2>
        <p className="text-sm text-gray-500">Compiling your business analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-orange-500 w-8 h-8" /> Analytics & Reports
          </h2>
          <p className="text-gray-500 font-medium">Business intelligence, profitability, and operational insights.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700" onClick={handleExportPDF}>
              <FileDown className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={handleExportExcel}>
              <Download className="w-4 h-4 mr-2" /> Excel
            </Button>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border">
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v || "")}>
            <SelectTrigger className="w-[150px] border-0 bg-transparent font-bold"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="This Week">This Week</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
              <SelectItem value="This Year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="w-px h-6 bg-gray-200" />
          
          <Select value={filterBranch} onValueChange={(v) => setFilterBranch(v || "")} disabled={!canSeeAllBranches}>
            <SelectTrigger className="w-[180px] border-0 bg-transparent font-bold"><SelectValue /></SelectTrigger>
            <SelectContent>
              {canSeeAllBranches && <SelectItem value="All">All Branches</SelectItem>}
              <SelectItem value="Colombo 07">Colombo 07</SelectItem>
              <SelectItem value="Kandy Branch">Kandy Branch</SelectItem>
              <SelectItem value="Galle Branch">Galle Branch</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

      <Tabs defaultValue="profit" className="space-y-6">
        <TabsList className="bg-white border shadow-sm p-1.5 h-auto rounded-xl flex flex-wrap gap-2 overflow-x-auto hide-scrollbar">
          <TabsTrigger value="profit" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Profitability (P&L)</TabsTrigger>
          <TabsTrigger value="sales" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Sales</TabsTrigger>
          <TabsTrigger value="shifts" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Shifts & Cash</TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Inventory</TabsTrigger>
          <TabsTrigger value="purchases" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Purchases</TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Expenses & Wastage</TabsTrigger>
        </TabsList>

        {/* --- PROFITABILITY TAB --- */}
        <TabsContent value="profit" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-gray-900 to-black text-white border-0 shadow-xl rounded-2xl overflow-hidden relative">
              <div className="absolute -right-10 -top-10 bg-white/10 w-40 h-40 rounded-full blur-2xl" />
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-400 font-bold uppercase tracking-wider">Net Profit</CardDescription>
                <CardTitle className="text-4xl font-black">Rs. {netProfit.toFixed(2)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-sm font-bold flex items-center gap-1 ${profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profitMargin >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {profitMargin.toFixed(1)}% Margin
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardDescription className="font-bold text-gray-500 uppercase tracking-wider">Total Revenue</CardDescription>
                <CardTitle className="text-3xl font-black text-gray-900">Rs. {totalSalesRevenue.toFixed(2)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-gray-500">From {totalInvoices} Invoices</div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardDescription className="font-bold text-gray-500 uppercase tracking-wider">Total Deductions</CardDescription>
                <CardTitle className="text-3xl font-black text-red-600">- Rs. {(cogs + totalExpenses + totalWastageCost).toFixed(2)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-gray-500">COGS, Expenses, Wastage</div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-0 shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="text-orange-500 w-6 h-6" />
                <h3 className="text-xl font-black text-gray-900">Profit & Loss Statement (P&L)</h3>
              </div>
              <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border">
                Period: {dateFilter}
              </div>
            </div>
            <div className="p-0">
              <Table>
                <TableBody>
                  {/* Revenue Section */}
                  <TableRow className="hover:bg-transparent bg-gray-50/30">
                    <TableCell colSpan={2} className="py-3 px-6 font-bold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-100">Revenue</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-transparent border-0">
                    <TableCell className="py-4 font-medium text-gray-700 text-base px-8">Gross Sales Revenue</TableCell>
                    <TableCell className="py-4 text-right font-bold text-gray-900 px-8 text-base">Rs. {totalSalesRevenue.toFixed(2)}</TableCell>
                  </TableRow>

                  {/* Cost of Sales Section */}
                  <TableRow className="hover:bg-transparent bg-gray-50/30">
                    <TableCell colSpan={2} className="py-3 px-6 font-bold text-gray-900 uppercase text-xs tracking-wider border-y border-gray-100 mt-2">Cost of Sales</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-transparent border-0">
                    <TableCell className="py-4 font-medium text-gray-600 px-8 text-sm">Estimated COGS (40%)</TableCell>
                    <TableCell className="py-4 text-right font-medium text-red-500 px-8">- Rs. {cogs.toFixed(2)}</TableCell>
                  </TableRow>
                  
                  {/* Gross Profit */}
                  <TableRow className="hover:bg-transparent bg-orange-50/30 border-y border-orange-100">
                    <TableCell className="py-4 font-black text-gray-900 text-lg px-8">Gross Profit</TableCell>
                    <TableCell className="py-4 text-right font-black text-xl text-green-600 px-8">Rs. {(totalSalesRevenue - cogs).toFixed(2)}</TableCell>
                  </TableRow>
                  
                  {/* Operating Expenses */}
                  <TableRow className="hover:bg-transparent bg-gray-50/30">
                    <TableCell colSpan={2} className="py-3 px-6 font-bold text-gray-900 uppercase text-xs tracking-wider border-b border-gray-100">Operating Expenses</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-transparent border-0">
                    <TableCell className="py-4 font-medium text-gray-600 px-8 text-sm">Operational Expenses</TableCell>
                    <TableCell className="py-4 text-right font-medium text-red-500 px-8">- Rs. {totalExpenses.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-transparent border-0">
                    <TableCell className="py-4 font-medium text-gray-600 px-8 text-sm">Wastage / Damages</TableCell>
                    <TableCell className="py-4 text-right font-medium text-red-500 px-8">- Rs. {totalWastageCost.toFixed(2)}</TableCell>
                  </TableRow>
                  
                  {/* Net Profit */}
                  <TableRow className="hover:bg-transparent bg-gray-900">
                    <TableCell className="py-6 font-black text-white text-xl uppercase tracking-wider px-8">Net Profit</TableCell>
                    <TableCell className="py-6 text-right font-black text-3xl text-green-400 px-8">Rs. {netProfit.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* --- SALES TAB --- */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-2xl border-0 shadow-sm border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardDescription className="font-bold text-gray-500 uppercase tracking-wider text-xs">Gross Sales</CardDescription>
                <CardTitle className="text-2xl font-black text-gray-900">Rs. {totalSubtotal.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-0 shadow-sm border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardDescription className="font-bold text-gray-500 uppercase tracking-wider text-xs">Total Discounts</CardDescription>
                <CardTitle className="text-2xl font-black text-red-600">- Rs. {totalDiscounts.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-0 shadow-sm border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardDescription className="font-bold text-gray-500 uppercase tracking-wider text-xs">Net Sales</CardDescription>
                <CardTitle className="text-2xl font-black text-green-600">Rs. {totalSalesRevenue.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl border-0 shadow-sm border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardDescription className="font-bold text-gray-500 uppercase tracking-wider text-xs">Avg Order Value</CardDescription>
                <CardTitle className="text-2xl font-black text-blue-600">Rs. {averageOrderValue.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="w-5 h-5 text-gray-500"/> Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3"><Coins className="w-5 h-5 text-orange-500"/><span className="font-bold text-gray-700">Cash</span></div>
                    <span className="font-black text-gray-900">Rs. {paymentBreakdown.Cash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3"><CreditCard className="w-5 h-5 text-blue-500"/><span className="font-bold text-gray-700">Card</span></div>
                    <span className="font-black text-gray-900">Rs. {paymentBreakdown.Card.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3"><Percent className="w-5 h-5 text-purple-500"/><span className="font-bold text-gray-700">Split/Other</span></div>
                    <span className="font-black text-gray-900">Rs. {paymentBreakdown.Split.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-orange-500"/> Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black">{i+1}</div>
                        <span className="font-bold text-gray-900">{p.name}</span>
                      </div>
                      <div className="text-right flex items-center gap-6">
                        <div>
                          <div className="text-xs text-gray-500 font-bold uppercase">Qty Sold</div>
                          <div className="font-black text-gray-900">{p.qty}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-bold uppercase">Revenue</div>
                          <div className="font-black text-green-600">Rs. {(p.revenue || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {topProducts.length === 0 && <p className="text-sm text-gray-400 italic">No sales data available.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- SHIFTS TAB --- */}
        <TabsContent value="shifts" className="space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-gray-50 flex items-center gap-2">
              <Clock className="text-orange-500 w-5 h-5" />
              <h3 className="text-xl font-black text-gray-900">End of Day Shift Reports</h3>
            </div>
            <div className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-600">Shift Time</TableHead>
                    <TableHead className="font-semibold text-gray-600">Cashier</TableHead>
                    <TableHead className="font-semibold text-gray-600">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Expected Cash</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Actual Cash</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShifts.slice().reverse().map((shift, i) => (
                    <TableRow key={i} className="hover:bg-gray-50/40">
                      <TableCell>
                        <div className="font-bold text-gray-900">{new Date(shift.openedAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(shift.openedAt).toLocaleTimeString()} - {shift.closedAt ? new Date(shift.closedAt).toLocaleTimeString() : 'Active'}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-700">{shift.cashierName}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${shift.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                          {shift.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-600">Rs. {(shift.expectedCash || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-black text-gray-900">Rs. {(shift.actualCash || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {shift.status === 'CLOSED' ? (
                          <span className={`font-bold ${shift.variance < 0 ? 'text-red-600' : shift.variance > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                            {shift.variance > 0 ? '+' : ''}Rs. {(shift.variance || 0).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredShifts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500 italic">No shift reports found for the selected period.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* --- INVENTORY TAB --- */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="font-bold text-gray-500 uppercase tracking-wider">Total Stock Valuation</CardDescription>
                <CardTitle className="text-3xl font-black text-gray-900">Rs. {inventoryValuation.toFixed(2)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-gray-500">Estimated value of current raw materials in stock.</div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                  {filteredInventory.filter(i => i.quantity <= i.minStock).map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-red-50 p-2 rounded-lg">
                      <span className="font-bold text-red-900">{item.rawMaterialName}</span>
                      <span className="font-black text-red-600">{item.quantity} {item.unit} left</span>
                    </div>
                  ))}
                  {filteredInventory.filter(i => i.quantity <= i.minStock).length === 0 && (
                    <p className="text-sm text-green-600 font-bold">All stock levels are optimal.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- PURCHASES TAB --- */}
        <TabsContent value="purchases" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-orange-500"/> Purchase Orders (PO Summary)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredPO.slice().reverse().map((po, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                      <div>
                        <div className="font-bold text-gray-900">{po.poNumber}</div>
                        <div className="text-xs font-medium text-gray-500">{new Date(po.createdAt).toLocaleDateString()} • {po.supplierName}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-blue-600">Rs. {(po.totalAmount || 0).toFixed(2)}</div>
                        <div className={`text-[10px] font-bold uppercase ${po.status === 'Approved' ? 'text-green-500' : 'text-orange-500'}`}>{po.status}</div>
                      </div>
                    </div>
                  ))}
                  {filteredPO.length === 0 && <p className="text-sm text-gray-400 italic">No purchase orders found.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-orange-500"/> GRN Summary (Received Goods)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredGRN.slice().reverse().map((grn, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                      <div>
                        <div className="font-bold text-gray-900">{grn.grnNumber}</div>
                        <div className="text-xs font-medium text-gray-500">{new Date(grn.createdAt).toLocaleDateString()} • Ref: {grn.poNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-green-600">Rs. {(grn.totalAmount || 0).toFixed(2)}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Received</div>
                      </div>
                    </div>
                  ))}
                  {filteredGRN.length === 0 && <p className="text-sm text-gray-400 italic">No GRN records found.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- EXPENSES TAB --- */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5 text-orange-500"/> Operational Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-red-600 mb-6">Rs. {totalExpenses.toFixed(2)}</div>
                <div className="space-y-3">
                  {/* Aggregate by category */}
                  {Object.entries(
                    filteredExpenses.reduce((acc, e) => {
                      acc[e.category] = (acc[e.category] || 0) + e.amount
                      return acc
                    }, {} as Record<string, number>)
                  ).sort((a: any, b: any) => b[1]-a[1]).map(([cat, amount]: any, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                        <span>{cat}</span>
                        <span>Rs. {(amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-red-400 h-2 rounded-full" style={{ width: `${(amount/totalExpenses)*100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-orange-500"/> Wastage & Spoilage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-red-600 mb-6">Rs. {totalWastageCost.toFixed(2)}</div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {wastageRecords.map((w, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                      <div>
                        <div className="font-bold text-gray-900">{w.rawMaterialName}</div>
                        <div className="text-xs font-medium text-gray-500">{w.reason} • {new Date(w.timestamp).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-red-600">{w.quantityChange} {w.baseUnit}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Lost</div>
                      </div>
                    </div>
                  ))}
                  {wastageRecords.length === 0 && <p className="text-sm text-gray-400 italic">No wastage recorded.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
