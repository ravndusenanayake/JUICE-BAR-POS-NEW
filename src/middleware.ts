import NextAuth from 'next-auth'
import { authConfig } from '@/auth/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

// Matrix mapping routes to allowed roles
const RBAC_MATRIX = [
  {
    pathPattern: /^\/dashboard\/system-settings(\/.*)?$/,
    allowedRoles: ["Super Admin"]
  },
  {
    pathPattern: /^\/dashboard\/(branches|users|roles|audit-logs)(\/.*)?$/,
    allowedRoles: ["Super Admin", "Admin"]
  },
  {
    pathPattern: /^\/dashboard\/(products|categories|units|add-ons|recipes)(\/.*)?$/,
    allowedRoles: ["Super Admin", "Admin"]
  },
  {
    pathPattern: /^\/dashboard\/(inventory|branch-inventory|raw-material-inventory|stock-ledger|stock-transfers|suppliers|purchase-orders|grn|wastage)(\/.*)?$/,
    allowedRoles: ["Super Admin", "Admin", "Branch Manager", "Store Keeper"]
  },
  {
    pathPattern: /^\/dashboard\/(expenses|reports)(\/.*)?$/,
    allowedRoles: ["Super Admin", "Admin", "Branch Manager"]
  },
  {
    pathPattern: /^\/dashboard\/(sales|customers)(\/.*)?$/,
    allowedRoles: ["Super Admin", "Admin", "Branch Manager", "Cashier"]
  },
  {
    pathPattern: /^\/pos(\/.*)?$/,
    allowedRoles: ["Super Admin", "Admin", "Branch Manager", "Cashier"]
  }
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isLoggedIn = !!session

  // 1. Check if trying to access a protected route
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/pos')) {
    
    // If not logged in, redirect to login
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const role = (session?.user as any)?.role

    // 2. Perform RBAC checks
    // Find the first rule that matches the current pathname
    for (const rule of RBAC_MATRIX) {
      if (rule.pathPattern.test(pathname)) {
        if (!rule.allowedRoles.includes(role)) {
          // Access Denied: redirect to the default dashboard
          if (pathname === '/dashboard') return NextResponse.next()
          
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
        break; 
      }
    }
  }

  // If attempting to go to login while already logged in, redirect to dashboard
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pos/:path*',
    '/login'
  ],
}
