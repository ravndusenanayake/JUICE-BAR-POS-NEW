"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { 
  Search, User, ShoppingCart, Power, Minus, Plus, Trash2, Printer, CheckCircle2, ChevronRight, X, Percent, DollarSign, Store, Tag, Coffee, Filter, CalendarClock, Phone, ArrowLeft, Loader2, RotateCcw, Wallet, PauseCircle, PlayCircle, CreditCard, MoreVertical, History, WifiOff, CloudLightning, Edit, Star
} from "lucide-react"
import { logAudit } from "@/lib/auditLogger"
import { toast } from "sonner"

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
  const [activeCategory, setActiveCategory] = useState("⭐ Quick Picks")
  const [searchQuery, setSearchQuery] = useState("")
  
  // -- Cart State --
  const [cart, setCart] = useState<CartItem[]>([])
  const [noteModalItem, setNoteModalItem] = useState<CartItem | null>(null)
  const [itemNote, setItemNote] = useState("")
  
  // -- Order Type State --
  const [orderType, setOrderType] = useState<"Dine-In" | "Takeaway" | "Delivery">("Takeaway")
  
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
  const [isShiftSummaryOpen, setIsShiftSummaryOpen] = useState(false)
  const [shiftSummaryData, setShiftSummaryData] = useState<any>(null)
  const [isShiftSummaryLoading, setIsShiftSummaryLoading] = useState(false)
  
  // -- Advanced POS Modals State --
  const [isExpenseOpen, setIsExpenseOpen] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseNote, setExpenseNote] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("Petty Cash")

  const [isReturnOpen, setIsReturnOpen] = useState(false)
  const [returnInvoiceNo, setReturnInvoiceNo] = useState("")
  const [returnSaleDetails, setReturnSaleDetails] = useState<any>(null)
  const [returnItems, setReturnItems] = useState<any[]>([])
  
  // -- Recent Sales (Last 5) --
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [isRecentSalesOpen, setIsRecentSalesOpen] = useState(false)
  
  // -- Payment & KOT --
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [tenderedCash, setTenderedCash] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "Bank Transfer" | "Split">("Cash")
  const [splitCash, setSplitCash] = useState("")
  const [splitCard, setSplitCard] = useState("")

  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [deductedMaterials, setDeductedMaterials] = useState<any[]>([])
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  
  // -- Offline Mode / Sync --
  const [isOnline, setIsOnline] = useState(true)
  const [offlineQueue, setOfflineQueue] = useState<any[]>([])
  const [isSyncSuccessOpen, setIsSyncSuccessOpen] = useState(false)
  const [syncSuccessCount, setSyncSuccessCount] = useState(0)

  const [lastOrderRef, setLastOrderRef] = useState("")
  const [saleDetails, setSaleDetails] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // -- Numpad State --
  const [numpadItem, setNumpadItem] = useState<CartItem | null>(null)
  const [numpadValue, setNumpadValue] = useState("")
  
  // -- Live Shift Stats --
  const [shiftSalesCount, setShiftSalesCount] = useState(0)
  const [shiftRevenue, setShiftRevenue] = useState(0)
  
  // -- Loyalty --
  const [redeemedPoints, setRedeemedPoints] = useState(0)

  // -- Global Order Note --
  const [globalOrderNote, setGlobalOrderNote] = useState("")
  
  // -- Data State --
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [currentShiftId, setCurrentShiftId] = useState<string | null>(null)

  // -- Branch Selection State --
  const [posBranch, setPosBranch] = useState<string | null>(null)
  const [availableBranches, setAvailableBranches] = useState<any[]>([])
  const [isBranchSelectOpen, setIsBranchSelectOpen] = useState(false)

  // --- Initial Branch Setup & Network State ---
  useEffect(() => {
    // Network listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    // Load offline queue
    const savedQueue = localStorage.getItem('pos_offline_sales');
    if (savedQueue) {
      try {
        setOfflineQueue(JSON.parse(savedQueue));
      } catch (e) { console.error("Error parsing offline queue", e) }
    }

    if (!user) return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    
    if (user.branch === "All Branches") {
      setIsBranchSelectOpen(true);
      fetch('/api/branches')
        .then(res => res.json())
        .then(data => setAvailableBranches(data.filter((b: any) => b.status === "Active")))
        .catch(console.error);
    } else {
      setPosBranch(user.branch);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // --- Initial Setup (Products, Recipes, Customers & Shift) ---
  useEffect(() => {
    if (!user || !posBranch) return;

    const fetchData = async () => {
      try {
        // 1. Check Shift from DB
        try {
          const shiftRes = await fetch(`/api/shifts?cashierName=${encodeURIComponent(user.name)}&status=Open&branch=${encodeURIComponent(posBranch)}`);
          if (shiftRes.ok) {
            const shifts = await shiftRes.json();
            if (shifts.length > 0) {
              setShiftActive(true);
              setCurrentShiftId(shifts[0]._id);
              localStorage.setItem('pos_current_shift', JSON.stringify({ active: true, id: shifts[0]._id }));
            } else {
              setIsShiftOpen(true);
              localStorage.setItem('pos_current_shift', JSON.stringify({ active: false, id: null }));
            }
          }
        } catch (e) {
           console.warn("Failed to fetch shift, falling back to cache");
           const cachedShift = localStorage.getItem('pos_current_shift');
           if (cachedShift) {
             const data = JSON.parse(cachedShift);
             if (data.active) {
               setShiftActive(true);
               setCurrentShiftId(data.id);
             } else {
               setIsShiftOpen(true);
             }
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

          const activeProducts = data.filter((p: any) => p.status === 'Active').map((p: any, index: number) => {
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
              id: p.sku || p._id,
              productId: p._id,
              name: p.name,
              price: p.outletPrice || 0,
              category: p.category || 'General',
              color: getCategoryColor(p.category),
              addons: uniqueAddons,
              hasVariants: productVariants.length > 0,
              variants: productVariants.length > 0 ? productVariants : null,
              isOutOfStock,
              isQuickPick: index < 10, // Top 10 items default as Quick Picks
              image: p.image || null
            };
          });
          setProducts(activeProducts);
          const cats = ["⭐ Quick Picks", "All", ...Array.from(new Set(activeProducts.map((p: any) => p.category)))];
          setCategories(cats as string[]);

          // CACHE
          localStorage.setItem('pos_products', JSON.stringify(activeProducts));
          localStorage.setItem('pos_categories', JSON.stringify(cats));
        }

        if (custRes && custRes.ok) {
          const data = await custRes.json();
          setCustomers(data);
          localStorage.setItem('pos_customers', JSON.stringify(data));
          const walkIn = data.find((c: any) => c.name === "Walk-In Customer");
          if (walkIn) setSelectedCustomer(walkIn);
          else if (data.length > 0) setSelectedCustomer(data[0]);
        }
      } catch (error) {
        console.warn("API fetch failed, falling back to local cache:", error);
        
        const cachedProducts = localStorage.getItem('pos_products');
        const cachedCats = localStorage.getItem('pos_categories');
        const cachedCustomers = localStorage.getItem('pos_customers');
        
        if (cachedProducts) setProducts(JSON.parse(cachedProducts));
        if (cachedCats) setCategories(JSON.parse(cachedCats));
        if (cachedCustomers) setCustomers(JSON.parse(cachedCustomers));
      }
    };
    fetchData();
  }, [user, posBranch])

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0 || !isOnline) return;
    
    let successCount = 0;
    const remainingQueue = [];

    for (const sale of offlineQueue) {
      try {
        const payload = { ...sale };
        delete payload._id; // Remove offline ID
        delete payload.createdAt;
        
        const res = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) successCount++;
        else remainingQueue.push(sale);
      } catch (e) {
        remainingQueue.push(sale);
      }
    }

    setOfflineQueue(remainingQueue);
    localStorage.setItem('pos_offline_sales', JSON.stringify(remainingQueue));
    if (successCount > 0) {
      setSyncSuccessCount(successCount);
      setIsSyncSuccessOpen(true);
    }
  }

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
      let matchCategory = false;
      if (activeCategory === "⭐ Quick Picks") {
        matchCategory = !!p.isQuickPick;
      } else {
        matchCategory = activeCategory === "All" || p.category === activeCategory;
      }
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
  const totalBeforeRedemption = afterDiscount
  const grandTotal = Math.max(0, totalBeforeRedemption - redeemedPoints)

  // --- Cart Handlers ---
  const handleProductClick = (product: any) => {
    // Quick add: products without variants go straight to cart
    if (!product.hasVariants) {
      addToCart(product, null, [])
      return
    }
    // Open config modal for products with variants
    setSelectedProduct(product)
    setSelectedVariant(null)
    setSelectedAddons([])
    setIsConfigOpen(true)
  }

  // Long press handler: always opens config modal (even for simple products with addons)
  const handleProductLongPress = (product: any) => {
    setSelectedProduct(product)
    setSelectedVariant(null)
    setSelectedAddons([])
    setIsConfigOpen(true)
  }
  // --- Keyboard Shortcuts & Barcode Scanner ---
  useEffect(() => {
    let barcodeBuffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Shortcuts
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) setIsPaymentModalOpen(true);
      }
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('pos-search-input')?.focus();
      }
      if (e.key === 'Escape') {
        if (!isPaymentModalOpen && !paymentSuccess) {
          setCart([]);
        }
      }

      // Barcode Scanner logic (fast typing < 50ms)
      if (!isInput) {
        const currentTime = Date.now();
        if (currentTime - lastKeyTime > 50) {
          barcodeBuffer = "";
        }
        
        if (e.key.length === 1) {
          barcodeBuffer += e.key;
        } else if (e.key === 'Enter' && barcodeBuffer.length > 3) {
          e.preventDefault();
          const scannedProduct = products.find((p: any) => p.id === barcodeBuffer || p.productId === barcodeBuffer);
          if (scannedProduct && !scannedProduct.isOutOfStock) {
            handleProductClick(scannedProduct);
            toast.success(`Scanned: ${scannedProduct.name}`);
          } else {
            toast.error("Product not found or out of stock: " + barcodeBuffer);
          }
          barcodeBuffer = "";
        }
        lastKeyTime = currentTime;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isPaymentModalOpen, paymentSuccess, products]);

  const toggleAddon = (addonObj: {name: string, price: number}) => {
    setSelectedAddons(prev => {
      const isSugar = addonObj.name.includes("Sugar");
      const isIce = addonObj.name.includes("Ice") && !addonObj.name.includes("Cream"); // Exclude Ice Cream

      const exists = prev.find(a => a.name === addonObj.name)
      if (exists) return prev.filter(a => a.name !== addonObj.name)

      // Remove other sugar/ice options if a new one is selected
      let filtered = prev;
      if (isSugar) filtered = filtered.filter(a => !a.name.includes("Sugar"));
      if (isIce) filtered = filtered.filter(a => !(a.name.includes("Ice") && !a.name.includes("Cream")));

      return [...filtered, addonObj]
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
    if (cart.length === 0 || isProcessing) return
    setIsProcessing(true)

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
        customerId: selectedCustomer?._id || selectedCustomer?.id || undefined,
        orderType: orderType,
        subTotal: subtotal,
        discount: discountAmount,
        redeemedPoints: redeemedPoints,
        total: grandTotal,
        paymentMethod: paymentInfo,
        items: cart,
        shiftId: currentShiftId,
        orderNote: globalOrderNote || undefined
      }

      let newSale: any;

      if (isOnline) {
        const res = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(salePayload)
        })

        if (!res.ok) {
          throw new Error('Failed to save sale to API')
        }
        
        newSale = await res.json()
        setRecentSales(prev => [newSale, ...prev].slice(0, 5))
      } else {
        // OFFLINE MODE: Queue the sale
        newSale = { ...salePayload, _id: `OFFLINE-${Date.now()}`, createdAt: new Date().toISOString() };
        const newQueue = [...offlineQueue, newSale];
        setOfflineQueue(newQueue);
        localStorage.setItem('pos_offline_sales', JSON.stringify(newQueue));
        setRecentSales(prev => [newSale, ...prev].slice(0, 5))
      }

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
      setShiftSalesCount(prev => prev + 1)
      setShiftRevenue(prev => prev + grandTotal)
      setGlobalOrderNote("")
      setRedeemedPoints(0)
    } catch (e) {
      console.error(e)
      alert("Error processing payment via API")
    } finally {
      setIsProcessing(false)
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

  const openShiftSummary = async () => {
    if (!currentShiftId) return;
    setIsShiftSummaryLoading(true);
    setIsCloseShiftOpen(true);
    try {
      const res = await fetch(`/api/shifts/summary?shiftId=${currentShiftId}`);
      if (res.ok) {
        const data = await res.json();
        setShiftSummaryData(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load shift summary");
    } finally {
      setIsShiftSummaryLoading(false);
    }
  }

  const openSlideOutSummary = async () => {
    if (!currentShiftId) return;
    setIsShiftSummaryLoading(true);
    setIsShiftSummaryOpen(true);
    try {
      const res = await fetch(`/api/shifts/summary?shiftId=${currentShiftId}`);
      if (res.ok) {
        const data = await res.json();
        setShiftSummaryData(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load shift summary");
    } finally {
      setIsShiftSummaryLoading(false);
    }
  }

  const handleOpenRecentSales = async () => {
    setIsRecentSalesOpen(true);
    try {
      const res = await fetch('/api/sales?limit=5');
      if (res.ok) {
        const data = await res.json();
        // Since API doesn't actually support ?limit=5 efficiently right now based on our checks,
        // we might just slice it, or we rely on the backend (we assume the backend handles it or returns all and we slice).
        // Let's just slice it to be safe.
        setRecentSales(Array.isArray(data) ? data.slice(0, 5) : []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load recent sales");
    }
  }


  const handleCloseShift = async () => {
    if (!currentShiftId || !shiftSummaryData) return;
    try {
      await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentShiftId,
          status: 'Closed',
          endTime: new Date(),
          closingBalance: shiftSummaryData.expectedCash,
          expectedClosingBalance: shiftSummaryData.expectedCash
        })
      });
      toast.success("Shift Closed Successfully!");
      localStorage.removeItem("shift_sales")
      setShiftActive(false)
      setCurrentShiftId(null)
      setIsCloseShiftOpen(false)
      setIsShiftOpen(true) // Force them to open a new one
    } catch (e) {
      console.error(e);
      toast.error("Failed to close shift.");
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShiftId || !posBranch) return;
    try {
      const branchRes = await fetch(`/api/branches?name=${encodeURIComponent(posBranch)}`);
      const branches = await branchRes.json();
      const branchId = branches[0]?._id;

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          shiftId: currentShiftId,
          expenseDate: new Date(),
          category: expenseCategory,
          amount: parseFloat(expenseAmount),
          note: expenseNote
        })
      });
      if (res.ok) {
        toast.success("Expense recorded successfully");
        setIsExpenseOpen(false);
        setExpenseAmount("");
        setExpenseNote("");
      } else {
        toast.error("Failed to record expense");
      }
    } catch (e) {
      toast.error("Error recording expense");
    }
  }

  const searchReturnInvoice = async () => {
    if (!returnInvoiceNo) return;
    try {
      const res = await fetch(`/api/sales?invoiceNo=${encodeURIComponent(returnInvoiceNo)}`);
      if (res.ok) {
        const sales = await res.json();
        if (sales.length > 0) {
          setReturnSaleDetails(sales[0]);
          setReturnItems(sales[0].items.map((i: any) => ({ ...i, returnQty: 0, reason: "Customer Request", action: "Wastage" })));
        } else {
          toast.error("Invoice not found");
        }
      }
    } catch (e) {
      toast.error("Error finding invoice");
    }
  }

  const handleProcessReturn = async () => {
    if (!returnSaleDetails) return;
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0);
    if (itemsToReturn.length === 0) {
      toast.error("No items selected to return");
      return;
    }
    
    try {
      const res = await fetch('/api/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: returnSaleDetails._id,
          isReturn: true,
          returnedItems: itemsToReturn.map(i => ({
            productId: i.productId,
            name: i.name,
            quantity: i.returnQty,
            refundAmount: (i.totalPrice / i.quantity) * i.returnQty,
            reason: i.reason,
            action: i.action
          }))
        })
      });
      if (res.ok) {
        toast.success("Return processed successfully");
        setIsReturnOpen(false);
        setReturnInvoiceNo("");
        setReturnSaleDetails(null);
      } else {
        toast.error("Failed to process return");
      }
    } catch (e) {
      toast.error("Error processing return");
    }
  }
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans selection:bg-orange-200">
      
      {/* LEFT: Sleek Navigation Sidebar */}
      <aside className="w-[80px] sm:w-[100px] flex flex-col items-center bg-gray-900 shadow-2xl py-6 z-30 shrink-0">
        <div className="mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Store className="text-white w-6 h-6" />
          </div>
        </div>
        
        <div className="flex flex-col gap-6 flex-1 w-full px-2">
          <button onClick={() => document.getElementById('pos-search-input')?.focus()} className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors group">
             <div className="p-3 rounded-xl bg-gray-800 group-hover:bg-gray-700"><Search className="w-5 h-5" /></div>
             <span className="text-[10px] font-medium">Search</span>
          </button>
          <button onClick={() => setIsExpenseOpen(true)} className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-green-400 transition-colors group">
             <div className="p-3 rounded-xl bg-gray-800 group-hover:bg-green-400/20"><Wallet className="w-5 h-5" /></div>
             <span className="text-[10px] font-medium">Expense</span>
          </button>
          <button onClick={() => setIsReturnOpen(true)} className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-blue-400 transition-colors group">
             <div className="p-3 rounded-xl bg-gray-800 group-hover:bg-blue-400/20"><RotateCcw className="w-5 h-5" /></div>
             <span className="text-[10px] font-medium">Return</span>
          </button>
          <button onClick={handleOpenRecentSales} className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-indigo-400 transition-colors group">
             <div className="p-3 rounded-xl bg-gray-800 group-hover:bg-indigo-400/20"><History className="w-5 h-5" /></div>
             <span className="text-[10px] font-medium">History</span>
          </button>
          <button onClick={openSlideOutSummary} className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-purple-400 transition-colors group">
             <div className="p-3 rounded-xl bg-gray-800 group-hover:bg-purple-400/20"><Printer className="w-5 h-5" /></div>
             <span className="text-[10px] font-medium text-center leading-tight">Z-Report</span>
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-6 items-center w-full px-2">
           {!isOnline && (
             <div className="text-red-500 animate-pulse flex flex-col items-center" title="Offline Mode">
               <WifiOff className="w-5 h-5" />
               <span className="text-[9px] mt-1 font-bold">OFFLINE</span>
             </div>
           )}
           {isOnline && offlineQueue.length > 0 && (
             <button onClick={syncOfflineQueue} className="text-blue-400 animate-pulse flex flex-col items-center hover:text-blue-300" title={`Sync ${offlineQueue.length}`}>
               <CloudLightning className="w-5 h-5" />
               <span className="text-[9px] mt-1 font-bold">{offlineQueue.length} SYNC</span>
             </button>
           )}
          <button onClick={openShiftSummary} className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors group">
             <div className="p-3 rounded-xl bg-gray-800 group-hover:bg-red-500/20"><Power className="w-5 h-5" /></div>
             <span className="text-[10px] font-medium text-center leading-tight">Close<br/>Shift</span>
          </button>
          <Link href="/dashboard" className="p-3 rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </aside>

      {/* CENTER: Products Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 z-10 relative overflow-hidden">
        <header className="pt-6 px-8 shrink-0 flex items-center justify-between gap-6">
           <div className="flex items-center gap-3 shrink-0 min-w-[150px]">
             <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
               <User className="text-orange-600 w-6 h-6" />
             </div>
             <div>
               <h1 className="text-lg font-black text-gray-900 leading-tight">{user?.name}</h1>
               <p className="text-xs text-gray-500 font-bold">{posBranch || "Select Branch"}</p>
             </div>
           </div>
           
           <div className="flex-1 max-w-xl mx-auto relative group shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              <Input 
                id="pos-search-input"
                type="text" placeholder="Scan barcode or search products (F2)..." 
                className="pl-12 bg-white border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.03)] focus-visible:ring-2 focus-visible:ring-orange-500 rounded-2xl h-14 w-full text-base font-bold text-gray-700 transition-all"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    const matches = filteredProducts.filter(p => !p.isOutOfStock);
                    if (matches.length === 1) {
                      handleProductClick(matches[0]);
                      setSearchQuery("");
                      (e.target as HTMLInputElement).blur();
                      toast.success(`Added: ${matches[0].name}`);
                    }
                  }
                }}
              />
           </div>
           <div className="shrink-0 min-w-[150px]"></div> {/* Spacer */}
        </header>

        {/* Categories (Pills) */}
        <div className="px-8 py-6 shrink-0 border-b border-gray-100">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeCategory === cat ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-105" : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-100"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-5 pb-20">
            {filteredProducts.map(product => {
              // Better background colors for premium look
              const premiumColorMap: Record<string, string> = {
                "Fresh Juices": "from-emerald-400 to-teal-500",
                "Milkshakes": "from-amber-400 to-orange-500",
                "Desserts": "from-pink-400 to-rose-500",
                "Snacks": "from-blue-400 to-indigo-500",
                "Mojitos": "from-cyan-400 to-blue-500",
                "General": "from-gray-700 to-gray-900"
              };
              const bgGradient = premiumColorMap[product.category] || premiumColorMap["General"];

              return (
                <button 
                  key={product.id} 
                  onClick={() => !product.isOutOfStock && handleProductClick(product)}
                  onContextMenu={(e) => { e.preventDefault(); if (!product.isOutOfStock) handleProductLongPress(product); }}
                  disabled={product.isOutOfStock}
                  className={`relative flex flex-col text-left rounded-3xl overflow-hidden transition-all duration-300 bg-white ${product.isOutOfStock ? 'opacity-60 cursor-not-allowed grayscale border-gray-200' : 'hover:shadow-[0_10px_20px_rgba(0,0,0,0.08)] hover:-translate-y-1 shadow-sm border border-transparent'}`}
                >
                  {product.isOutOfStock && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="bg-red-600 text-white font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest shadow-2xl rotate-[-12deg]">Sold Out</span>
                    </div>
                  )}
                  {product.image ? (
                    <div className="h-32 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                    </div>
                  ) : (
                    <div className={`h-32 w-full flex items-center justify-center bg-gradient-to-br ${bgGradient} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                      <span className="text-4xl font-black text-white/90 drop-shadow-md relative z-10 tracking-tighter">
                        {product.name.substring(0,2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col justify-between w-full bg-white border border-gray-100 border-t-0 rounded-b-3xl">
                    <h3 className={`font-bold text-sm leading-tight mb-3 transition-colors line-clamp-2 ${product.isOutOfStock ? 'text-gray-500' : 'text-gray-800'}`}>
                      {product.name}
                    </h3>
                    <div className="flex items-end justify-between mt-auto">
                      {product.hasVariants ? (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Variants</span>
                      ) : (
                        <span className="text-sm font-black text-gray-900">Rs.{product.price.toFixed(2)}</span>
                      )}
                      {product.hasVariants && (
                        <div className="bg-gray-100 text-gray-600 w-6 h-6 rounded-full flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Modern Cart Sidebar */}
      <div className="w-[420px] bg-white flex flex-col h-full shrink-0 relative z-20 shadow-2xl border-l border-gray-100">
        
        {/* Cart Header (Compact) */}
        <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100">
           <div className="flex items-center gap-2">
             <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">Current Order</h2>
             <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-widest">{lastOrderRef ? lastOrderRef : 'New'}</span>
           </div>
           <div className="flex gap-2">
             {heldBills.length > 0 && (
               <Button variant="outline" size="icon" onClick={() => setIsRecallOpen(true)} className="w-10 h-10 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 relative bg-white">
                 <History className="w-5 h-5" />
                 <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{heldBills.length}</span>
               </Button>
             )}
             <Button variant="outline" size="icon" onClick={() => setIsHoldOpen(true)} disabled={cart.length === 0} className="w-10 h-10 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 bg-white">
               <PauseCircle className="w-5 h-5" />
             </Button>
           </div>
        </div>

        {/* Customer & Type Selection (Single Row) */}
        <div className="px-3 py-2 flex flex-row items-center gap-2 border-b border-gray-100 bg-gray-50/50">
          <div className="bg-white p-0.5 flex rounded-lg border border-gray-200 shadow-sm shrink-0">
            {['Takeaway', 'Dine-In', 'Delivery'].map(type => (
              <button 
                key={type}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all duration-200 ${orderType === type ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                onClick={() => setOrderType(type as any)}
              >
                {type === 'Takeaway' ? 'TW' : type === 'Dine-In' ? 'DI' : 'DEL'}
              </button>
            ))}
          </div>
          
          <button onClick={() => setIsCustomerSelectOpen(true)} className="flex items-center justify-between w-full px-2 py-1 bg-white rounded-lg border border-gray-200 hover:border-orange-300 transition-colors group shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 w-full overflow-hidden">
              <User className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-xs font-black text-gray-900 truncate">
                {selectedCustomer?.name || "Walk-In"}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 transition-colors shrink-0" />
          </button>
        </div>

        {/* Cart Items (Ultra Compact) */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar bg-gray-50/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-2">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center shadow-inner">
                 <ShoppingCart className="w-6 h-6 text-gray-300" />
              </div>
              <p className="font-bold text-gray-400 text-xs">Your cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex flex-col gap-1 group relative hover:border-gray-200 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="pr-1 overflow-hidden">
                    <h4 className="font-bold text-gray-900 text-[13px] leading-tight truncate">{item.name}</h4>
                    {(item.variant || item.addons.length > 0) && (
                      <div className="text-[9px] text-gray-500 mt-0.5 font-medium flex flex-wrap gap-1 leading-none">
                        {item.variant && <span className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">{item.variant}</span>}
                        {item.addons.map(a => <span key={a.name} className="text-gray-400 block">+{a.name}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-gray-900 text-[13px]">Rs. {item.totalPrice.toFixed(0)}</div>
                  </div>
                </div>
                
                {item.note && (
                  <div className="bg-orange-50 p-1.5 rounded text-[10px] font-medium text-orange-800 flex justify-between items-start">
                     <span className="truncate">"{item.note}"</span>
                     <button onClick={() => {
                        const newCart = cart.map(c => c.id === item.id ? { ...c, note: "" } : c);
                        setCart(newCart);
                     }} className="text-orange-400 hover:text-orange-700 shrink-0 ml-1"><X className="w-3 h-3"/></button>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-1">
                  <button onClick={() => {
                     const newNote = prompt("Enter kitchen note for this item:", item.note || "");
                     if (newNote !== null) {
                       const newCart = cart.map(c => c.id === item.id ? { ...c, note: newNote } : c);
                       setCart(newCart);
                     }
                  }} className="text-[9px] font-bold text-gray-400 hover:text-orange-500 uppercase tracking-wider flex items-center gap-1 transition-colors">
                    <Edit className="w-2.5 h-2.5" /> Note
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-50 rounded p-0.5 border border-gray-200">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center rounded bg-white text-gray-500 hover:text-orange-600 shadow-sm transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <button onClick={() => { setNumpadItem(item); setNumpadValue(String(item.quantity)); }} className="w-6 text-center text-[13px] font-black text-gray-900 hover:text-orange-600">{item.quantity}</button>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center rounded bg-white text-gray-500 hover:text-orange-600 shadow-sm transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Footer (Ultra Compact) */}
        <div className="px-3 py-2 bg-white shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] z-30 rounded-t-xl border-t border-gray-100">
          
          {/* Quick Cash Buttons */}
          {cart.length > 0 && grandTotal > 0 && (
             <div className="flex gap-1.5 mb-1.5">
                <button onClick={() => { setPaymentMethod("Cash"); setTenderedCash(grandTotal.toFixed(2)); setTimeout(initiatePayment, 100); }} className="flex-1 py-1 rounded bg-green-50 border border-green-200 text-green-700 font-bold text-[10px] hover:bg-green-100 uppercase">Exact</button>
                <button onClick={() => { setPaymentMethod("Cash"); setTenderedCash("2000"); setTimeout(initiatePayment, 100); }} className="flex-1 py-1 rounded bg-gray-50 border border-gray-200 text-gray-700 font-bold text-[10px] hover:bg-gray-100">Rs. 2000</button>
                <button onClick={() => { setPaymentMethod("Cash"); setTenderedCash("5000"); setTimeout(initiatePayment, 100); }} className="flex-1 py-1 rounded bg-gray-50 border border-gray-200 text-gray-700 font-bold text-[10px] hover:bg-gray-100">Rs. 5000</button>
             </div>
          )}

          <div className="flex flex-col gap-0.5 mb-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
              <button onClick={() => setIsDiscountOpen(true)} className="flex items-center text-orange-500 hover:text-orange-600 transition-colors">
                <Tag className="w-3 h-3 mr-1" /> {discountType === "NONE" ? "Add Discount" : `${discountType === "PERCENT" ? `${discountValue}%` : `Rs. ${discountValue}`} Discount`}
              </button>
              <div className="flex gap-2 text-right">
                 {discountAmount > 0 && <span className="text-red-500">- Rs. {discountAmount.toFixed(2)}</span>}
                 <span className="text-gray-900 w-20">Rs. {subtotal.toFixed(0)}</span>
              </div>
            </div>

            {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
              <div className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-black flex items-center text-[9px]"><Star className="w-2.5 h-2.5 mr-0.5 fill-yellow-500"/> {selectedCustomer.loyaltyPoints}</span>
                  {redeemedPoints > 0 ? (
                    <button onClick={() => setRedeemedPoints(0)} className="text-red-500 font-bold hover:text-red-700 transition-colors">Remove</button>
                  ) : (
                    <button onClick={() => setRedeemedPoints(Math.min(selectedCustomer.loyaltyPoints, grandTotal))} className="text-blue-500 font-bold hover:text-blue-700 transition-colors">Redeem</button>
                  )}
                </div>
                {redeemedPoints > 0 && <span className="text-red-500 font-bold w-20 text-right">- Rs. {redeemedPoints.toFixed(2)}</span>}
              </div>
            )}

            <div className="flex justify-between items-end pt-2">
              <span className="text-lg font-black text-gray-900">Total</span>
              <span className="text-4xl font-black text-orange-500 tracking-tighter drop-shadow-sm">Rs. {grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button onClick={() => setGlobalOrderNote(prompt("Enter global order note:") || "")} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-colors ${globalOrderNote ? 'border-orange-500 text-orange-500 bg-orange-50' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}>
                <Edit className="w-5 h-5" />
             </button>
             <Button 
               className="flex-1 h-14 text-xl font-black rounded-2xl shadow-[0_10px_20px_rgba(249,115,22,0.3)] bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
               disabled={cart.length === 0} onClick={initiatePayment}
             >
               <CreditCard className="w-6 h-6 mr-2" /> Pay Rs. {grandTotal.toFixed(2)}
             </Button>
          </div>
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

              {paymentMethod === "Cash" && (
                <div className="bg-white p-4 rounded-xl border space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" className="flex-1 font-bold bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={() => setTenderedCash(grandTotal.toFixed(2))}>Exact</Button>
                    <Button type="button" variant="outline" className="flex-1 font-bold" onClick={() => setTenderedCash("1000")}>Rs. 1000</Button>
                    <Button type="button" variant="outline" className="flex-1 font-bold" onClick={() => setTenderedCash("2000")}>Rs. 2000</Button>
                    <Button type="button" variant="outline" className="flex-1 font-bold" onClick={() => setTenderedCash("5000")}>Rs. 5000</Button>
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-bold text-gray-700">Tendered Cash (Rs.)</Label>
                    <Input type="number" step="0.01" value={tenderedCash} onChange={e => setTenderedCash(e.target.value)} placeholder="0.00" className="h-11 font-bold text-lg" required />
                  </div>
                  {parseFloat(tenderedCash) >= grandTotal && (
                    <div className="text-sm font-black text-green-600 text-right">
                      Change: <span className="text-xl">Rs. {(parseFloat(tenderedCash) - grandTotal).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

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
              <Button type="submit" disabled={isProcessing} className="flex-1 h-12 font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg disabled:opacity-70">
                {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</> : 'Confirm Payment'}
              </Button>
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
                  key={c._id || c.id} 
                  onClick={() => { setSelectedCustomer(c); setIsCustomerSelectOpen(false) }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${(selectedCustomer?._id || selectedCustomer?.id) === (c._id || c.id) ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-200 bg-white hover:border-orange-300'}`}
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

      {/* --- Advanced POS Modals --- */}
      {/* Shift Summary Modal */}
      <Dialog open={isCloseShiftOpen} onOpenChange={setIsCloseShiftOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-red-50 p-6 border-b text-center">
            <Power className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <DialogTitle className="text-2xl font-black text-gray-900">Close Shift (Z-Report)</DialogTitle>
            <DialogDescription className="text-red-700 font-medium">Verify your till before closing</DialogDescription>
          </div>
          
          <div className="p-6">
            {isShiftSummaryLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : shiftSummaryData ? (
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-500">Opening Balance:</span>
                  <span className="font-bold">Rs. {shiftSummaryData.openingBalance?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cash Sales:</span>
                  <span className="font-bold text-green-600">+ Rs. {shiftSummaryData.cashSales?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Card/Other Sales:</span>
                  <span className="font-bold text-gray-700">Rs. {(shiftSummaryData.cardSales + shiftSummaryData.otherSales)?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Petty Cash (Expenses):</span>
                  <span className="font-bold text-red-500">- Rs. {shiftSummaryData.totalExpenses?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
                  <span className="text-gray-500">Cash Returns:</span>
                  <span className="font-bold text-red-500">- Rs. {shiftSummaryData.totalRefunds?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-lg">
                  <span className="font-black text-gray-900">Expected Cash in Drawer:</span>
                  <span className="font-black text-orange-600 bg-orange-100 px-3 py-1 rounded-md">Rs. {shiftSummaryData.expectedCash?.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-red-500 font-bold">Failed to load data</p>
            )}
          </div>
          <DialogFooter className="p-4 bg-gray-50 border-t flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsCloseShiftOpen(false)}>Cancel</Button>
            <Button onClick={handleCloseShift} disabled={isShiftSummaryLoading} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg">Confirm & Close Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Modal */}
      <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              <Wallet className="w-5 h-5 text-green-500" /> Petty Cash / Expense
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4 mt-2">
            <div className="grid gap-2">
              <Label className="font-bold">Amount (Rs.) *</Label>
              <Input type="number" step="0.01" value={expenseAmount} onChange={e=>setExpenseAmount(e.target.value)} required placeholder="e.g. 500" className="h-12 text-lg font-bold" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Category</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={expenseCategory} onChange={e=>setExpenseCategory(e.target.value)}>
                <option value="Petty Cash">Petty Cash</option>
                <option value="Transportation">Transportation</option>
                <option value="Marketing">Marketing / Promo</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label className="font-bold">Note / Reason *</Label>
              <Input value={expenseNote} onChange={e=>setExpenseNote(e.target.value)} required placeholder="e.g. Bought ice" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsExpenseOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold">Take Cash</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* POS Return Modal */}
      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="p-4 border-b bg-blue-50 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-gray-900">
              <RotateCcw className="w-5 h-5 text-blue-500" /> Process Return
            </DialogTitle>
            <div className="flex gap-2 mt-4">
              <Input value={returnInvoiceNo} onChange={e=>setReturnInvoiceNo(e.target.value)} placeholder="Scan or type Invoice No..." className="flex-1 h-10" />
              <Button onClick={searchReturnInvoice} className="bg-blue-600 hover:bg-blue-700 text-white"><Search className="w-4 h-4 mr-2" /> Find</Button>
            </div>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            {returnSaleDetails ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg flex justify-between text-sm font-semibold text-gray-600">
                  <span>Bill: {returnSaleDetails.invoiceNo}</span>
                  <span>Total: Rs. {returnSaleDetails.total?.toFixed(2)}</span>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2">Sold Qty</th>
                        <th className="p-2 text-center">Return Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {returnItems.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-2 font-medium">{item.name}</td>
                          <td className="p-2">{item.quantity}</td>
                          <td className="p-2 flex justify-center items-center gap-2">
                            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => {
                              const newItems = [...returnItems];
                              if (newItems[i].returnQty > 0) newItems[i].returnQty--;
                              setReturnItems(newItems);
                            }}><Minus className="w-3 h-3" /></Button>
                            <span className="font-bold w-4 text-center">{item.returnQty}</span>
                            <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => {
                              const newItems = [...returnItems];
                              if (newItems[i].returnQty < item.quantity) newItems[i].returnQty++;
                              setReturnItems(newItems);
                            }}><Plus className="w-3 h-3" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 italic text-sm">
                Search for an invoice to process returns.
              </div>
            )}
          </div>
          
          <div className="p-4 border-t bg-gray-50 shrink-0 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setIsReturnOpen(false); setReturnSaleDetails(null); setReturnInvoiceNo(""); }}>Cancel</Button>
            <Button disabled={!returnSaleDetails} onClick={handleProcessReturn} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Confirm Return</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Printable Receipt (Hidden from Screen, optimized for 80mm thermal printers) --- */}
      <style type="text/css" media="print">
        {`@page { margin: 0; }`}
      </style>
      <div className="hidden print:flex absolute inset-0 bg-white z-[9999] justify-center text-black font-mono text-sm leading-tight pt-4">
        <div className="w-[80mm] py-4 px-2">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold mb-1 uppercase">JUICE BAR</h1>
            <p className="font-black text-lg my-1 py-1 border-y border-dashed border-gray-400">** {saleDetails?.orderType?.toUpperCase()} **</p>
            <p className="text-xs">{posBranch || "Colombo 07, Sri Lanka"}</p>
            <p className="text-xs">Tel: 011-2345678</p>
            <div className="border-b border-dashed border-gray-400 my-2" />
            <div className="text-left text-xs">
              <div className="flex justify-between">
                <span className="font-bold">Receipt: {lastOrderRef}</span>
                <span suppressHydrationWarning>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Cashier: {user?.name || 'Admin'}</span>
                <span suppressHydrationWarning>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="flex justify-between mt-1">
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
              <span>Rs. {saleDetails?.subtotal?.toFixed(2)}</span>
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
            <div className="border-t border-dashed border-gray-400 my-2 pt-2">
              <p className="font-bold text-[10px]">RETURN POLICY</p>
              <p className="text-[10px] leading-tight mt-0.5">Returns/Exchanges valid within 3 days with original receipt.</p>
            </div>
            <p className="pt-1">WIFI: JuiceBar_Guest / PW: juice123</p>
            <p>Follow us on IG @juicebar_pos</p>
            <div className="h-8"></div> {/* Bottom margin for printer cutting */}
          </div>
        </div>
      </div>
      {/* Shift Summary Slide-Out Panel */}
      <div 
        className={`fixed inset-0 bg-black/40 z-[100] transition-opacity duration-300 ${isShiftSummaryOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} 
        onClick={() => setIsShiftSummaryOpen(false)}
      >
        <div 
          className={`absolute top-0 right-0 w-[400px] h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 transform ${isShiftSummaryOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <Printer className="w-5 h-5 text-purple-500" />
              Shift Summary
            </h2>
            <button onClick={() => setIsShiftSummaryOpen(false)} className="p-2 rounded-full hover:bg-gray-200 text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {isShiftSummaryLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : shiftSummaryData ? (
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between pb-3 border-b border-gray-200">
                  <span className="text-gray-500">Opening Balance:</span>
                  <span className="font-bold text-gray-800">Rs. {shiftSummaryData.openingBalance?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cash Sales:</span>
                  <span className="font-bold text-green-600">+ Rs. {shiftSummaryData.cashSales?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Card/Other Sales:</span>
                  <span className="font-bold text-gray-700">Rs. {(shiftSummaryData.cardSales + shiftSummaryData.otherSales)?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Petty Cash (Expenses):</span>
                  <span className="font-bold text-red-500">- Rs. {shiftSummaryData.totalExpenses?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-gray-200">
                  <span className="text-gray-500">Refunds:</span>
                  <span className="font-bold text-red-500">- Rs. {shiftSummaryData.totalRefunds?.toFixed(2)}</span>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-xl flex justify-between items-center border border-purple-100">
                  <span className="text-purple-800 font-bold uppercase tracking-wider text-xs">Expected Cash in Till</span>
                  <span className="text-xl font-black text-purple-700">Rs. {shiftSummaryData.expectedCash?.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Printer className="w-12 h-12 mb-2 opacity-20" />
                <p>No shift data available.</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t bg-gray-50">
            <Button className="w-full font-bold h-12 rounded-xl bg-purple-600 hover:bg-purple-700" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print Summary
            </Button>
          </div>
        </div>
      </div>

      {/* 11. Recent Sales Modal */}
      <Dialog open={isRecentSalesOpen} onOpenChange={setIsRecentSalesOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-gray-50">
          <div className="p-6 bg-white border-b flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl font-black text-gray-900">Recent Sales</DialogTitle>
              <DialogDescription>Last 5 transactions</DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsRecentSalesOpen(false)}><X className="w-5 h-5" /></Button>
          </div>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {recentSales.length > 0 ? recentSales.map((sale: any) => (
              <div key={sale._id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="text-sm font-bold text-gray-900">{sale.receiptNumber}</div>
                  <div className="text-xs font-medium text-gray-500">{new Date(sale.createdAt).toLocaleString()} &bull; {sale.paymentMethod}</div>
                  <div className="text-xs text-gray-400 mt-1">{sale.items?.length || 0} items</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-green-600">Rs. {sale.total?.toFixed(2)}</div>
                  <Button variant="outline" size="sm" className="mt-2 h-7 text-[10px] font-bold" onClick={() => alert("Printing Receipt: " + sale.receiptNumber)}>Print</Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400 font-medium">No recent sales found.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 12. Numpad Quantity Dialog */}
      <Dialog open={!!numpadItem} onOpenChange={() => setNumpadItem(null)}>
        <DialogContent className="sm:max-w-xs p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-white">
          <div className="p-4 bg-gray-900 text-white text-center">
            <DialogTitle className="text-lg font-black">{numpadItem?.name}</DialogTitle>
            <DialogDescription className="text-gray-400 text-xs mt-1">Enter quantity</DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            <div className="text-center">
              <Input 
                type="number" min="1" max="999"
                value={numpadValue}
                onChange={(e) => setNumpadValue(e.target.value)}
                className="text-center text-4xl font-black h-16 border-2 border-orange-200 focus:border-orange-500 rounded-xl"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const qty = parseInt(numpadValue) || 1;
                    if (numpadItem && qty > 0) {
                      setCart(prev => prev.map(item => 
                        item.id === numpadItem.id 
                          ? { ...item, quantity: qty, totalPrice: qty * item.basePrice }
                          : item
                      ));
                      setNumpadItem(null);
                    }
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumpadValue(prev => prev === "0" ? String(n) : prev + String(n))}
                  className="h-12 rounded-xl border-2 border-gray-200 font-bold text-xl text-gray-800 hover:bg-orange-50 hover:border-orange-300 transition-all active:scale-95"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setNumpadValue(prev => prev.slice(0, -1) || "0")}
                className="h-12 rounded-xl border-2 border-gray-200 font-bold text-lg text-red-500 hover:bg-red-50 hover:border-red-300 transition-all col-span-2"
              >
                ← Clear
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-11 font-bold rounded-xl" onClick={() => setNumpadItem(null)}>Cancel</Button>
              <Button 
                className="flex-1 h-11 font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white" 
                onClick={() => {
                  const qty = parseInt(numpadValue) || 1;
                  if (numpadItem && qty > 0) {
                    setCart(prev => prev.map(item => 
                      item.id === numpadItem.id 
                        ? { ...item, quantity: qty, totalPrice: qty * item.basePrice }
                        : item
                    ));
                    setNumpadItem(null);
                  }
                }}
              >
                Set Qty: {numpadValue || "0"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Offline Sync Success Modal */}
      <Dialog open={isSyncSuccessOpen} onOpenChange={setIsSyncSuccessOpen}>
        <DialogContent className="sm:max-w-md p-8 text-center bg-white rounded-3xl overflow-hidden shadow-2xl border-0">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          
          <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <CloudLightning className="w-12 h-12 text-blue-500 animate-bounce" />
          </div>
          
          <DialogTitle className="text-3xl font-black tracking-tight text-gray-900 mb-2">Sync Complete!</DialogTitle>
          <DialogDescription className="text-lg text-gray-600 font-medium mb-8">
            Successfully synced <span className="font-bold text-blue-600">{syncSuccessCount}</span> offline sales to the central database.
          </DialogDescription>
          
          <Button 
            onClick={() => setIsSyncSuccessOpen(false)}
            className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl text-xl font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            Awesome!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
