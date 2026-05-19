import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/landing',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api',
];
const DEV_PREVIEW_PATHS = ['/home', '/advisor'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)));
  if (isPublic) return NextResponse.next();

  const isDevPreview =
    process.env.NODE_ENV === 'development' &&
    DEV_PREVIEW_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isDevPreview) return NextResponse.next();

  // Solo chequea presencia de la cookie httpOnly (la validez la valida el backend).
  // Si está expirada, el primer request 401 dispara refresh automático en el cliente.
  const token = req.cookies.get('av_access')?.value || req.cookies.get('av_refresh')?.value;

  if (!token) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
