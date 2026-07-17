"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, ShoppingCart, ArrowLeft, Trash2, Plus, Minus, CreditCard, User, CheckCircle2, PauseCircle, PlayCircle, Tag, Printer, Power, Wallet } from "lucide-react"
import { logAudit } from "@/lib/auditLogger"

// --- Helpers ---
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    "Fresh Juices": "bg-green-100 text-green-700 border-green-200",
    "Milkshakes": "bg-amber-100 text-amber-800 border-amber-200",
    "Desserts": "bg-orange-100 text-orange-700 border-orange-200",
    "Snacks": "bg-blue-100 text-blue-700 border-blue-200",
    "Mojitos": "bg-red-100 text-red-700 border-red-200",
    "General": "bg-gray-100 text-gray-700 border-gray-200"
  };
  return colors[category] || colors["General"];
};
const CATEGORY_ADDONS: Record<string, {name: string, price: number}[]> = {
  "Fresh Juices": [
    { name: "Extra Sugar", price: 0 },
    { name: "No Sugar", price: 0 },
    { name: "Less Sugar", price: 0 },
    { name: "Sugar Syrup", price: 0 },
    { name: "Extra Ice", price: 0 },
    { name: "Less Ice", price: 0 },
    { name: "No Ice", price: 0 },
    { name: "Mint Leaves", price: 50 },
    { name: "Chia Seeds", price: 100 },
    { name: "Basil Seeds", price: 100 },
    { name: "Ginger Kick", price: 50 },
    { name: "Lemon Squeeze", price: 50 },
    { name: "Extra Orange Pulp", price: 150 },
    { name: "Aloe Vera Chunks", price: 120 }
  ],
  "Milkshakes": [
    { name: "Extra Ice Cream Scoop", price: 150 },
    { name: "Whipped Cream", price: 100 },
    { name: "Chocolate Chips", price: 100 },
    { name: "Chocolate Syrup", price: 50 },
    { name: "Caramel Syrup", price: 50 },
    { name: "Strawberry Syrup", price: 50 },
    { name: "Oreo Crumbs", price: 120 },
    { name: "Nutella Blend", price: 200 },
    { name: "Peanut Butter", price: 150 },
    { name: "Sprinkles", price: 50 },
    { name: "Cashew Nuts", price: 150 },
    { name: "Almond Flakes", price: 150 },
    { name: "No Sugar", price: 0 },
    { name: "Less Sugar", price: 0 }
  ],
  "Mojitos": [
    { name: "Extra Mint", price: 50 },
    { name: "Extra Lime", price: 50 },
    { name: "Less Ice", price: 0 },
    { name: "No Ice", price: 0 },
    { name: "Extra Soda", price: 50 },
    { name: "Blue Curacao Extra", price: 100 },
    { name: "Passion Fruit Syrup", price: 100 },
    { name: "Strawberry Popping Boba", price: 150 },
    { name: "Green Apple Syrup", price: 100 },
    { name: "Slice of Lemon", price: 0 }
  ],
  "Desserts": [
    { name: "Extra Chocolate Sauce", price: 100 },
    { name: "Extra Caramel Sauce", price: 100 },
    { name: "Vanilla Ice Cream Scoop", price: 150 },
    { name: "Chocolate Ice Cream Scoop", price: 150 },
    { name: "Strawberry Ice Cream Scoop", price: 150 },
    { name: "Cherry on Top", price: 50 },
    { name: "Crushed Nuts", price: 100 },
    { name: "Whipped Cream", price: 100 }
  ],
  "Snacks": [
    { name: "Extra Tomato Sauce", price: 0 },
    { name: "Extra Chili Sauce", price: 0 },
    { name: "Mayonnaise", price: 50 },
    { name: "Cheese Slice", price: 100 },
    { name: "Extra Chicken", price: 150 },
    { name: "Toasted", price: 0 },
    { name: "Warm up", price: 0 }
  ],
  "General": [
    { name: "Takeaway Box", price: 50 },
    { name: "Extra Paper Bag", price: 20 }
  ]
};


interface CartItem {
  id: string
  productId: string
  sku?: string
  name: string
  basePrice: number
  variant?: string
  addons: {name: string, price: number}[]
  quantity: number
  totalPrice: number
  note?: string
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
  const [noteModalItem, setNoteModalItem] = useState<CartItem | null>(null)
  const [itemNote, setItemNote] = useState("")
  
  // -- Customer Selection State --
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: "", mobile: "", email: "" })
  const [recipes, setRecipes] = useState<any[]>([])

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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "Bank Transfer" | "Split">("Cash")
  const [splitCash, setSplitCash] = useState("")
  const [splitCard, setSplitCard] = useState("")

  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [deductedMaterials, setDeductedMaterials] = useState<any[]>([])
  const [lastOrderRef, setLastOrderRef] = useState("")
  const [saleDetails, setSaleDetails] = useState<any>(null)
  
  // -- Data State --
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [currentShiftId, setCurrentShiftId] = useState<string | null>(null)

  // -- Branch Selection State --
  const [posBranch, setPosBranch] = useState<string | null>(null)
  const [availableBranches, setAvailableBranches] = useState<any[]>([])
  const [isBranchSelectOpen, setIsBranchSelectOpen] = useState(false)

  // --- Initial Branch Setup ---
  useEffect(() => {
    if (!user) return;
    
    if (user.branch === "All Branches") {
      setIsBranchSelectOpen(true);
      fetch('/api/branches')
        .then(res => res.json())
        .then(data => setAvailableBranches(data.filter((b: any) => b.status === "Active")))
        .catch(console.error);
    } else {
      setPosBranch(user.branch);
    }
  }, [user]);

  // --- Initial Setup (Products, Recipes, Customers & Shift) ---
  useEffect(() => {
    if (!user || !posBranch) return;

    const fetchData = async () => {
      try {
        // 1. Check Shift from DB
        const shiftRes = await fetch(`/api/shifts?cashierName=${encodeURIComponent(user.name)}&status=Open&branch=${encodeURIComponent(posBranch)}`);
        if (shiftRes.ok) {
          const shifts = await shiftRes.json();
          if (shifts.length > 0) {
            setShiftActive(true);
            setCurrentShiftId(shifts[0]._id);
          } else {
            setIsShiftOpen(true);
          }
        }

        // 2. Load Products, Variants, Customers, Recipes & Branch Inventory
        const [prodRes, varRes, custRes, recRes, invRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/product-variants'),
          fetch('/api/customers'),
          fetch('/api/recipes'),
          fetch(`/api/branch-inventory?branch=${encodeURIComponent(posBranch)}`)
        ]);

        if (prodRes.ok) {
          const data = await prodRes.json();
          let variantsData: any[] = [];
          if (varRes.ok) {
             variantsData = await varRes.json();
          }
          
          let recipesData: any[] = [];
          if (recRes.ok) {
             recipesData = await recRes.json();
             setRecipes(recipesData);
          }
          
          let invMapById = new Map<string, number>();
          let invMapBySku = new Map<string, number>();
          if (invRes.ok) {
             const invData = await invRes.json();
             invData.forEach((inv: any) => {
                if (inv.itemId) invMapById.set(inv.itemId.toString(), inv.quantity || 0);
                if (inv.sku) invMapBySku.set(inv.sku, inv.quantity || 0);
             });
          }

          const activeProducts = data.filter((p: any) => p.status === 'Active').map((p: any) => {
            let isOutOfStock = false;
            
            const productVariants = variantsData
              .filter((v: any) => {
                const variantProdId = typeof v.productId === 'object' && v.productId !== null ? v.productId._id : v.productId;
                return variantProdId === p._id && v.status === 'Active';
              })
              .map((v: any) => {
                let vOutOfStock = false;
                if (p.type !== 'Finished Good') {
                   const vRecipe = recipesData.find((r: any) => r.productId === p._id && r.variant === v.name);
                   if (vRecipe && vRecipe.ingredients && vRecipe.ingredients.length > 0) {
                     for (const ing of vRecipe.ingredients) {
                        const availableQty = invMapBySku.get(ing.rawMaterialId) || 0;
                        if (availableQty < ing.quantity) {
                           vOutOfStock = true;
                           break;
                        }
                     }
                   }
                }
                return { name: v.name, price: v.sellingPrice, isOutOfStock: vOutOfStock };
              });
              
            if (p.type === 'Finished Good') {
              const qty = invMapBySku.get(p.sku) || 0;
              if (qty <= 0) isOutOfStock = true;
            } else {
              if (productVariants.length > 0) {
                 isOutOfStock = productVariants.every((v: any) => v.isOutOfStock);
              } else {
                 const productRecipes = recipesData.filter((r: any) => r.productId === p._id);
                 if (productRecipes.length > 0) {
                    let canMakeAtLeastOne = false;
                    for (const recipe of productRecipes) {
                       let canMakeThis = true;
                       if (recipe.ingredients && recipe.ingredients.length > 0) {
                          for (const ing of recipe.ingredients) {
                             const qty = invMapBySku.get(ing.rawMaterialId) || 0;
                             if (qty < ing.quantity) {
                                canMakeThis = false;
                                break;
                             }
                          }
                       } else {
                          canMakeThis = false;
                       }
                       if (canMakeThis) {
                          canMakeAtLeastOne = true;
                          break;
                       }
                    }
                    if (!canMakeAtLeastOne) isOutOfStock = true;
                 }
              }
            }

            const rawAddons = [...(p.addons || []), ...(CATEGORY_ADDONS[p.category || 'General'] || [])];
            const uniqueAddons = Array.from(new Map(rawAddons.map(a => [a.name, a])).values());

            return {
              id: p.sku,
              productId: p._id,
              name: p.name,
              price: p.outletPrice || 0,
              category: p.category || 'General',
              color: getCategoryColor(p.category),
              addons: uniqueAddons,
              hasVariants: productVariants.length > 0,
              variants: productVariants.length > 0 ? productVariants : null,
              isOutOfStock
            };
          });
          setProducts(activeProducts);
          const cats = ["All", ...Array.from(new Set(activeProducts.map((p: any) => p.category)))];
          setCategories(cats as string[]);
        }

        if (custRes.ok) {
          const data = await custRes.json();
          setCustomers(data);
          const walkIn = data.find((c: any) => c.name === "Walk-In Customer");
          if (walkIn) setSelectedCustomer(walkIn);
          else if (data.length > 0) setSelectedCustomer(data[0]);
        }
      } catch (err) {
        console.error("Failed to load POS data", err);
      }
    };
    fetchData();
  }, [user, posBranch])

  // --- Customer Management ---
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.mobile) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCustomer, loyaltyPoints: 0, status: "Active" })
      });
      if (res.ok) {
        const cust = await res.json();
        setCustomers([cust, ...customers]);
        setSelectedCustomer(cust);
        setIsAddCustomerOpen(false);
        setNewCustomer({ name: "", mobile: "", email: "" });
      } else {
        alert("Failed to add customer");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Filtering ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = activeCategory === "All" || p.category === activeCategory
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [products, activeCategory, searchQuery])

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
    const addons = product.addons || []
    if (product.hasVariants || addons.length > 0) {
      setSelectedProduct(product)
      setSelectedVariant(null) // Force user to select variant
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
        id: cartItemId, productId: product.productId, sku: product.id, name: product.name,
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

  const removeFromCart = (cartItemId: string) => {
    const item = cart.find(i => i.id === cartItemId)
    setCart(prev => prev.filter(i => i.id !== cartItemId))
    if (item) logAudit(user?.name || "System", posBranch || "Unknown", `Removed item from cart: ${item.name}`, "Sales")
  }

  const updateItemNote = (cartItemId: string, note: string) => {
    setCart(prev => prev.map(item => item.id === cartItemId ? { ...item, note } : item))
  }

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
  const initiatePayment = () => {
    if (cart.length === 0) return
    setIsPaymentModalOpen(true)
    setPaymentMethod("Cash")
    setSplitCash("")
    setSplitCard("")
  }

  const processPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (cart.length === 0) return

    if (paymentMethod === "Split") {
      const cashAmt = parseFloat(splitCash) || 0
      const cardAmt = parseFloat(splitCard) || 0
      if (cashAmt + cardAmt < grandTotal) {
        alert(`Split amounts (Rs.${cashAmt + cardAmt}) do not cover the Grand Total (Rs.${grandTotal.toFixed(2)})!`)
        return
      }
    }

    const orderRef = `POS-${Date.now().toString().slice(-6)}`
    setLastOrderRef(orderRef)

    try {
      // Determine final payment info
      const paymentInfo = paymentMethod === "Split" 
        ? `Split (Cash: ${splitCash || 0}, Card: ${splitCard || 0})`
        : paymentMethod

      // Save Sale to API
      const salePayload = {
        receiptNumber: orderRef,
        branch: posBranch || "Colombo 07",
        cashier: user?.name || "System",
        customer: selectedCustomer?.name || "Walk-In Customer",
        subTotal: subtotal,
        discount: discountAmount,
        total: grandTotal,
        paymentMethod: paymentInfo,
        items: cart
      }

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload)
      })

      if (!res.ok) {
        throw new Error('Failed to save sale to API')
      }
      
      const newSale = await res.json()
      setSaleDetails(salePayload)

      // 1. Inventory Deduction Logic (UI state & API)
      const allRecipes = recipes; // Use state instead of localStorage
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
        } else {
          // If it's a direct product (not recipe based), we might deduct the product itself
          // Using sku from cart item
          const itemSku = cartItem.sku || cartItem.productId
          if (deductions[itemSku]) deductions[itemSku].quantity += cartItem.quantity
          else deductions[itemSku] = { name: cartItem.name, quantity: cartItem.quantity, unit: 'Nos' }
        }
      })

      const deductedArray = Object.values(deductions)
      setDeductedMaterials(deductedArray)
      
      // Deductions are now handled entirely by the backend API (/api/sales) during sale creation
      // This prevents double-deduction and ensures atomicity.
      
      // 2. Save Sale to Cash Drawer (for shift closing)
      const shiftSales = JSON.parse(localStorage.getItem("shift_sales") || "[]")
      shiftSales.push(grandTotal)
      localStorage.setItem("shift_sales", JSON.stringify(shiftSales))

      setSaleDetails(newSale)
      setIsPaymentModalOpen(false)
      setPaymentSuccess(true)
    } catch (e) {
      console.error(e)
      alert("Error processing payment via API")
    }
  }

  const handlePrintKOT = () => {
    // In a real system, this would trigger a print job to the kitchen printer via a local network service or Electron.
    alert(`[MOCK PRINTER] Kitchen Order Ticket (KOT) sent for ${lastOrderRef}!\n\nItems to prepare:\n${cart.map(c => `- ${c.quantity}x ${c.name} ${c.variant ? `(${c.variant})` : ''} ${c.addons.length > 0 ? `\n   Add-ons: ${c.addons.map(a=>a.name).join(', ')}` : ''}`).join('\n')}`)
  }

  // --- Shift Management ---
  const handleOpenShift = async () => {
    if (!openingBalance || !user) return
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashierName: user.name,
          branch: posBranch || "Colombo 07",
          openingBalance: parseFloat(openingBalance),
          status: 'Open'
        })
      });
      if (res.ok) {
        const shift = await res.json();
        setCurrentShiftId(shift._id);
        localStorage.setItem("shift_sales", JSON.stringify([])); // Local fallback for simple tally
        setShiftActive(true);
        setIsShiftOpen(false);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to open shift.");
    }
  }

  const handleCloseShift = async () => {
    if (!currentShiftId) return;
    const sales = JSON.parse(localStorage.getItem("shift_sales") || "[]")
    const totalSales = sales.reduce((a:number,b:number)=>a+b, 0)
    
    try {
      // First get current shift to know opening balance
      const shiftRes = await fetch(`/api/shifts?cashierName=${encodeURIComponent(user?.name || '')}&status=Open`);
      const shifts = await shiftRes.json();
      const shift = shifts[0];
      const expectedCash = (shift?.openingBalance || 0) + totalSales;

      await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentShiftId,
          status: 'Closed',
          endTime: new Date(),
          closingBalance: expectedCash,
          expectedClosingBalance: expectedCash
        })
      });

      alert(`--- Z-REPORT (SHIFT CLOSED) ---\nOpening Balance: Rs. ${shift?.openingBalance?.toFixed(2)}\nTotal Sales: Rs. ${totalSales.toFixed(2)}\nExpected Cash in Drawer: Rs. ${expectedCash.toFixed(2)}`)
      
      localStorage.removeItem("shift_sales")
      setShiftActive(false)
      setCurrentShiftId(null)
      setIsCloseShiftOpen(false)
      setIsShiftOpen(true) // Force them to open a new one
    } catch (e) {
      console.error(e);
      alert("Failed to close shift.");
    }
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
              <span className="text-sm font-semibold text-orange-800">{user?.name} ({posBranch || "Select Branch"})</span>
            </div>
          </div>
        </header>

        {/* Categories */}
        <div className="px-6 py-4 border-b bg-gray-50/50 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0 px-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => {
              const addons = product.addons || []
              return (
                <button 
                  key={product.id} 
                  onClick={() => !product.isOutOfStock && handleProductClick(product)}
                  disabled={product.isOutOfStock}
                  className={`relative flex flex-col text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 bg-white ${product.isOutOfStock ? 'opacity-50 grayscale cursor-not-allowed border-gray-200' : `hover:shadow-lg hover:-translate-y-1 group ${product.color.replace('bg-', 'border-').split(' ')[2] || 'border-gray-100'}`}`}
                >
                  {product.isOutOfStock && (
                    <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="bg-red-500 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-widest rotate-[-12deg] shadow-lg border-2 border-white">Out of Stock</span>
                    </div>
                  )}
                  <div className={`h-32 w-full flex items-center justify-center ${product.color.split(' ')[0]} bg-opacity-30`}>
                    <span className={`text-4xl font-black opacity-20 ${product.color.split(' ')[1]}`}>
                      {product.name.substring(0,2).toUpperCase()}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between w-full">
                    <h3 className={`font-bold leading-tight mb-2 transition-colors ${product.isOutOfStock ? 'text-gray-500' : 'text-gray-800 group-hover:text-orange-600'}`}>
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-auto">
                      {product.hasVariants ? (
                        <span className="text-xs font-bold text-gray-500">Var. Prices</span>
                      ) : (
                        <span className="text-sm font-black text-gray-900">Rs. {product.price.toFixed(2)}</span>
                      )}
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
                
                <div className="mt-1">
                  <Input 
                    placeholder="Add kitchen note (e.g. Less sugar)" 
                    className="h-7 text-xs bg-gray-50 border-gray-200"
                    value={item.note || ""}
                    onChange={(e) => updateItemNote(item.id, e.target.value)}
                  />
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
            disabled={cart.length === 0} onClick={initiatePayment}
          >
            <CreditCard className="w-6 h-6 mr-2" /> Pay Rs. {grandTotal.toFixed(2)}
          </Button>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 0. Branch Selection Modal (For Admins) */}
      <Dialog open={isBranchSelectOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md p-6 bg-white" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Select Operating Branch</DialogTitle>
            <DialogDescription>
              Please select the branch you are operating in for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {availableBranches.length === 0 ? (
               <p className="text-sm text-gray-500">Loading branches...</p>
            ) : (
              availableBranches.map(b => (
                <button 
                  key={b._id} 
                  type="button"
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all font-bold ${posBranch === b.name ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-200 bg-white hover:border-orange-300'}`}
                  onClick={() => setPosBranch(b.name)}
                >
                  {b.name}
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-lg font-bold rounded-xl disabled:opacity-50" 
              disabled={!posBranch}
              onClick={() => setIsBranchSelectOpen(false)}
            >
              Confirm Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                        <button key={v.name} type="button" onClick={() => !v.isOutOfStock && setSelectedVariant(v)} disabled={v.isOutOfStock}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${v.isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : selectedVariant?.name === v.name ? 'border-orange-500 bg-orange-50 shadow-md ring-1 ring-orange-500' : 'border-gray-200 bg-white hover:border-orange-200'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="font-bold text-gray-900">{v.name}</div>
                            {v.isOutOfStock && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">Out of Stock</span>}
                          </div>
                          <div className="text-sm font-medium text-orange-600 mt-1">Rs. {v.price.toFixed(2)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Smart Add-ons specific to category */}
                {selectedProduct.addons && selectedProduct.addons.length > 0 && (!selectedProduct.hasVariants || selectedVariant) && (
                  <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                    <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <span className="bg-orange-100 text-orange-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">{selectedProduct.hasVariants ? '2' : '1'}</span>
                      Add-ons (Optional)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProduct.addons.map((addon: any) => {
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
                <Button className="flex-1 h-12 rounded-xl font-bold bg-gray-900 text-white hover:bg-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleConfirmConfig} disabled={selectedProduct.hasVariants && !selectedVariant}>Add to Cart</Button>
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

      {/* 6. Payment Methods Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-gray-50">
          <form onSubmit={processPayment}>
            <div className="p-6 bg-white border-b">
              <DialogTitle className="text-xl font-black text-gray-900">Complete Payment</DialogTitle>
              <div className="text-3xl font-black text-orange-600 mt-2">Rs. {grandTotal.toFixed(2)}</div>
            </div>
            <div className="p-6 space-y-6 bg-gray-50">
              <div className="grid grid-cols-2 gap-3">
                {["Cash", "Card", "Bank Transfer", "Split"].map((method) => (
                  <button
                    key={method} type="button"
                    onClick={() => setPaymentMethod(method as any)}
                    className={`p-4 rounded-xl border-2 font-bold transition-all ${paymentMethod === method ? 'border-orange-500 bg-orange-100 text-orange-700 shadow-sm ring-1 ring-orange-500' : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {paymentMethod === "Split" && (
                <div className="bg-white p-4 rounded-xl border space-y-4">
                  <div className="grid gap-2">
                    <Label className="font-bold text-gray-700">Cash Amount (Rs.)</Label>
                    <Input type="number" step="0.01" value={splitCash} onChange={e => setSplitCash(e.target.value)} placeholder="0.00" className="h-11 font-bold text-lg" required />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-bold text-gray-700">Card Amount (Rs.)</Label>
                    <Input type="number" step="0.01" value={splitCard} onChange={e => setSplitCard(e.target.value)} placeholder="0.00" className="h-11 font-bold text-lg" required />
                  </div>
                  <div className="text-sm font-bold text-gray-500 text-right">
                    Total Entered: <span className="text-gray-900">Rs. {((parseFloat(splitCash)||0) + (parseFloat(splitCard)||0)).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-white border-t flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-12 font-bold rounded-xl" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 h-12 font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg">Confirm Payment</Button>
            </div>
          </form>
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
            <Button 
              variant="outline" 
              className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 font-bold"
              onClick={() => { setIsCustomerSelectOpen(false); setIsAddCustomerOpen(true); }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add New Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 7.5 Add Customer Modal */}
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-white">
          <form onSubmit={handleAddCustomer}>
            <div className="p-4 border-b bg-orange-50">
              <DialogTitle className="text-lg font-black text-gray-900 flex items-center gap-2">
                <User className="text-orange-500 w-5 h-5" /> Quick Add Customer
              </DialogTitle>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid gap-2">
                <Label className="font-bold">Name *</Label>
                <Input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} required placeholder="e.g. Nimal" />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold">Mobile *</Label>
                <Input value={newCustomer.mobile} onChange={e => setNewCustomer({...newCustomer, mobile: e.target.value})} required placeholder="e.g. 0771234567" />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold">Email</Label>
                <Input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} placeholder="Optional" />
              </div>
            </div>
            <DialogFooter className="p-4 bg-gray-50 border-t flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddCustomerOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold">Save & Select</Button>
            </DialogFooter>
          </form>
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
            <Button className="flex-1 h-12 text-lg font-bold rounded-xl" variant="outline" onClick={() => { setPaymentSuccess(false); setCart([]); setDiscountType("NONE"); setDiscountValue(0) }}>New Sale</Button>
            <Button className="flex-1 h-12 text-lg font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg" onClick={() => window.print()}>
              <Printer className="w-5 h-5 mr-2" /> Print Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Printable Receipt (Hidden from Screen, optimized for 80mm thermal printers) --- */}
      <div className="hidden print:flex absolute inset-0 bg-white z-[9999] justify-center text-black font-mono text-sm leading-tight">
        <div className="w-[80mm] py-4 px-2">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold mb-1 uppercase">JUICE BAR POS</h1>
            <p className="text-xs">{posBranch || "Colombo 07, Sri Lanka"}</p>
            <p className="text-xs">Tel: 011-2345678</p>
            <div className="border-b border-dashed border-gray-400 my-2" />
            <div className="text-left text-xs">
              <div className="flex justify-between">
                <span>Receipt: {lastOrderRef}</span>
                <span suppressHydrationWarning>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Cashier: {user?.name || 'Admin'}</span>
                <span suppressHydrationWarning>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="mt-1">
                <span>Customer: {saleDetails?.customer || "Walk-In"}</span>
              </div>
            </div>
            <div className="border-b border-dashed border-gray-400 my-2" />
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <div className="flex justify-between font-bold text-xs border-b border-dashed border-gray-400 pb-1 mb-2 uppercase">
              <span className="w-1/2">Item</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/3 text-right">Amount</span>
            </div>
            
            <div className="space-y-2">
              {saleDetails?.items?.map((item: any, i: number) => (
                <div key={i} className="text-xs">
                  <div className="flex justify-between items-start">
                    <span className="w-1/2 font-semibold pr-1 break-words">{item.name}</span>
                    <span className="w-1/6 text-center">{item.quantity}</span>
                    <span className="w-1/3 text-right">Rs. {item.totalPrice?.toFixed(2)}</span>
                  </div>
                  {(item.variant || item.addons?.length > 0 || item.note) && (
                    <div className="w-full text-[10px] text-gray-600 pl-2 mt-0.5 space-y-0.5">
                      {item.variant && <div>- {item.variant}</div>}
                      {item.addons?.map((a:any, ai:number) => (
                        <div key={ai}>+ {a.name} (Rs. {a.price})</div>
                      ))}
                      {item.note && <div className="italic">* {item.note}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-gray-400 pt-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs. {saleDetails?.subTotal?.toFixed(2)}</span>
            </div>
            {(saleDetails?.discount ?? 0) > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>- Rs. {saleDetails?.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm mt-1 border-t border-dashed border-gray-400 pt-1">
              <span>TOTAL</span>
              <span>Rs. {saleDetails?.total?.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment info */}
          <div className="border-t border-dashed border-gray-400 mt-2 pt-2 text-xs">
            <div className="flex justify-between">
              <span>Paid by {saleDetails?.paymentMethod}</span>
              <span>Rs. {saleDetails?.total?.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-xs space-y-1">
            <p className="font-bold">Thank You, Come Again!</p>
            <p>WIFI: JuiceBar_Guest / PW: juice123</p>
            <p>Follow us on IG @juicebar_pos</p>
            <div className="h-8"></div> {/* Bottom margin for printer cutting */}
          </div>
        </div>
      </div>
    </div>
  )
}
