// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let { pathname, origin } = request.nextUrl

  // 1) Normalize trailing slash (except for root)
  if (pathname !== '/' && pathname.endsWith('/')) {
    const normalized = pathname.slice(0, -1)
    return NextResponse.redirect(`${origin}${normalized}${request.nextUrl.search}`)
  }

  // 2) Public paths
  const isPublicPath =
    pathname === '/' ||
    pathname === '/homepage' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/introduction' ||
    // admin login (both variants)
    pathname === '/admin/login' ||
    pathname === '/admin/login/' ||
    // API auth endpoints
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/verify-coupon' ||
    pathname === '/api/check-final-test-eligibility' ||
    pathname === '/api/admin/check-admin' ||
    // static assets
    pathname.includes('/_next/') ||
    pathname.includes('/static/') ||
    pathname.includes('/images/') ||
    pathname.includes('/favicon.ico')||
    pathname.startsWith('/public/')||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|avif|pdf)$/i) !== null

  if (isPublicPath) {
    return NextResponse.next()
  }

  // 3) Check auth presence
  const hasAuthCookie = request.cookies.has('firebase-auth-token')
  const authHeader = request.headers.get('authorization') || ''
  const hasAuthHeader = authHeader.startsWith('Bearer ')
  const hasAuthTokenHeader = !!request.headers.get('x-firebase-auth-token')

  // 4) Check if user is trying to access admin routes
  if (pathname.startsWith('/admin/') && pathname !== '/admin/login') {
    // Check if user has admin cookie
    const isAdmin = request.cookies.has('is-admin') && request.cookies.get('is-admin')?.value === 'true'
    
    // Also check if user has auth token
    const hasAuthToken = request.cookies.has('firebase-auth-token')
    
    // If not admin or no auth token, redirect to admin login
    if (!isAdmin || !hasAuthToken) {
      return NextResponse.redirect(new URL('/admin/login', origin))
    }
  }

  // 5) If authenticated user hits any login page or homepage, send them to dashboard
  if (
    hasAuthCookie &&
    (pathname === '/' ||
     pathname === '/homepage' ||
     pathname === '/login' ||
     pathname === '/register')
  ) {
    // For regular login/homepage, redirect to user dashboard
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  // 6) If authenticated admin hits admin login, redirect to admin dashboard
  if (
    hasAuthCookie && 
    request.cookies.has('is-admin') && 
    request.cookies.get('is-admin')?.value === 'true' && 
    pathname === '/admin/login'
  ) {
    return NextResponse.redirect(new URL('/admin', origin))
  }

  // 7) If no auth, handle API vs pages
  if (!hasAuthCookie && !hasAuthHeader && !hasAuthTokenHeader) {
    // a) API routes → 401 (but skip public APIs)
    if (pathname.startsWith('/api/')) {
      // already allowed above: /api/auth/*, /api/verify-coupon, etc.
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // b) Admin pages → admin-login
    if (pathname.startsWith('/admin/')) {
      return NextResponse.redirect(new URL('/admin/login', origin))
    }

    // c) All other pages → main login
    return NextResponse.redirect(new URL('/login', origin))
  }

  // 8) Authenticated, non-login, non-public → allow!
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static
     * - _next/image
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}