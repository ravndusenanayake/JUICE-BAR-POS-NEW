import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

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

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || "SUPER_SECRET_JUICE_BAR_KEY_2026_VERY_SECURE"
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Check if trying to access a protected route
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/pos')) {
    
    // Read JWT token cookie
    const tokenCookie = request.cookies.get('auth_token')
    const token = tokenCookie?.value

    // If no token is present, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      // Verify JWT
      const { payload } = await jwtVerify(token, getJwtSecretKey())
      const role = payload.role as string

      // 2. Perform RBAC checks
      for (const rule of RBAC_MATRIX) {
        if (rule.pathPattern.test(pathname)) {
          if (!rule.allowedRoles.includes(role)) {
            if (pathname === '/dashboard') return NextResponse.next()
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }
          break; 
        }
      }
    } catch (error) {
      // Invalid token
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // If attempting to go to login while already logged in, redirect to dashboard
  if (pathname === '/login') {
    const tokenCookie = request.cookies.get('auth_token')
    if (tokenCookie?.value) {
      try {
        await jwtVerify(tokenCookie.value, getJwtSecretKey())
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch (error) {
        // invalid token, let them access login page
      }
    }
  }

  // Allow request to proceed
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pos/:path*',
    '/login'
  ],
}
