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
    path.includes('/static/') ||
    path.includes('/images/') ||
    path.includes('/favicon.ico')
  
  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // Check for authentication in multiple places
  const hasAuthCookie = request.cookies.has('firebase-auth-token')
  
  // Check for token in authorization header (for API requests)
  const authHeader = request.headers.get('authorization')
  const hasAuthHeader = authHeader && authHeader.startsWith('Bearer ')
  
  // Check if we're using mock credentials
  const isMockEnvironment = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-api-key'
  
  // If using mock credentials and the token starts with "mock-firebase-token", consider it valid
  if (isMockEnvironment) {
    const authToken = request.cookies.get('firebase-auth-token')?.value
    const isMockToken = authToken && authToken.startsWith('mock-firebase-token')
    
    // If it's a mock token, allow access
    if (isMockToken) {
      return NextResponse.next()
    }
  }
  
  // If no authentication found, redirect to login
  if (!hasAuthCookie && !hasAuthHeader) {
    // For API requests, return 401 Unauthorized
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // For page requests, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If user is authenticated and trying to access login page, redirect to dashboard
  if ((path === '/login' || path === '/register') && hasAuthCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Allow access to all other routes if authenticated
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