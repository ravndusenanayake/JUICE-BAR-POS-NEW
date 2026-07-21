"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { PERMISSIONS } from "@/lib/permissions"
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Settings, LogOut, Store,
  Droplets, Tags, ShieldCheck, UserCog, Box,  ListOrdered,
  History,
  Truck,
  Building2,
  FileText, 
  ArrowRightLeft,
  Wallet,
  PlusCircle,
  BarChart3,
  Activity,
  ChevronDown,
  ChevronUp
} from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { role, user, logout, isAuthenticated, hasPermission } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isReportsOpen, setIsReportsOpen] = useState(false)
  const [isGrnOpen, setIsGrnOpen] = useState(false)

  // Protect Dashboard Routes
  useEffect(() => {
    setIsMounted(true)
    if (!isAuthenticated && isMounted) {
      router.push("/login")
    }
  }, [isAuthenticated, router, isMounted])

  // RBAC Access Control per Route is now handled Server-Side by middleware.ts

  if (!isMounted || !isAuthenticated) return <div className="h-screen flex items-center justify-center">Loading...</div>

  // Helper to check if link is active
  const isActive = (path: string) => pathname === path

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Droplets className="h-6 w-6 text-primary" />
            <span className="text-lg">Juice Bar POS</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto custom-scrollbar">
          {/* Quick Access - POS */}
          {hasPermission(PERMISSIONS.ACCESS_POS) && (
            <div className="pb-2">
              <Link href="/pos" className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${isActive('/pos') ? 'bg-orange-500 text-white font-bold shadow-md' : 'bg-orange-100 text-orange-800 hover:bg-orange-200 font-bold'}`}>
                <Store className="h-5 w-5" /> POS System
              </Link>
            </div>
          )}

          {/* 1. Administration */}
          {(hasPermission(PERMISSIONS.VIEW_DASHBOARD) || hasPermission(PERMISSIONS.VIEW_BRANCHES)) && (
            <>
              <div className="pb-1 pt-2">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administration</p>
              </div>
              {hasPermission(PERMISSIONS.VIEW_DASHBOARD) && (
                <Link href="/dashboard" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              )}
              {hasPermission(PERMISSIONS.VIEW_BRANCHES) && (
                <Link href="/dashboard/branches" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/branches') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                  <Store className="h-4 w-4" /> Branches
                </Link>
              )}
              {hasPermission(PERMISSIONS.VIEW_ROLES) && (
                <Link href="/dashboard/roles" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/roles') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                  <ShieldCheck className="h-4 w-4" /> Roles
                </Link>
              )}
              {hasPermission(PERMISSIONS.VIEW_USERS) && (
                <>
                  <Link href="/dashboard/users" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/users') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                    <UserCog className="h-4 w-4" /> Users
                  </Link>
                  <Link href="/dashboard/staff" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/staff') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                    <Users className="h-4 w-4" /> Staff
                  </Link>
                </>
              )}
              {hasPermission(PERMISSIONS.MANAGE_SYSTEM_SETTINGS) && (
                <Link href="/dashboard/settings" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/settings') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              )}
            </>
          )}

          {/* 2. Master Data */}
          {(hasPermission(PERMISSIONS.VIEW_PRODUCTS) || hasPermission(PERMISSIONS.VIEW_CATEGORIES)) && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Master Data</p>
              </div>
              {hasPermission(PERMISSIONS.VIEW_CATEGORIES) && (
                <Link href="/dashboard/categories" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/categories') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                  <Tags className="h-4 w-4" /> Categories
                </Link>
              )}
              {hasPermission(PERMISSIONS.VIEW_PRODUCTS) && (
                <>
                  <Link href="/dashboard/products" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/products') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                    <Box className="h-4 w-4" /> Products
                  </Link>
                  <Link href="/dashboard/raw-materials" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/raw-materials') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                    <Droplets className="h-4 w-4" /> Raw Materials
                  </Link>
                </>
              )}
              {hasPermission(PERMISSIONS.VIEW_PRODUCTS) && (
                <>
                  <Link href="/dashboard/product-variants" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/product-variants') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                    <ListOrdered className="h-4 w-4" /> Variants
                  </Link>
                  <Link href="/dashboard/add-ons" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/add-ons') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                    <PlusCircle className="h-4 w-4" /> Add-ons
                  </Link>
                </>
              )}
              {hasPermission(PERMISSIONS.VIEW_RECIPES) && (
                <Link href="/dashboard/recipes" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/recipes') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                  <FileText className="h-4 w-4" /> Recipes
                </Link>
              )}
              {hasPermission(PERMISSIONS.VIEW_SUPPLIERS) && (
                <Link href="/dashboard/suppliers" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/suppliers') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                  <Building2 className="h-4 w-4" /> Suppliers
                </Link>
              )}
            </>
          )}

          {/* 3. Inventory */}
          {(hasPermission(PERMISSIONS.VIEW_INVENTORY) || hasPermission(PERMISSIONS.VIEW_PO)) && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inventory</p>
              </div>
              {hasPermission(PERMISSIONS.VIEW_INVENTORY) && (
                <>
                  <Link href="/dashboard/branch-inventory" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/branch-inventory') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                    <Package className="h-4 w-4" /> Inventory List
                  </Link>
                  <Link href="/dashboard/stock-adjustments" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/stock-adjustments') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                    <History className="h-4 w-4" /> Stock Adjustment
                  </Link>
                </>
              )}
              {hasPermission(PERMISSIONS.VIEW_PO) && (
                <Link href="/dashboard/purchase-orders" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/purchase-orders') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                  <Truck className="h-4 w-4" /> Purchase Orders
                </Link>
              )}
              
              {hasPermission(PERMISSIONS.VIEW_GRN) && (
                <div className="pt-2">
                  <button 
                    onClick={() => setIsGrnOpen(!isGrnOpen)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isGrnOpen || pathname.includes('/dashboard/grn') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <FileText className="h-4 w-4" /> 
                    <span className="flex-1 text-left">GRN</span>
                    {isGrnOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {(isGrnOpen || pathname.includes('/dashboard/grn')) && (
                    <div className="mt-1 space-y-1">
                      <Link href="/dashboard/grn/create" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm pl-9 ${isActive('/dashboard/grn/create') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                        Create GRN
                      </Link>
                      <Link href="/dashboard/grn/all" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm pl-9 ${isActive('/dashboard/grn/all') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                        All GRN
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {hasPermission(PERMISSIONS.VIEW_STOCK_TRANSFERS) && (
                <Link href="/dashboard/stock-transfers" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/stock-transfers') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                  <ArrowRightLeft className="h-4 w-4" /> Stock Transfers
                </Link>
              )}
              {hasPermission(PERMISSIONS.VIEW_WASTAGE) && (
                <Link href="/dashboard/wastage" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/wastage') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                  <Activity className="h-4 w-4" /> Wastage
                </Link>
              )}
            </>
          )}

          {/* 4. Sales */}
          {(hasPermission(PERMISSIONS.VIEW_SALES_HISTORY) || hasPermission(PERMISSIONS.VIEW_CUSTOMERS)) && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sales</p>
              </div>

              {hasPermission(PERMISSIONS.VIEW_CUSTOMERS) && (
                <Link href="/dashboard/customers" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/customers') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                  <Users className="h-4 w-4" /> Customers
                </Link>
              )}
              {hasPermission(PERMISSIONS.VIEW_SALES_HISTORY) && (
                <Link href="/dashboard/sales" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/sales') ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}>
                  <ShoppingCart className="h-4 w-4" /> Sales History
                </Link>
              )}
            </>
          )}

          {/* 5. Reports */}
          {(hasPermission(PERMISSIONS.VIEW_ALL_REPORTS) || hasPermission(PERMISSIONS.VIEW_BRANCH_REPORTS)) && (
            <div className="pt-2">
              <button 
                onClick={() => setIsReportsOpen(!isReportsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted rounded-lg transition-all"
              >
                <span>Reports</span>
                {isReportsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {isReportsOpen && (
                <div className="mt-1 space-y-1">
                  <Link href="/dashboard/reports?tab=sales" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all text-sm pl-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Sales Reports
                  </Link>
                  <Link href="/dashboard/reports?tab=inventory" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all text-sm pl-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Inventory Reports
                  </Link>
                  <Link href="/dashboard/reports?tab=purchases" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all text-sm pl-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Purchase Reports
                  </Link>
                  <Link href="/dashboard/reports?tab=expenses" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all text-sm pl-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Expense Reports
                  </Link>
                  <Link href="/dashboard/reports?tab=expenses" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all text-sm pl-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Wastage Reports
                  </Link>
                  <Link href="/dashboard/reports?tab=profit" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all text-sm pl-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Profitability Reports
                  </Link>
                </div>
              )}
            </div>
          )}

        </nav>
        <div className="mt-auto border-t p-4 space-y-2">
          {hasPermission(PERMISSIONS.MANAGE_SYSTEM_SETTINGS) && (
            <Link href="/dashboard/system-settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-amber-600 font-semibold hover:bg-amber-50 transition-all border-t pt-4">
              <Settings className="h-5 w-5" />
              System Settings (Limits)
            </Link>
          )}
          <div className="pt-2">
            <p className="text-xs px-3 text-muted-foreground">Logged in as:</p>
            <p className="text-sm px-3 font-semibold truncate text-gray-900">{user?.name}</p>
            <p className="text-xs px-3 text-primary font-medium">{role} • {user?.branch}</p>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-destructive hover:bg-destructive/10 transition-all mt-2 font-medium">
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold md:hidden">Juice Bar POS</h1>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm font-medium bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
              {user?.branch}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/10 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
