"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, CheckCircle2, ChefHat, Timer } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function KitchenDisplay() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      const branchParam = user?.branch && user.branch !== "All Branches" 
        ? `&branch=${encodeURIComponent(user.branch)}` 
        : "";
      const res = await fetch(`/api/sales?kitchenStatus=Pending,Preparing${branchParam}`);
      if (res.ok) {
        const data = await res.json();
        // Sort oldest first
        const sorted = data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setOrders(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch KDS orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [user]);

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          kitchenStatus: newStatus
        })
      });
      if (res.ok) {
        toast.success(`Order ${newStatus}`);
        fetchOrders();
      } else {
        toast.error("Failed to update status");
      }
    } catch (e) {
      toast.error("Error updating order");
    }
  }

  // Helper to calculate elapsed time in minutes
  const getElapsedMinutes = (dateString: string) => {
    const diffMs = new Date().getTime() - new Date(dateString).getTime();
    return Math.floor(diffMs / 60000);
  }

  // Timer component to auto-re-render every minute
  const OrderTimer = ({ createdAt }: { createdAt: string }) => {
    const [mins, setMins] = useState(getElapsedMinutes(createdAt));
    
    useEffect(() => {
      const timer = setInterval(() => setMins(getElapsedMinutes(createdAt)), 10000); // Check every 10s
      return () => clearInterval(timer);
    }, [createdAt]);

    let color = "text-green-600 bg-green-50 border-green-200";
    if (mins >= 10) color = "text-red-600 bg-red-50 border-red-200";
    else if (mins >= 5) color = "text-orange-600 bg-orange-50 border-orange-200";

    return (
      <Badge variant="outline" className={`font-bold ${color} text-sm px-2 py-1`}>
        <Timer className="w-3.5 h-3.5 mr-1" />
        {mins} min
      </Badge>
    );
  }

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-gray-500">Loading KDS...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-orange-500/30">
      
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-6 bg-gray-950 border-b border-gray-800 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <ChefHat className="w-6 h-6 text-orange-500" />
            Kitchen Display <span className="text-gray-500 font-normal text-base ml-2">({user?.branch || "All Branches"})</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-gray-800 text-gray-300 font-medium">
            {orders.length} Active Orders
          </Badge>
          <div className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Live Sync
          </div>
        </div>
      </header>

      {/* ORDERS GRID */}
      <main className="p-6 h-[calc(100vh-4rem)] overflow-y-auto">
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <ChefHat className="w-20 h-20 mb-4 opacity-20" />
            <p className="text-2xl font-bold text-gray-600">No active orders</p>
            <p className="text-sm mt-2">Kitchen is clear!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {orders.map((order) => (
              <Card key={order._id} className={`border-2 shadow-lg overflow-hidden flex flex-col transition-all ${order.kitchenStatus === 'Preparing' ? 'border-orange-500 bg-gray-800' : 'border-gray-700 bg-gray-800'}`}>
                
                {/* Order Header */}
                <CardHeader className={`p-3 pb-2 border-b ${order.kitchenStatus === 'Preparing' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-gray-800 border-gray-700'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl font-black text-white">#{order.invoiceNo.split('-').pop()}</CardTitle>
                    <OrderTimer createdAt={order.createdAt} />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-300 truncate max-w-[120px]">{order.customer}</span>
                    <Badge variant="outline" className={`${order.orderType === 'Dine-In' ? 'border-blue-500 text-blue-400' : 'border-purple-500 text-purple-400'}`}>
                      {order.orderType}
                    </Badge>
                  </div>
                </CardHeader>
                
                {/* Order Items */}
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  <div className="divide-y divide-gray-700/50">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-800/50">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-2">
                            <span className="font-black text-lg text-orange-400">{item.quantity}x</span>
                            <div>
                              <p className="font-bold text-white text-base leading-tight">{item.name}</p>
                              {item.variant && <p className="text-sm text-gray-400 mt-0.5">{item.variant}</p>}
                              
                              {/* Addons */}
                              {item.addons && item.addons.length > 0 && (
                                <ul className="mt-1 space-y-0.5">
                                  {item.addons.map((addon: any, aidx: number) => (
                                    <li key={aidx} className="text-xs text-orange-300 flex items-center before:content-['+'] before:mr-1 before:opacity-50">
                                      {addon.name}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              
                              {/* Notes */}
                              {item.note && (
                                <div className="mt-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300 italic">
                                  ⚠️ {item.note}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {order.orderNote && (
                    <div className="m-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-xs font-bold text-yellow-500 mb-1">Global Order Note:</p>
                      <p className="text-sm text-yellow-100">{order.orderNote}</p>
                    </div>
                  )}
                </CardContent>

                {/* Actions */}
                <div className="p-3 bg-gray-900 border-t border-gray-700 shrink-0">
                  {order.kitchenStatus === 'Pending' ? (
                    <Button 
                      className="w-full h-12 text-lg font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                      onClick={() => updateOrderStatus(order._id, 'Preparing')}
                    >
                      Start Preparing
                    </Button>
                  ) : (
                    <Button 
                      className="w-full h-12 text-lg font-black bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-900/20 transition-all active:scale-95"
                      onClick={() => updateOrderStatus(order._id, 'Ready')}
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" /> BUMP (Ready)
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
