import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes accessible without authentication
 * Rule: Clear list of allowed routes
 */
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/team',
  '/press',
  '/faq',
  '/support',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/events',    // events are publicly viewable; join/create actions require auth client-side
  '/map',       // map is publicly viewable
  '/lost-dogs', // lost dog alerts are publicly viewable
];

/**
 * Auth routes (login/register) - redirect to dashboard if authenticated
 */
const AUTH_ROUTES = ['/login', '/register'];

/**
 * Check if route is public
 */
const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
};

/**
 * Check if route is auth route (login/register)
 */
const isAuthRoute = (pathname: string): boolean => {
  return AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
};

/**
 * Middleware to protect private routes
 * Redirects to /login if not authenticated
 * Redirects to /community if an authenticated user hits /login or /register
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for authentication token
  const token = request.cookies.get('woofie_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // If authenticated and trying to access login/register, redirect to community feed
  if (token && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL('/community', request.url));
  }

  // Check if route is public
  if (isPublicRoute(pathname) || isAuthRoute(pathname)) {
    return NextResponse.next();
  }

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Config: Apply middleware to all routes except static files
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    // Exclude Next internals (/_next/*), API and public assets from authentication middleware
      // Exclude Next internals, API routes and our dev-only client-api from auth middleware
      '/((?!api|client-api|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
