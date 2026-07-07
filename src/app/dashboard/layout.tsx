import Link from "next/link"
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  LogOut,
  Store,
  Droplets,
  Tags,
  ShieldCheck,
  UserCog,
  Box,
  PlusCircle
} from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        <nav className="flex-1 space-y-1 p-4">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary transition-all">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/pos" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <Store className="h-5 w-5" />
            POS Terminal
          </Link>
          <Link href="/dashboard/sales" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <ShoppingCart className="h-5 w-5" />
            Sales
          </Link>
          <Link href="/dashboard/inventory" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <Package className="h-5 w-5" />
            Inventory
          </Link>
          <Link href="/dashboard/customers" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <Users className="h-5 w-5" />
            Customers
          </Link>
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
          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Products</p>
          </div>
          <Link href="/dashboard/categories" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <Tags className="h-5 w-5" />
            Category
          </Link>
          <Link href="/dashboard/units" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <Package className="h-5 w-5" />
            Units
          </Link>
          <Link href="/dashboard/products" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <Box className="h-5 w-5" />
            All Products
          </Link>
          <Link href="/dashboard/add-ons" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <PlusCircle className="h-5 w-5" />
            Add-Ons
          </Link>
          <Link href="/dashboard/inventory" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <Store className="h-5 w-5" />
            Products Inventory
          </Link>
          <Link href="/dashboard/raw-materials" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-all">
            <Package className="h-4 w-4" />
            Raw Materials (Master)
          </Link>
          <Link href="/dashboard/branch-inventory" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-all">
            <LayoutDashboard className="h-4 w-4" />
            Branch Inventory
          </Link>
          <Link href="/dashboard/raw-material-inventory" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <Package className="h-5 w-5" />
            Raw Material Inventory
          </Link>
          <Link href="/dashboard/recipes" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <Settings className="h-5 w-5" />
            Recipes
          </Link>
          <Link href="/dashboard/stock-alerts" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <ShieldCheck className="h-5 w-5" />
            Stock Alerts
          </Link>
          <Link href="/dashboard/tables" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <LayoutDashboard className="h-5 w-5" />
            Tables
          </Link>
        </nav>
        <div className="mt-auto border-t p-4">
          <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <Settings className="h-5 w-5" />
            Settings
          </Link>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-destructive hover:bg-destructive/10 transition-all mt-2">
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
          <div className="flex items-center gap-4">
            <div className="text-sm text-right hidden sm:block">
              <p className="font-medium">Admin User</p>
              <p className="text-muted-foreground">Main Branch</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              A
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
