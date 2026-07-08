"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, ShoppingCart, ArrowLeft, Trash2, Plus, Minus, CreditCard, User, CheckCircle2, PauseCircle, PlayCircle, Tag, Printer, Power, Wallet } from "lucide-react"

// --- Mock Data: Products ---
const CATEGORIES = ["All", "Fresh Juices", "Milkshakes", "Desserts", "Snacks", "Mojitos"]

const MOCK_PRODUCTS = [
  { id: "P1", name: "Avocado Juice", price: 450, category: "Fresh Juices", color: "bg-green-100 text-green-700 border-green-200", hasVariants: true, variants: [{ name: "Regular", price: 450 }, { name: "Large", price: 600 }] },
  { id: "P2", name: "Mango Juice", price: 400, category: "Fresh Juices", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { id: "P3", name: "Chocolate Milkshake", price: 650, category: "Milkshakes", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "P4", name: "Strawberry Milkshake", price: 600, category: "Milkshakes", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { id: "P5", name: "Fruit Salad", price: 500, category: "Desserts", color: "bg-orange-100 text-orange-700 border-orange-200", hasVariants: true, variants: [{ name: "Medium", price: 500 }, { name: "Large", price: 750 }] },
  { id: "P6", name: "Club Sandwich", price: 800, category: "Snacks", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "P7", name: "Papaya Juice", price: 350, category: "Fresh Juices", color: "bg-orange-50 text-orange-600 border-orange-100" },
  { id: "P8", name: "Watalappam", price: 250, category: "Desserts", color: "bg-stone-100 text-stone-700 border-stone-200" },
  { id: "P9", name: "Virgin Mojito", price: 500, category: "Mojitos", color: "bg-lime-100 text-lime-700 border-lime-200" },
  { id: "P10", name: "Watermelon Mojito", price: 550, category: "Mojitos", color: "bg-red-100 text-red-700 border-red-200" },
]

// --- Mock Data: Smart Add-ons mapped by Category ---
const CATEGORY_ADDONS: Record<string, {name: string, price: number}[]> = {
  "Fresh Juices": [
    { name: "Vanilla Ice Cream Scoop", price: 150 },
    { name: "Chocolate Ice Cream Scoop", price: 180 },
    { name: "Mint Leaves", price: 50 },
    { name: "Chia Seeds", price: 80 },
    { name: "Extra Sugar", price: 0 },
    { name: "No Sugar", price: 0 },
    { name: "Honey Instead of Sugar", price: 100 },
    { name: "Extra Ice", price: 0 },
    { name: "No Ice", price: 0 },
    { name: "Lemon Squeeze", price: 50 },
  ],
  "Milkshakes": [
    { name: "Whipped Cream", price: 120 },
    { name: "Chocolate Syrup", price: 80 },
    { name: "Caramel Drizzle", price: 80 },
    { name: "Extra Nuts (Cashews)", price: 200 },
    { name: "Oreo Crumbs", price: 150 },
    { name: "Extra Ice Cream Scoop", price: 150 },
    { name: "Strawberry Syrup", price: 80 },
    { name: "Protein Powder (1 Scoop)", price: 300 },
  ],
  "Desserts": [
    { name: "Extra Ice Cream (Vanilla)", price: 150 },
    { name: "Extra Ice Cream (Chocolate)", price: 180 },
    { name: "Extra Nuts", price: 200 },
    { name: "Honey", price: 100 },
    { name: "Condensed Milk", price: 100 },
    { name: "Jelly Pieces", price: 80 },
  ],
  "Mojitos": [
    { name: "Extra Mint", price: 50 },
    { name: "Extra Lime", price: 50 },
    { name: "Sprite Top-up", price: 100 },
    { name: "Salt Rim", price: 0 },
    { name: "Sugar Rim", price: 0 },
    { name: "Passion Fruit Burst", price: 150 },
  ],
  "Snacks": [
    { name: "Extra Cheese", price: 150 },
    { name: "Extra Chicken", price: 250 },
    { name: "French Fries (Side)", price: 350 },
    { name: "Tomato Ketchup", price: 0 },
    { name: "Chili Paste", price: 50 },
  ]
}

interface CartItem {
  id: string
  productId: string
  name: string
  basePrice: number
  variant?: string
  addons: {name: string, price: number}[]
  quantity: number
  totalPrice: number
}

interface HeldBill {
  id: string
  time: string
  customerName: string
  cart: CartItem[]
}

export default function POSPage() {
  const { user } = useAuth()
  
  // -- UI States --
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  
  // -- Cart State --
  const [cart, setCart] = useState<CartItem[]>([])
  
  // -- Customer Selection State --
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")

  // -- Product Config Modal --
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [selectedAddons, setSelectedAddons] = useState<{name: string, price: number}[]>([])
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  
  // -- Discount State --
  const [discountType, setDiscountType] = useState<"NONE" | "PERCENT" | "FIXED">("NONE")
  const [discountValue, setDiscountValue] = useState(0)
  const [isDiscountOpen, setIsDiscountOpen] = useState(false)
  
  // -- Hold Bill State --
  const [heldBills, setHeldBills] = useState<HeldBill[]>([])
  const [isHoldOpen, setIsHoldOpen] = useState(false)
  const [holdCustomerName, setHoldCustomerName] = useState("")
  const [isRecallOpen, setIsRecallOpen] = useState(false)
  
  // -- Shift Management State --
  const [shiftActive, setShiftActive] = useState(false)
  const [isShiftOpen, setIsShiftOpen] = useState(false)
  const [openingBalance, setOpeningBalance] = useState("")
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false)
  
  // -- Payment & KOT --
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [deductedMaterials, setDeductedMaterials] = useState<any[]>([])
  const [lastOrderRef, setLastOrderRef] = useState("")

  // --- Initial Setup (Recipes & Shift) ---
  useEffect(() => {
    // 1. Check Shift
    const shift = localStorage.getItem("pos_shift")
    if (shift) setShiftActive(true)
    else setIsShiftOpen(true) // Force open shift modal if no shift

    // 1.5 Load Customers
    const storedCustomers = localStorage.getItem("mock_customers")
    if (storedCustomers) {
      const parsed = JSON.parse(storedCustomers)
      setCustomers(parsed)
      // Default to Walk-In Customer
      const walkIn = parsed.find((c: any) => c.name === "Walk-In Customer")
      if (walkIn) setSelectedCustomer(walkIn)
    } else {
      // Fallback if they haven't visited the customers page yet
      const fallback = [{ id: "CUST-001", name: "Walk-In Customer", mobile: "N/A" }]
      setCustomers(fallback)
      setSelectedCustomer(fallback[0])
      localStorage.setItem("mock_customers", JSON.stringify(fallback))
    }

    // 2. Seed Mock Recipes for Auto-Deduction testing
    const existingRecipes = localStorage.getItem("mock_recipes")
    if (!existingRecipes) {
      const demoRecipes = [
        {
          id: "REC-1", productId: "P2", variant: "Standard", name: "Mango Juice", category: "Fresh Juices", costPerServing: 120, retailPrice: 400,
          ingredients: [
            { rawMaterialId: "RM001", name: "Fresh Mango", quantity: 200, unit: "g", cost: 80 },
            { rawMaterialId: "RM002", name: "Sugar", quantity: 30, unit: "g", cost: 10 },
            { rawMaterialId: "RM003", name: "Purified Water", quantity: 150, unit: "ml", cost: 5 },
          ]
        },
        {
          id: "REC-2", productId: "P1", variant: "Regular", name: "Avocado Juice", category: "Fresh Juices", costPerServing: 150, retailPrice: 450,
          ingredients: [
            { rawMaterialId: "RM004", name: "Avocado", quantity: 150, unit: "g", cost: 100 },
            { rawMaterialId: "RM005", name: "Fresh Milk", quantity: 100, unit: "ml", cost: 30 },
            { rawMaterialId: "RM002", name: "Sugar", quantity: 20, unit: "g", cost: 8 },
          ]
        }
      ]
      localStorage.setItem("mock_recipes", JSON.stringify(demoRecipes))
    }
  }, [])

  // --- Filtering ---
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => {
      const matchCategory = activeCategory === "All" || p.category === activeCategory
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [activeCategory, searchQuery])

  // --- Calculations ---
  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0)
  
  let discountAmount = 0
  if (discountType === "PERCENT") discountAmount = subtotal * (discountValue / 100)
  if (discountType === "FIXED") discountAmount = discountValue
  
  const afterDiscount = Math.max(0, subtotal - discountAmount)
  const tax = afterDiscount * 0.05 // 5% tax mock
  const grandTotal = afterDiscount + tax

  // --- Cart Handlers ---
  const handleProductClick = (product: any) => {
    const addons = CATEGORY_ADDONS[product.category] || []
    if (product.hasVariants || addons.length > 0) {
      setSelectedProduct(product)
      setSelectedVariant(product.variants ? product.variants[0] : null)
      setSelectedAddons([])
      setIsConfigOpen(true)
    } else {
      addToCart(product, null, [])
    }
  }

  const toggleAddon = (addonObj: {name: string, price: number}) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.name === addonObj.name)
      if (exists) return prev.filter(a => a.name !== addonObj.name)
      return [...prev, addonObj]
    })
  }

  const handleConfirmConfig = () => {
    addToCart(selectedProduct, selectedVariant, selectedAddons)
    setIsConfigOpen(false)
  }

  const addToCart = (product: any, variant: any, addons: {name: string, price: number}[]) => {
    let basePrice = variant ? variant.price : product.price
    let addonsTotal = addons.reduce((acc, a) => acc + a.price, 0)
    let unitPrice = basePrice + addonsTotal
    const cartItemId = `${product.id}-${variant?.name || 'default'}-${addons.map(a=>a.name).sort().join('-')}`

    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId)
      if (existing) {
        return prev.map(item => item.id === cartItemId ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * unitPrice } : item)
      }
      return [...prev, {
        id: cartItemId, productId: product.id, name: product.name,
        basePrice: unitPrice, variant: variant?.name, addons,
        quantity: 1, totalPrice: unitPrice
      }]
    })
  }

  const updateQuantity = (cartItemId: string, change: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQ = item.quantity + change
        if (newQ <= 0) return item
        return { ...item, quantity: newQ, totalPrice: newQ * (item.basePrice) }
      }
      return item
    }))
  }

  const removeFromCart = (cartItemId: string) => setCart(prev => prev.filter(item => item.id !== cartItemId))

  // --- Hold & Recall Bill ---
  const handleHoldBill = () => {
    if (cart.length === 0 || !holdCustomerName) return
    const newHold: HeldBill = {
      id: `HLD-${Date.now().toString().slice(-4)}`,
      time: new Date().toLocaleTimeString(),
      customerName: holdCustomerName,
      cart: [...cart]
    }
    setHeldBills(prev => [...prev, newHold])
    setCart([])
    setHoldCustomerName("")
    setDiscountType("NONE")
    setDiscountValue(0)
    setIsHoldOpen(false)
  }

  const handleRecallBill = (billId: string) => {
    const bill = heldBills.find(b => b.id === billId)
    if (bill) {
      setCart(bill.cart)
      setHeldBills(prev => prev.filter(b => b.id !== billId))
      setIsRecallOpen(false)
    }
  }

  // --- Payment & KOT ---
  const processPayment = () => {
    if (cart.length === 0) return

    const orderRef = `POS-${Date.now().toString().slice(-6)}`
    setLastOrderRef(orderRef)

    try {
      const allRecipes = JSON.parse(localStorage.getItem("mock_recipes") || "[]")
      const deductions: Record<string, {name: string, quantity: number, unit: string}> = {}

      cart.forEach(cartItem => {
        const recipe = allRecipes.find((r: any) => 
          r.productId === cartItem.productId && r.variant === (cartItem.variant || "Standard")
        )

        if (recipe) {
          recipe.ingredients.forEach((ing: any) => {
            const totalQty = ing.quantity * cartItem.quantity
            if (deductions[ing.rawMaterialId]) deductions[ing.rawMaterialId].quantity += totalQty
            else deductions[ing.rawMaterialId] = { name: ing.name, quantity: totalQty, unit: ing.unit }
          })
        }
      })

      const deductedArray = Object.values(deductions)
      setDeductedMaterials(deductedArray)
      
      const ledger = JSON.parse(localStorage.getItem("mock_stock_ledger") || "[]")
      const now = new Date().toISOString()
      
      const newEntries = deductedArray.map((mat: any, idx) => ({
        id: `LDG-${Date.now()}-${idx}`, timestamp: now, branch: user?.branch || "Unknown Branch",
        rawMaterialName: mat.name, type: "OUT", reason: "SALE",
        quantityChange: mat.quantity, baseUnit: mat.unit, reference: orderRef
      }))
      
      localStorage.setItem("mock_stock_ledger", JSON.stringify([...ledger, ...newEntries]))
      
      // Save Sale to Cash Drawer (for shift closing)
      const shiftSales = JSON.parse(localStorage.getItem("shift_sales") || "[]")
      shiftSales.push(grandTotal)
      localStorage.setItem("shift_sales", JSON.stringify(shiftSales))

      setPaymentSuccess(true)
    } catch (e) {
      console.error(e)
    }
  }

  const handlePrintKOT = () => {
    // In a real system, this would trigger a print job to the kitchen printer via a local network service or Electron.
    alert(`[MOCK PRINTER] Kitchen Order Ticket (KOT) sent for ${lastOrderRef}!\n\nItems to prepare:\n${cart.map(c => `- ${c.quantity}x ${c.name} ${c.variant ? `(${c.variant})` : ''} ${c.addons.length > 0 ? `\n   Add-ons: ${c.addons.map(a=>a.name).join(', ')}` : ''}`).join('\n')}`)
  }

  // --- Shift Management ---
  const handleOpenShift = () => {
    if (!openingBalance) return
    localStorage.setItem("pos_shift", JSON.stringify({
      openedAt: new Date().toISOString(),
      openingBalance: parseFloat(openingBalance)
    }))
    localStorage.setItem("shift_sales", JSON.stringify([]))
    setShiftActive(true)
    setIsShiftOpen(false)
  }

  const handleCloseShift = () => {
    const shift = JSON.parse(localStorage.getItem("pos_shift") || "{}")
    const sales = JSON.parse(localStorage.getItem("shift_sales") || "[]")
    const totalSales = sales.reduce((a:number,b:number)=>a+b, 0)
    const expectedCash = (shift.openingBalance || 0) + totalSales
    
    alert(`--- Z-REPORT (SHIFT CLOSED) ---\nOpening Balance: Rs. ${shift.openingBalance?.toFixed(2)}\nTotal Sales: Rs. ${totalSales.toFixed(2)}\nExpected Cash in Drawer: Rs. ${expectedCash.toFixed(2)}`)
    
    localStorage.removeItem("pos_shift")
    localStorage.removeItem("shift_sales")
    setShiftActive(false)
    setIsCloseShiftOpen(false)
    setIsShiftOpen(true) // Force them to open a new one
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans selection:bg-orange-200">
      
      {/* LEFT: Products Area */}
      <div className="flex-1 flex flex-col h-full bg-white shadow-xl z-10 relative">
        <header className="h-16 flex items-center justify-between px-6 border-b bg-white shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">POS Terminal</h1>
          </div>
          
          <div className="flex flex-1 max-w-md mx-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              type="text" placeholder="Search products..." 
              className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-orange-500 rounded-full h-10 w-full"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
             <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setIsCloseShiftOpen(true)}>
              <Power className="w-4 h-4 mr-2" /> Close Shift
            </Button>
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
              key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                activeCategory === cat ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 transform scale-[1.02]' : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => {
              const addons = CATEGORY_ADDONS[product.category] || []
              return (
                <button 
                  key={product.id} onClick={() => handleProductClick(product)}
                  className={`flex flex-col text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group bg-white ${product.color.replace('bg-', 'border-').split(' ')[2] || 'border-gray-100'}`}
                >
                  <div className={`h-32 w-full flex items-center justify-center ${product.color.split(' ')[0]} bg-opacity-30`}>
                    <span className={`text-4xl font-black opacity-20 ${product.color.split(' ')[1]}`}>
                      {product.name.substring(0,2).toUpperCase()}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between w-full">
                    <h3 className="font-bold text-gray-800 leading-tight mb-2 group-hover:text-orange-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-sm font-black text-gray-900">Rs. {product.price.toFixed(2)}</span>
                      {(product.hasVariants || addons.length > 0) && (
                        <span className="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Custom</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart Sidebar */}
      <div className="w-[400px] bg-white flex flex-col h-full shrink-0 relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
        {/* Cart Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b shrink-0 bg-gray-900 text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold">Current Order</h2>
          </div>
          <div className="flex gap-2">
            {heldBills.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setIsRecallOpen(true)} className="h-7 text-xs bg-orange-500 text-white hover:bg-orange-600 border-0">
                Recall ({heldBills.length})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsHoldOpen(true)} disabled={cart.length === 0} className="h-7 text-xs bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
              <PauseCircle className="w-3 h-3 mr-1" /> Hold
            </Button>
          </div>
        </div>

        {/* Customer Selector */}
        <div className="px-4 py-3 bg-white border-b flex justify-between items-center shadow-sm z-10 cursor-pointer hover:bg-orange-50 transition-colors" onClick={() => setIsCustomerSelectOpen(true)}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</span>
              <span className="text-sm font-black text-gray-900 leading-tight">
                {selectedCustomer?.name || "Select Customer"}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Change</span>
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
                        {item.addons.map(a => <div key={a.name}>+ {a.name}</div>)}
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
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-orange-600">
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
        <div className="p-5 border-t bg-white shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm font-medium text-gray-500">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm font-medium">
              <Button variant="ghost" size="sm" onClick={() => setIsDiscountOpen(true)} className="h-6 px-2 text-blue-600 hover:bg-blue-50 -ml-2">
                <Tag className="w-3 h-3 mr-1" /> {discountType === "NONE" ? "Add Discount" : `${discountType === "PERCENT" ? `${discountValue}%` : `Rs. ${discountValue}`} Discount`}
              </Button>
              {discountAmount > 0 && <span className="text-red-500">- Rs. {discountAmount.toFixed(2)}</span>}
            </div>

            <div className="flex justify-between text-sm font-medium text-gray-500 border-b pb-2">
              <span>Tax (5%)</span>
              <span>Rs. {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end pt-1">
              <span className="text-base font-bold text-gray-800">Total</span>
              <span className="text-3xl font-black text-orange-600 tracking-tight">Rs. {grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <Button 
            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-orange-500/20 bg-orange-500 hover:bg-orange-600 transition-transform active:scale-[0.98] disabled:opacity-50"
            disabled={cart.length === 0} onClick={processPayment}
          >
            <CreditCard className="w-6 h-6 mr-2" /> Pay Rs. {grandTotal.toFixed(2)}
          </Button>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Config Modal (Variants & Smart Add-ons) */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-gray-50">
          {selectedProduct && (
            <>
              <div className={`p-6 ${selectedProduct.color.split(' ')[0]} bg-opacity-20 border-b`}>
                <h2 className="text-2xl font-black text-gray-900">{selectedProduct.name}</h2>
                <p className="text-sm font-medium text-gray-600 mt-1">Configure your item before adding to cart</p>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {selectedProduct.hasVariants && selectedProduct.variants && (
                  <div className="space-y-3">
                    <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <span className="bg-orange-100 text-orange-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                      Select Size <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedProduct.variants.map((v: any) => (
                        <button key={v.name} type="button" onClick={() => setSelectedVariant(v)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${selectedVariant?.name === v.name ? 'border-orange-500 bg-orange-50 shadow-md ring-1 ring-orange-500' : 'border-gray-200 bg-white hover:border-orange-200'}`}
                        >
                          <div className="font-bold text-gray-900">{v.name}</div>
                          <div className="text-sm font-medium text-orange-600 mt-1">Rs. {v.price.toFixed(2)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Smart Add-ons specific to category */}
                {CATEGORY_ADDONS[selectedProduct.category] && CATEGORY_ADDONS[selectedProduct.category].length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <span className="bg-orange-100 text-orange-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">{selectedProduct.hasVariants ? '2' : '1'}</span>
                      Add-ons for {selectedProduct.category} (Optional)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORY_ADDONS[selectedProduct.category].map((addon) => {
                        const isSelected = selectedAddons.some(a => a.name === addon.name)
                        return (
                          <button key={addon.name} type="button" onClick={() => toggleAddon(addon)}
                            className={`p-3 rounded-xl border-2 flex flex-col text-left transition-all ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-orange-200'}`}
                          >
                            <span className={`text-sm font-semibold leading-tight ${isSelected ? 'text-orange-900' : 'text-gray-700'}`}>{addon.name}</span>
                            <span className={`text-xs font-bold mt-1 ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>{addon.price > 0 ? `+ Rs. ${addon.price.toFixed(2)}` : 'Free'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 bg-white border-t flex gap-3 rounded-b-2xl">
                <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-gray-300" onClick={() => setIsConfigOpen(false)}>Cancel</Button>
                <Button className="flex-1 h-12 rounded-xl font-bold bg-gray-900 text-white hover:bg-black shadow-lg" onClick={handleConfirmConfig}>Add to Cart</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. Hold Bill Modal */}
      <Dialog open={isHoldOpen} onOpenChange={setIsHoldOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hold Current Bill</DialogTitle>
            <DialogDescription>Enter a reference name to park this sale.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Customer Name / Table / Reference</Label>
              <Input placeholder="e.g. Table 4 or John" value={holdCustomerName} onChange={e => setHoldCustomerName(e.target.value)} autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHoldOpen(false)}>Cancel</Button>
            <Button onClick={handleHoldBill} className="bg-orange-500 hover:bg-orange-600 text-white">Hold Bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Recall Bill Modal */}
      <Dialog open={isRecallOpen} onOpenChange={setIsRecallOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recall Held Bills</DialogTitle>
            <DialogDescription>Select a parked sale to resume.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
            {heldBills.map(bill => (
              <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <div className="font-bold text-gray-900">{bill.customerName}</div>
                  <div className="text-xs text-gray-500">{bill.cart.length} items • Parked at {bill.time}</div>
                </div>
                <Button onClick={() => handleRecallBill(bill.id)} className="bg-gray-900 text-white hover:bg-black">
                  <PlayCircle className="w-4 h-4 mr-2" /> Resume
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. Discount Modal */}
      <Dialog open={isDiscountOpen} onOpenChange={setIsDiscountOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button variant={discountType === "PERCENT" ? "default" : "outline"} className={discountType === "PERCENT" ? "bg-orange-500" : ""} onClick={() => {setDiscountType("PERCENT"); setDiscountValue(0)}}>Percentage (%)</Button>
              <Button variant={discountType === "FIXED" ? "default" : "outline"} className={discountType === "FIXED" ? "bg-orange-500" : ""} onClick={() => {setDiscountType("FIXED"); setDiscountValue(0)}}>Fixed Amount (Rs)</Button>
            </div>
            {discountType !== "NONE" && (
              <div className="space-y-2">
                <Label>Discount Value {discountType === "PERCENT" ? "(%)" : "(Rs)"}</Label>
                <Input type="number" value={discountValue || ""} onChange={e => setDiscountValue(Number(e.target.value))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {setDiscountType("NONE"); setDiscountValue(0); setIsDiscountOpen(false)}}>Remove Discount</Button>
            <Button onClick={() => setIsDiscountOpen(false)} className="bg-gray-900 text-white hover:bg-black">Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Shift Open Modal (Blocking) */}
      <Dialog open={isShiftOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wallet className="text-orange-500" /> Open Register</DialogTitle>
            <DialogDescription>Enter the opening cash balance in the drawer to start your shift.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Opening Balance (Rs.)</Label>
              <Input type="number" placeholder="5000" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleOpenShift} disabled={!openingBalance} className="w-full bg-orange-500 hover:bg-orange-600 text-white">Start Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Customer Select Modal */}
      <Dialog open={isCustomerSelectOpen} onOpenChange={setIsCustomerSelectOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-gray-50">
          <div className="p-4 bg-white border-b">
            <DialogTitle className="text-lg font-black text-gray-900 flex items-center gap-2">
              <User className="text-orange-500" /> Select Customer
            </DialogTitle>
          </div>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                autoFocus
                placeholder="Search by name or mobile..." 
                className="pl-9 h-11 border-gray-300 bg-white"
                value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {customers
                .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.mobile && c.mobile.includes(customerSearch)))
                .map(c => (
                <button 
                  key={c.id} 
                  onClick={() => { setSelectedCustomer(c); setIsCustomerSelectOpen(false) }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedCustomer?.id === c.id ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-200 bg-white hover:border-orange-300'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">{c.name}</span>
                    {c.status === "VIP" && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">VIP</span>}
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-1">{c.mobile}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white border-t">
            <Link href="/dashboard/customers" target="_blank" className="w-full">
              <Button variant="outline" className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 font-bold">
                <Plus className="w-4 h-4 mr-2" /> Add New Customer in Dashboard
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. Payment Success & KOT Modal */}
      <Dialog open={paymentSuccess} onOpenChange={() => { setPaymentSuccess(false); setCart([]); setDiscountType("NONE"); setDiscountValue(0) }}>
        <DialogContent className="sm:max-w-md p-6 overflow-hidden rounded-2xl border-0 shadow-2xl bg-white text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-500 mb-6 font-mono text-sm">Ref: {lastOrderRef} • Rs. {grandTotal.toFixed(2)} Collected</p>
          <p className="text-xs font-bold text-orange-600 mb-4 uppercase tracking-wider">Customer: {selectedCustomer?.name}</p>
          
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left mb-6 max-h-40 overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-2 text-sm border-b pb-2">Inventory Auto-Deductions:</h3>
            {deductedMaterials.length > 0 ? (
              <ul className="space-y-1">
                {deductedMaterials.map((mat, i) => (
                  <li key={i} className="flex justify-between text-xs">
                    <span className="font-medium text-gray-600">{mat.name}</span>
                    <span className="font-bold text-red-500">-{mat.quantity} {mat.unit}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 italic">No recipes configured for these items. Stock unaffected.</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button className="flex-1 h-12 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg" onClick={handlePrintKOT}>
              <Printer className="w-4 h-4 mr-2" /> Print KOT
            </Button>
            <Button className="flex-1 h-12 rounded-xl font-bold bg-gray-900 text-white hover:bg-black shadow-lg" onClick={() => { setPaymentSuccess(false); setCart([]); setDiscountType("NONE"); setDiscountValue(0) }}>
              New Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
