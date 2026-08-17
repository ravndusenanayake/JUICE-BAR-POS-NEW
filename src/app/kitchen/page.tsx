"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Clock, CheckCircle2, ChefHat, Timer, Filter, LayoutDashboard, Monitor } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function KitchenDisplay() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // -- Branch Selection State --
  const [kitchenBranch, setKitchenBranch] = useState<string | null>(null)
  const branchPrompted = useRef(false)
  const [availableBranches, setAvailableBranches] = useState<any[]>([])
  const [isBranchSelectOpen, setIsBranchSelectOpen] = useState(false)
  
  // -- Filter State --
  const [statusFilter, setStatusFilter] = useState<string>("Active") // Active, Pending, Preparing, Ready, All

  useEffect(() => {
    if (!user) return;
    
    // Check if branch was passed via URL (e.g. coming from POS)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryBranch = params.get('branch');
      if (queryBranch) {
        setKitchenBranch(queryBranch);
        return; // Skip normal prompt logic
      }
    }
    
    if (user.branch === "All Branches") {
      if (!branchPrompted.current) {
        branchPrompted.current = true;
        setIsBranchSelectOpen(true);
        fetch('/api/branches')
          .then(res => res.json())
          .then(data => {
          const active = data.filter((b: any) => b.status === "Active");
          if (active.length === 0) {
            fetch('/api/seed').then(() => {
              fetch('/api/branches').then(r => r.json()).then(d => {
                setAvailableBranches(d.filter((b: any) => b.status === "Active"));
              });
            });
          } else {
            setAvailableBranches(active);
          }
          })
          .catch(console.error);
      }
    } else {
      setKitchenBranch(user.branch);
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!kitchenBranch) return;
    try {
      const branchParam = `&branch=${encodeURIComponent(kitchenBranch)}`;
      let statusParam = "";
      if (statusFilter === "Active") statusParam = "kitchenStatus=Pending,Preparing";
      else if (statusFilter === "All") statusParam = "kitchenStatus=Pending,Preparing,Ready";
      else statusParam = `kitchenStatus=${statusFilter}`;
      
      const res = await fetch(`/api/sales?${statusParam}${branchParam}`);
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
    if (kitchenBranch) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [kitchenBranch, statusFilter]);

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

  if (!user || (!kitchenBranch && !isBranchSelectOpen)) return <div className="h-screen flex items-center justify-center font-bold text-gray-500">Loading KDS...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-orange-500/30">
      
      {/* HEADER */}
      <header className="h-auto py-3 md:py-0 md:h-16 flex flex-col md:flex-row items-center justify-between px-4 md:px-6 bg-gray-950 border-b border-gray-800 shadow-sm shrink-0 gap-3 md:gap-0">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-white">
            <ChefHat className="w-6 h-6 text-orange-500" />
            Kitchen <span className="hidden md:inline">Display</span> <span className="text-gray-500 font-normal text-sm md:text-base ml-1 md:ml-2">({kitchenBranch || "Select Branch"})</span>
          </div>
        </div>

        {/* Filters - Desktop */}
        <div className="hidden md:flex bg-gray-900 rounded-lg p-1 border border-gray-800 absolute left-1/2 -translate-x-1/2">
          {["Active", "Pending", "Preparing", "Ready", "All"].map(filter => (
            <button
              key={filter}
              onClick={() => {
                setLoading(true);
                setStatusFilter(filter);
              }}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${statusFilter === filter ? 'bg-gray-800 text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Filters - Mobile */}
        <div className="flex md:hidden gap-2 overflow-x-auto scrollbar-hide w-full">
          {["Active", "Pending", "Preparing", "Ready", "All"].map(filter => (
            <button
              key={filter}
              onClick={() => {
                setLoading(true);
                setStatusFilter(filter);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${statusFilter === filter ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          <div className="flex items-center gap-2 shrink-0">
          <Link href="/pos" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-800 px-3 py-1.5 rounded-md border border-gray-700">
            <Monitor className="w-4 h-4" />
            POS
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-800 px-3 py-1.5 rounded-md border border-gray-700">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Badge variant="secondary" className="bg-gray-800 text-gray-300 font-medium">
            {orders.length} Active Orders
          </Badge>
          <div className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Live Sync
          </div>
        </div>
        </div>
      </header>

      {/* ORDERS GRID */}
      <main className="p-3 md:p-6 h-[calc(100vh-4rem)] overflow-y-auto">
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
                  ) : order.kitchenStatus === 'Preparing' ? (
                    <Button 
                      className="w-full h-12 text-lg font-black bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-900/20 transition-all active:scale-95"
                      onClick={() => updateOrderStatus(order._id, 'Ready')}
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" /> BUMP (Ready)
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      className="w-full h-12 text-lg font-black bg-gray-800 border-gray-600 text-gray-400 rounded-xl cursor-default"
                      disabled
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" /> Ready
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Branch Selection Modal */}
      <Dialog open={isBranchSelectOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md p-6 bg-white" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Select Operating Branch</DialogTitle>
            <DialogDescription>
              Please select the branch for the Kitchen Display.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {availableBranches.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-4">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                 <p className="text-sm text-gray-500">Auto-seeding database... Please wait.</p>
               </div>
            ) : (
              availableBranches.map(b => (
                <button 
                  key={b._id} 
                  type="button"
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all font-bold ${kitchenBranch === b.name ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 bg-white hover:border-orange-300'}`}
                  onClick={() => setKitchenBranch(b.name)}
                >
                  {b.name}
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-lg font-bold rounded-xl disabled:opacity-50" 
              disabled={!kitchenBranch}
              onClick={() => {
                setIsBranchSelectOpen(false);
                setLoading(true);
              }}
            >
              Confirm Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
