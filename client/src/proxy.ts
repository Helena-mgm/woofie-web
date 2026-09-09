import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  '/events',
  '/map',
  '/lost-dogs',
];

const AUTH_ROUTES = ['/login', '/register'];

const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
};

const isAuthRoute = (pathname: string): boolean => {
  return AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasAuthMarker = Boolean(request.cookies.get('woofie_auth')?.value);
  const authorizationHeader = request.headers.get('authorization') ?? '';
  const hasBearerToken = authorizationHeader.startsWith('Bearer ') && authorizationHeader.length > 7;
  const isPossiblyAuthenticated = hasAuthMarker || hasBearerToken;

  if (isPublicRoute(pathname) || isAuthRoute(pathname)) {
    return NextResponse.next();
  }

  if (!isPossiblyAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
