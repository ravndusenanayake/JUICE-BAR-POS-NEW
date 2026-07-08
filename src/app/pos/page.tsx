"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, ShoppingCart, ArrowLeft, Trash2, Plus, Minus, CreditCard, User } from "lucide-react"

// --- Mock Data ---
const CATEGORIES = ["All", "Fresh Juices", "Milkshakes", "Desserts", "Snacks"]

const MOCK_PRODUCTS = [
  { id: "P1", name: "Avocado Juice", price: 450, category: "Fresh Juices", color: "bg-green-100 text-green-700 border-green-200" },
  { id: "P2", name: "Mango Juice", price: 400, category: "Fresh Juices", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { id: "P3", name: "Chocolate Milkshake", price: 650, category: "Milkshakes", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "P4", name: "Strawberry Milkshake", price: 600, category: "Milkshakes", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { id: "P5", name: "Fruit Salad", price: 500, category: "Desserts", color: "bg-orange-100 text-orange-700 border-orange-200", hasVariants: true, variants: [{ name: "Medium", price: 500 }, { name: "Large", price: 750 }], addons: ["Ice Cream (Vanilla)", "Ice Cream (Chocolate)", "Honey"] },
  { id: "P6", name: "Club Sandwich", price: 800, category: "Snacks", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "P7", name: "Papaya Juice", price: 350, category: "Fresh Juices", color: "bg-orange-50 text-orange-600 border-orange-100" },
  { id: "P8", name: "Watalappam", price: 250, category: "Desserts", color: "bg-stone-100 text-stone-700 border-stone-200" },
]

const ADDON_PRICES: Record<string, number> = {
  "Ice Cream (Vanilla)": 150,
  "Ice Cream (Chocolate)": 180,
  "Honey": 100,
  "Extra Sugar": 0
}

interface CartItem {
  id: string; // Unique for cart (product ID + variant + addons)
  productId: string;
  name: string;
  basePrice: number;
  variant?: string;
  addons: string[];
  quantity: number;
  totalPrice: number;
}

export default function POSPage() {
  const { user } = useAuth()
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  
  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filtering
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => {
      const matchCategory = activeCategory === "All" || p.category === activeCategory
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [activeCategory, searchQuery])

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0)
  const tax = subtotal * 0.05 // 5% tax mock
  const grandTotal = subtotal + tax

  // --- Handlers ---
  const handleProductClick = (product: any) => {
    if (product.hasVariants || (product.addons && product.addons.length > 0)) {
      // Open Config Modal
      setSelectedProduct(product)
      setSelectedVariant(product.variants ? product.variants[0] : null)
      setSelectedAddons([])
      setIsModalOpen(true)
    } else {
      // Add directly to cart
      addToCart(product, null, [])
    }
  }

  const toggleAddon = (addon: string) => {
    setSelectedAddons(prev => 
      prev.includes(addon) ? prev.filter(a => a !== addon) : [...prev, addon]
    )
  }

  const handleConfirmConfig = () => {
    addToCart(selectedProduct, selectedVariant, selectedAddons)
    setIsModalOpen(false)
  }

  const addToCart = (product: any, variant: any, addons: string[]) => {
    let basePrice = variant ? variant.price : product.price
    let addonsTotal = addons.reduce((acc, a) => acc + (ADDON_PRICES[a] || 0), 0)
    let unitPrice = basePrice + addonsTotal

    // Generate a unique ID based on selections so same configs stack, different configs don't
    const cartItemId = `${product.id}-${variant?.name || 'default'}-${addons.sort().join('-')}`

    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId)
      if (existing) {
        return prev.map(item => item.id === cartItemId ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * unitPrice } : item)
      }
      return [...prev, {
        id: cartItemId,
        productId: product.id,
        name: product.name,
        basePrice: unitPrice,
        variant: variant?.name,
        addons,
        quantity: 1,
        totalPrice: unitPrice
      }]
    })
  }

  const updateQuantity = (cartItemId: string, change: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQ = item.quantity + change
        if (newQ <= 0) return item // handled by delete
        return { ...item, quantity: newQ, totalPrice: newQ * (item.basePrice) }
      }
      return item
    }))
  }

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId))
  }

  const processPayment = () => {
    if (cart.length === 0) return
    alert(`Payment of Rs. ${grandTotal.toFixed(2)} processed successfully!`)
    setCart([])
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans selection:bg-orange-200">
      
      {/* LEFT: Products Area */}
      <div className="flex-1 flex flex-col h-full bg-white shadow-xl z-10 relative">
        {/* POS Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b bg-white shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">POS Terminal</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                type="text" 
                placeholder="Search products..." 
                className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-orange-500 rounded-full h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full border border-orange-100">
              <User className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-800">{user?.name} ({user?.branch})</span>
            </div>
          </div>
        </header>

        {/* Categories */}
        <div className="px-6 py-4 border-b bg-gray-50/50 shrink-0 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-2">
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                activeCategory === cat 
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 transform scale-[1.02]' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <button 
                key={product.id}
                onClick={() => handleProductClick(product)}
                className={`flex flex-col text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group bg-white ${product.color.replace('bg-', 'border-').split(' ')[2] || 'border-gray-100'}`}
              >
                {/* Product Image Placeholder */}
                <div className={`h-32 w-full flex items-center justify-center ${product.color.split(' ')[0]} bg-opacity-30`}>
                  <span className={`text-4xl font-black opacity-20 ${product.color.split(' ')[1]}`}>
                    {product.name.substring(0,2).toUpperCase()}
                  </span>
                </div>
                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between w-full">
                  <h3 className="font-bold text-gray-800 leading-tight mb-2 group-hover:text-orange-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm font-black text-gray-900">Rs. {product.price.toFixed(2)}</span>
                    {(product.hasVariants || product.addons) && (
                      <span className="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Custom</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No products found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart Sidebar */}
      <div className="w-96 bg-white flex flex-col h-full shrink-0 relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
        {/* Cart Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b shrink-0 bg-gray-900 text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold">Current Order</h2>
          </div>
          <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs font-bold">{cart.reduce((a,b)=>a+b.quantity,0)} Items</span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <ShoppingCart className="w-16 h-16 opacity-20" />
              <p className="font-medium">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-xl border shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-800 leading-none">{item.name}</h4>
                    {(item.variant || item.addons.length > 0) && (
                      <div className="text-xs text-gray-500 mt-1.5 space-y-0.5 font-medium">
                        {item.variant && <div>Size: {item.variant}</div>}
                        {item.addons.map(a => <div key={a}>+ {a}</div>)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-black text-gray-900">Rs. {item.totalPrice.toFixed(2)}</div>
                    <div className="text-[10px] text-gray-400">Rs. {item.basePrice.toFixed(2)} /ea</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button onClick={() => updateQuantity(item.id, -1)} disabled={item.quantity <= 1} className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-orange-600 disabled:opacity-50 disabled:shadow-none">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-orange-600">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Pay */}
        <div className="p-6 border-t bg-white shrink-0">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm font-medium text-gray-500">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-500">
              <span>Tax (5%)</span>
              <span>Rs. {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end pt-3 border-t">
              <span className="text-base font-bold text-gray-800">Total</span>
              <span className="text-3xl font-black text-orange-600 tracking-tight">Rs. {grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <Button 
            className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl shadow-orange-500/30 bg-orange-500 hover:bg-orange-600 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
            disabled={cart.length === 0}
            onClick={processPayment}
          >
            <CreditCard className="w-6 h-6 mr-2" />
            Process Payment
          </Button>
        </div>
      </div>

      {/* MODAL: Variant & Add-On Selection */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-gray-50">
          {selectedProduct && (
            <>
              {/* Header */}
              <div className={`p-6 ${selectedProduct.color.split(' ')[0]} bg-opacity-20 border-b`}>
                <h2 className="text-2xl font-black text-gray-900">{selectedProduct.name}</h2>
                <p className="text-sm font-medium text-gray-600 mt-1">Configure your item before adding to cart</p>
              </div>

              <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto">
                {/* Variants */}
                {selectedProduct.hasVariants && selectedProduct.variants && (
                  <div className="space-y-3">
                    <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <span className="bg-orange-100 text-orange-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                      Select Size <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedProduct.variants.map((v: any) => (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selectedVariant?.name === v.name 
                              ? 'border-orange-500 bg-orange-50 shadow-md ring-1 ring-orange-500' 
                              : 'border-gray-200 bg-white hover:border-orange-200'
                          }`}
                        >
                          <div className="font-bold text-gray-900">{v.name}</div>
                          <div className="text-sm font-medium text-orange-600 mt-1">Rs. {v.price.toFixed(2)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add-ons */}
                {selectedProduct.addons && selectedProduct.addons.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <span className="bg-orange-100 text-orange-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">{selectedProduct.hasVariants ? '2' : '1'}</span>
                      Select Add-ons (Optional)
                    </Label>
                    <div className="space-y-2">
                      {selectedProduct.addons.map((addon: string) => {
                        const price = ADDON_PRICES[addon] || 0
                        const isSelected = selectedAddons.includes(addon)
                        return (
                          <button
                            key={addon}
                            type="button"
                            onClick={() => toggleAddon(addon)}
                            className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 bg-white hover:border-orange-200'
                            }`}
                          >
                            <span className={`font-semibold ${isSelected ? 'text-orange-900' : 'text-gray-700'}`}>{addon}</span>
                            <span className={`font-bold ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>
                              {price > 0 ? `+ Rs. ${price.toFixed(2)}` : 'Free'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-white border-t flex gap-3 rounded-b-2xl">
                <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-gray-300" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button className="flex-1 h-12 rounded-xl font-bold bg-gray-900 text-white hover:bg-black shadow-lg" onClick={handleConfirmConfig}>
                  Add to Cart
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
