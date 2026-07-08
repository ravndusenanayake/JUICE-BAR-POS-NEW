import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Matrix mapping routes to allowed roles
const RBAC_MATRIX = [
  {
    pathPattern: /^\/dashboard\/system-settings(\/.*)?$/,
    allowedRoles: ["Super Admin"]
  },
  {
    pathPattern: /^\/dashboard\/(branches|users|roles)(\/.*)?$/,
    allowedRoles: ["Super Admin", "Admin"]
  },
  {
    pathPattern: /^\/dashboard\/(products|categories|units|add-ons|inventory|raw-materials|branch-inventory|raw-material-inventory|recipes)(\/.*)?$/,
    allowedRoles: ["Super Admin", "Admin", "Branch Manager"]
  },
  {
    pathPattern: /^\/dashboard\/sales(\/.*)?$/,
    allowedRoles: ["Super Admin", "Admin", "Branch Manager", "Cashier"]
  },
  {
    pathPattern: /^\/pos(\/.*)?$/,
    allowedRoles: ["Super Admin", "Admin", "Branch Manager", "Cashier"]
  }
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Check if trying to access a protected route
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/pos')) {
    
    // Read userRole cookie
    const userRoleCookie = request.cookies.get('userRole')
    const role = userRoleCookie?.value

    // If no role cookie is present, redirect to login
    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. Perform RBAC checks
    // Find the first rule that matches the current pathname
    for (const rule of RBAC_MATRIX) {
      if (rule.pathPattern.test(pathname)) {
        if (!rule.allowedRoles.includes(role)) {
          // Access Denied: redirect to the default dashboard
          // If they are on the root dashboard, don't cause infinite redirect
          if (pathname === '/dashboard') return NextResponse.next()
          
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        // Match found and role is allowed
        break; 
      }
    }
  }

  // If attempting to go to login while already logged in, redirect to dashboard
  if (pathname === '/login') {
    const userRoleCookie = request.cookies.get('userRole')
    if (userRoleCookie?.value) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Allow request to proceed
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pos/:path*',
    '/login'
  ],
}
