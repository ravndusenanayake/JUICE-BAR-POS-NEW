import NextAuth from 'next-auth'
import { authConfig } from '@/auth/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

// Matrix mapping routes to required permissions
const RBAC_MATRIX = [
  { pathPattern: /^\/dashboard\/system-settings(\/.*)?$/, requiredAny: ["MANAGE_SYSTEM_SETTINGS"] },
  { pathPattern: /^\/dashboard\/branches(\/.*)?$/, requiredAny: ["VIEW_BRANCHES"] },
  { pathPattern: /^\/dashboard\/(users|staff|audit-logs)(\/.*)?$/, requiredAny: ["VIEW_USERS"] },
  { pathPattern: /^\/dashboard\/roles(\/.*)?$/, requiredAny: ["VIEW_ROLES"] },
  { pathPattern: /^\/dashboard\/(products|raw-materials|product-variants|add-ons)(\/.*)?$/, requiredAny: ["VIEW_PRODUCTS"] },
  { pathPattern: /^\/dashboard\/categories(\/.*)?$/, requiredAny: ["VIEW_CATEGORIES"] },
  { pathPattern: /^\/dashboard\/recipes(\/.*)?$/, requiredAny: ["VIEW_RECIPES"] },
  { pathPattern: /^\/dashboard\/suppliers(\/.*)?$/, requiredAny: ["VIEW_SUPPLIERS"] },
  { pathPattern: /^\/dashboard\/(inventory|branch-inventory|raw-material-inventory|stock-ledger|stock-adjustments)(\/.*)?$/, requiredAny: ["VIEW_INVENTORY"] },
  { pathPattern: /^\/dashboard\/purchase-orders(\/.*)?$/, requiredAny: ["VIEW_PO"] },
  { pathPattern: /^\/dashboard\/grn(\/.*)?$/, requiredAny: ["VIEW_GRN"] },
  { pathPattern: /^\/dashboard\/wastage(\/.*)?$/, requiredAny: ["VIEW_WASTAGE"] },
  { pathPattern: /^\/dashboard\/stock-transfers(\/.*)?$/, requiredAny: ["VIEW_STOCK_TRANSFERS"] },
  { pathPattern: /^\/dashboard\/customers(\/.*)?$/, requiredAny: ["VIEW_CUSTOMERS"] },
  { pathPattern: /^\/dashboard\/sales(\/.*)?$/, requiredAny: ["VIEW_SALES_HISTORY"] },
  { pathPattern: /^\/dashboard\/reports(\/.*)?$/, requiredAny: ["VIEW_ALL_REPORTS", "VIEW_BRANCH_REPORTS"] },
  { pathPattern: /^\/dashboard\/expenses(\/.*)?$/, requiredAny: ["VIEW_EXPENSES"] },
  { pathPattern: /^\/pos(\/.*)?$/, requiredAny: ["ACCESS_POS"] },
  { pathPattern: /^\/kitchen(\/.*)?$/, requiredAny: ["ACCESS_POS"] }
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isLoggedIn = !!session

  // 1. Check if trying to access a protected route
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/pos') || pathname.startsWith('/kitchen')) {
    
    // If not logged in, redirect to login
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const role = (session?.user as any)?.role
    const permissions = (session?.user as any)?.permissions || []

    // Super Admin gets implicit full access
    if (role === "Super Admin") {
      return NextResponse.next()
    }

    // 2. Perform RBAC checks based on permissions
    for (const rule of RBAC_MATRIX) {
      if (rule.pathPattern.test(pathname)) {
        const hasAccess = rule.requiredAny.some(p => permissions.includes(p))
        if (!hasAccess) {
          // Access Denied: redirect
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
        break; 
      }
    }
  }

  // If attempting to go to login while already logged in, redirect
  if (pathname === '/login' && isLoggedIn) {
    const permissions = (session?.user as any)?.permissions || []
    if (permissions.includes("VIEW_DASHBOARD") || (session?.user as any)?.role === "Super Admin") {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    } else if (permissions.includes("ACCESS_POS")) {
      return NextResponse.redirect(new URL('/pos', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pos/:path*',
    '/kitchen/:path*',
    '/login'
  ],
}
