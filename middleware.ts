import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname
  
  // Define public paths that don't require authentication
  const isPublicPath = 
    path === '/login' || 
    path === '/register' ||
    path === '/homepage' || 
    path === '/' || 
    path.startsWith('/api/auth/') ||
    path === '/introduction' ||
    path.includes('/_next/') ||
    path.includes('/favicon.ico')
  
  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // Check if user is authenticated by looking for the Firebase auth cookie
  const authCookie = request.cookies.get('firebase-auth-token')
  
  // If no auth cookie, redirect to login
  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If user is authenticated and trying to access login page, redirect to dashboard
  if (path === '/login' && authCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // For API routes, we'll let them handle their own authentication
  if (path.startsWith('/api/') && path !== '/api/auth/validate') {
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}