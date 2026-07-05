import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, ShoppingCart, Trash2, ArrowLeft, Plus, Minus } from "lucide-react"
import Link from "next/link"

export default function POSPage() {
  return (
    <div className="flex h-screen w-full bg-muted/30 overflow-hidden flex-col md:flex-row">
      {/* Products Section (Left) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-card flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-primary">Juice Bar POS</h1>
          </div>
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full pl-8 bg-muted border-none"
              />
            </div>
          </div>
        </header>

        {/* Categories Menu */}
        <div className="border-b bg-card p-4 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          {['All Items', 'Fresh Juices', 'Smoothies', 'Fruit Bowls', 'Add-ons'].map((cat, i) => (
            <Button
              key={cat}
              variant={i === 0 ? 'default' : 'outline'}
              className="whitespace-nowrap rounded-full px-6"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <Card key={i} className="cursor-pointer hover:border-primary transition-all overflow-hidden group">
                <div className="h-32 bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <div className="text-5xl">🍹</div>
                </div>
                <CardContent className="p-3">
                  <div className="font-semibold text-sm line-clamp-1">Tropical Mango {i}</div>
                  <div className="text-primary font-bold mt-1">$6.50</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>

      {/* Cart Section (Right) */}
      <div className="w-full md:w-96 border-l bg-card flex flex-col h-[50vh] md:h-full shrink-0 shadow-xl z-10">
        <div className="h-16 border-b flex items-center px-4 shrink-0">
          <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
          <h2 className="font-semibold text-lg">Current Order</h2>
          <div className="ml-auto bg-primary/10 text-primary px-2 py-0.5 rounded text-sm font-medium">
            Order #1048
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-12 w-12 bg-secondary/10 rounded-md flex items-center justify-center text-xl">
                🥭
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Tropical Mango</div>
                <div className="text-muted-foreground text-xs">$6.50</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-7 w-7 rounded-full">
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium w-4 text-center">2</span>
                <Button variant="outline" size="icon" className="h-7 w-7 rounded-full">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="font-bold text-sm ml-2">$13.00</div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="border-t p-4 bg-muted/20 shrink-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>$26.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (8%)</span>
              <span>$2.08</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span className="text-primary">$28.08</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-white border-destructive/30">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button className="bg-primary text-white hover:bg-primary/90 h-12 text-lg font-bold shadow-lg shadow-primary/30">
              Pay $28.08
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
