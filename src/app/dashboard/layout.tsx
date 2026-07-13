"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
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
  Activity
} from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { role, user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)

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

  const hasAccess = (allowedRoles: string[]) => allowedRoles.includes(role || "")

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
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <Link href="/dashboard" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/pos" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/pos') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
            <Store className="h-5 w-5" />
            POS Terminal
          </Link>
          <Link href="/dashboard/sales" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/sales') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
            <ShoppingCart className="h-5 w-5" />
            Sales
          </Link>

          {(hasAccess(["Super Admin", "Admin", "Branch Manager", "Cashier"])) && (
            <Link href="/dashboard/customers" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/customers') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
              <Users className="h-5 w-5" />
              Customers
            </Link>
          )}

          {hasAccess(["Super Admin", "Admin"]) && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administration</p>
              </div>
              <Link href="/dashboard/users" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
                <UserCog className="h-5 w-5" />
                User Management
              </Link>
              <Link href="/dashboard/roles" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
                <ShieldCheck className="h-5 w-5" />
                Roles & Permissions
              </Link>
              <Link href="/dashboard/branches" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
                <Store className="h-5 w-5" />
                Branch Management
              </Link>
              <Link href="/dashboard/audit-logs" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all ${isActive('/dashboard/audit-logs') ? 'bg-primary/10 text-primary' : ''}`}>
                <Activity className="h-5 w-5" />
                System Logs
              </Link>
            </>
          )}

          {hasAccess(["Super Admin", "Admin"]) && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Products & Recipes</p>
              </div>
              <Link href="/dashboard/categories" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
                <Tags className="h-5 w-5" />
                Category
              </Link>
              <Link href="/dashboard/products" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
                <Box className="h-5 w-5" />
                All Products
              </Link>
              <Link href="/dashboard/product-variants" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all ${isActive('/dashboard/product-variants') ? 'bg-primary/10 text-primary' : ''}`}>
                <ListOrdered className="h-5 w-5" />
                Product Variants
              </Link>
              <Link href="/dashboard/add-ons" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
                <PlusCircle className="h-5 w-5" />
                Add-Ons
              </Link>
              <Link href="/dashboard/recipes" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
                <Settings className="h-5 w-5" />
                Recipes
              </Link>
            </>
          )}

          {hasAccess(["Super Admin", "Admin", "Branch Manager", "Store Keeper"]) && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inventory & Stock</p>
              </div>
              <Link href="/dashboard/branch-inventory" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/branch-inventory') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-orange-50 hover:text-orange-600'}`}>
                <LayoutDashboard className="h-4 w-4" />
                Branch Inventory
              </Link>
              <Link href="/dashboard/stock-ledger" className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive('/dashboard/stock-ledger') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                <History className="h-5 w-5" />
                Stock Ledger
              </Link>
            </>
          )}

          {hasAccess(["Super Admin", "Admin", "Branch Manager", "Store Keeper"]) && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Procurement</p>
              </div>
              <Link href="/dashboard/suppliers" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all ${isActive('/dashboard/suppliers') ? 'bg-primary/10 text-primary' : ''}`}>
                <Building2 className="h-5 w-5" />
                Suppliers
              </Link>
              <Link href="/dashboard/purchase-orders" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all ${isActive('/dashboard/purchase-orders') ? 'bg-primary/10 text-primary' : ''}`}>
                <Truck className="h-5 w-5" />
                Purchase Orders
              </Link>
              <Link href="/dashboard/grn" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all ${isActive('/dashboard/grn') ? 'bg-primary/10 text-primary' : ''}`}>
                <FileText className="h-5 w-5" />
                All GRNs
              </Link>
              <Link href="/dashboard/stock-transfers" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all ${isActive('/dashboard/stock-transfers') ? 'bg-primary/10 text-primary' : ''}`}>
                <ArrowRightLeft className="h-5 w-5" />
                Stock Transfers
              </Link>
            </>
          )}

          {hasAccess(["Super Admin", "Admin", "Branch Manager"]) && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Finance & Reports</p>
              </div>
              <Link href="/dashboard/expenses" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all ${isActive('/dashboard/expenses') ? 'bg-primary/10 text-primary' : ''}`}>
                <Wallet className="h-5 w-5" />
                Expenses
              </Link>
              <Link href="/dashboard/reports" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all ${isActive('/dashboard/reports') ? 'bg-primary/10 text-primary' : ''}`}>
                <BarChart3 className="h-5 w-5 text-orange-500" />
                Reports & Analytics
              </Link>
            </>
          )}

        </nav>
        <div className="mt-auto border-t p-4 space-y-2">
          {hasAccess(["Super Admin", "Admin", "Branch Manager"]) && (
            <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          )}
          {hasAccess(["Super Admin"]) && (
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
