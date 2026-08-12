"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Users, ShoppingBag, TrendingUp, Loader2 } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useAuth } from "@/context/AuthContext"

export default function DashboardPage() {
  const { user, role } = useAuth()
  const [sales, setSales] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/sales')
        if (res.ok) {
          const data = await res.json()
          setSales(data)
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Loading Dashboard...</h2>
      </div>
    )
  }

  // --- Calculations ---
  // Filtering logic based on branch (optional, can just show all for admin)
  const canSeeAllBranches = role === "Super Admin" || role === "Admin"
  const defaultBranch = canSeeAllBranches ? "All" : (user?.branch || "Colombo 07")
  
  const relevantSales = sales.filter(s => defaultBranch === "All" ? true : s.branch === defaultBranch)

  // Get Today's Date Boundaries
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const salesToday = relevantSales.filter(s => {
    const d = new Date(s.timestamp || s.createdAt)
    return d >= today && d < tomorrow
  })

  const salesYesterday = relevantSales.filter(s => {
    const d = new Date(s.timestamp || s.createdAt)
    return d >= yesterday && d < today
  })

  // Metrics
  const revenueToday = salesToday.reduce((acc, s) => acc + (s.total || s.grandTotal || 0), 0)
  const revenueYesterday = salesYesterday.reduce((acc, s) => acc + (s.total || s.grandTotal || 0), 0)
  const revenueTrend = revenueYesterday > 0 ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 : (revenueToday > 0 ? 100 : 0)

  const ordersToday = salesToday.length
  const ordersYesterday = salesYesterday.length
  const ordersTrend = ordersYesterday > 0 ? ((ordersToday - ordersYesterday) / ordersYesterday) * 100 : (ordersToday > 0 ? 100 : 0)

  // Customers 
  const customersToday = new Set(salesToday.map(s => s.customer)).size
  const customersYesterday = new Set(salesYesterday.map(s => s.customer)).size
  const customersTrend = customersYesterday > 0 ? ((customersToday - customersYesterday) / customersYesterday) * 100 : (customersToday > 0 ? 100 : 0)

  // Top Selling Item Today
  const itemCounts: Record<string, {name: string, qty: number}> = {}
  salesToday.forEach(sale => {
    sale.items?.forEach((item: any) => {
      if (!itemCounts[item.productId]) itemCounts[item.productId] = { name: item.name, qty: 0 }
      itemCounts[item.productId].qty += item.quantity
    })
  })
  const topItem = Object.values(itemCounts).sort((a,b) => b.qty - a.qty)[0]

  // Chart Data (Last 7 Days)
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setHours(0,0,0,0)
    const nextD = new Date(d)
    nextD.setDate(nextD.getDate() + 1)
    
    const daySales = relevantSales.filter(s => {
      const sDate = new Date(s.timestamp || s.createdAt)
      return sDate >= d && sDate < nextD
    })
    
    const rev = daySales.reduce((acc, s) => acc + (s.total || s.grandTotal || 0), 0)
    chartData.push({
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      total: rev
    })
  }

  // Recent Sales
  const recentSalesList = relevantSales.slice().sort((a,b) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime()).slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-gray-900">Overview</h2>
        <p className="text-gray-500 font-medium mt-1">Here&apos;s what&apos;s happening at your juice bar today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-sm border-0 border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Revenue</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><DollarSign className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">Rs. {revenueToday.toFixed(2)}</div>
            <p className={`text-sm font-bold mt-1 ${revenueTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {revenueTrend > 0 ? '+' : ''}{revenueTrend.toFixed(1)}% from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl shadow-sm border-0 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Orders</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><ShoppingBag className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{ordersToday}</div>
            <p className={`text-sm font-bold mt-1 ${ordersTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {ordersTrend > 0 ? '+' : ''}{ordersTrend.toFixed(1)}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-0 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Customers</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Users className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{customersToday}</div>
            <p className={`text-sm font-bold mt-1 ${customersTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
               {customersTrend > 0 ? '+' : ''}{customersTrend.toFixed(1)}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-0 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Top Selling Today</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg text-green-600"><TrendingUp className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900 truncate mt-1">{topItem ? topItem.name : 'N/A'}</div>
            <p className="text-sm font-bold text-gray-400 mt-1">{topItem ? `${topItem.qty} orders today` : 'No sales yet'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 rounded-2xl shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Revenue Overview (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 pr-4">
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs.${value}`} dx={-10} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f4f4f5', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`Rs. ${Number(value).toFixed(2)}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 rounded-2xl shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 pr-2">
              {recentSalesList.map((sale, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-lg">
                    {sale.customer === 'Walk-In Customer' ? 'W' : sale.customer?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-base font-bold leading-none text-gray-900">{sale.invoiceNo || sale.id}</p>
                    <p className="text-xs font-bold text-gray-500">{new Date(sale.timestamp || sale.createdAt).toLocaleTimeString()} • {sale.items?.length || 0} items</p>
                  </div>
                  <div className="font-black text-green-600 text-lg">+ Rs. {(sale.total || sale.grandTotal || 0).toFixed(2)}</div>
                </div>
              ))}
              {recentSalesList.length === 0 && (
                <div className="text-center text-gray-500 font-bold py-10 bg-gray-50 rounded-xl">No recent sales today.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
