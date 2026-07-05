"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, ShoppingCart, Trash2, ArrowLeft, Plus, Minus } from "lucide-react"
import Link from "next/link"

type Product = {
  id: string
  name: string
  price: number
  icon: string
  category: string
}

const DUMMY_PRODUCTS: Product[] = [
  { id: '1', name: 'Tropical Mango', price: 6.50, icon: '🥭', category: 'Smoothies' },
  { id: '2', name: 'Green Detox', price: 5.00, icon: '🥬', category: 'Fresh Juices' },
  { id: '3', name: 'Acai Bowl', price: 8.50, icon: '🥣', category: 'Fruit Bowls' },
  { id: '4', name: 'Strawberry Blast', price: 6.00, icon: '🍓', category: 'Smoothies' },
  { id: '5', name: 'Watermelon Breeze', price: 4.50, icon: '🍉', category: 'Fresh Juices' },
  { id: '6', name: 'Ginger Shot', price: 2.00, icon: '🫚', category: 'Add-ons' },
  { id: '7', name: 'Citrus Burst', price: 5.50, icon: '🍊', category: 'Fresh Juices' },
  { id: '8', name: 'Protein Shake', price: 7.00, icon: '💪', category: 'Smoothies' },
]

type CartItem = Product & { quantity: number }

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState('All Items')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = ['All Items', 'Fresh Juices', 'Smoothies', 'Fruit Bowls', 'Add-ons']

  const filteredProducts = DUMMY_PRODUCTS.filter(p => 
    (activeCategory === 'All Items' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const clearCart = () => setCart([])

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Categories Menu */}
        <div className="border-b bg-card p-4 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              className="whitespace-nowrap rounded-full px-6"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:border-primary transition-all overflow-hidden group select-none"
                onClick={() => addToCart(product)}
              >
                <div className="h-32 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <div className="text-5xl transition-transform group-hover:scale-110">{product.icon}</div>
                </div>
                <CardContent className="p-3">
                  <div className="font-semibold text-sm line-clamp-1">{product.name}</div>
                  <div className="text-primary font-bold mt-1">${product.price.toFixed(2)}</div>
                </CardContent>
              </Card>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No products found matching your search.
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Cart Section (Right) */}
      <div className="w-full md:w-96 border-l bg-card flex flex-col h-[50vh] md:h-full shrink-0 shadow-xl z-10">
        <div className="h-16 border-b flex items-center px-4 shrink-0">
          <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
          <h2 className="font-semibold text-lg">Current Order</h2>
          <div className="ml-auto bg-primary/10 text-primary px-2 py-0.5 rounded text-sm font-medium">
            Order #1049
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 opacity-50">
              <ShoppingCart className="h-12 w-12" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="h-12 w-12 bg-secondary/10 rounded-md flex items-center justify-center text-xl shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{item.name}</div>
                  <div className="text-muted-foreground text-xs">${item.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateQuantity(item.id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateQuantity(item.id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="font-bold text-sm ml-2 w-12 text-right shrink-0">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary */}
        <div className="border-t p-4 bg-muted/20 shrink-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="text-destructive hover:bg-destructive hover:text-white border-destructive/30"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button 
              className="bg-primary text-white hover:bg-primary/90 h-12 text-lg font-bold shadow-lg shadow-primary/30"
              disabled={cart.length === 0}
              onClick={() => {
                alert(`Checkout completed! Total paid: $${total.toFixed(2)}`);
                clearCart();
              }}
            >
              Pay ${total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
