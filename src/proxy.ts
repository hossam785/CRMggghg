import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import { safeNext } from '@/lib/safe-next';
import type { Database } from '@/types/database';

const PUBLIC_EXACT_PATHS = [
  '/login',
  '/manifest.webmanifest',
  '/sw.js',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.includes(pathname)) {
    return true;
  }
  if (pathname.startsWith('/auth/callback') || pathname.startsWith('/icons/') || pathname.startsWith('/api/auth/')) {
    return true;
  }
  return false;
}

export async function proxy(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 1) Update session via Supabase server client
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check dev session cookie first
  let user: { id: string; email?: string } | null = null;
  const devSessionCookie = req.cookies.get('sb-dev-session');
  if (devSessionCookie?.value) {
    try {
      user = JSON.parse(devSessionCookie.value);
    } catch {
      user = null;
    }
  }

  // Fallback to Supabase auth
  if (!user) {
    try {
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();
      user = supabaseUser;
    } catch {
      user = null;
    }
  }

  const pathname = req.nextUrl.pathname;
  const isPublic = isPublicPath(pathname);

  // 2) Unauthenticated user accessing private route → redirect to /login
  if (!user && !isPublic) {
    const loginUrl = new URL('/login', req.url);
    const candidateTarget = `${pathname}${req.nextUrl.search}`;
    const safeTarget = safeNext(candidateTarget);
    if (safeTarget !== '/') {
      loginUrl.searchParams.set('next', safeTarget);
    }
    const redirectRes = NextResponse.redirect(loginUrl);
    redirectRes.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return redirectRes;
  }

  // 3) Authenticated user visiting /login → redirect to next or /
  if (user && pathname === '/login') {
    const rawNext = req.nextUrl.searchParams.get('next');
    const safeTarget = safeNext(rawNext);
    const redirectRes = NextResponse.redirect(new URL(safeTarget, req.url));
    redirectRes.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return redirectRes;
  }

  // 4) Set Content-Security-Policy header
  const isDev = process.env.NODE_ENV !== 'production';
  const supabaseHost = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname;

  // In development, Next.js Turbopack and React error overlays require 'unsafe-eval'
  // for reconstructing callstacks and source maps. In production, strict nonce is enforced.
  const scriptSrc = isDev
    ? `'self' 'unsafe-eval' 'unsafe-inline' 'nonce-${nonce}'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'`;

  const connectSrc = isDev
    ? `'self' ws: wss: http: https: https://${supabaseHost} wss://${supabaseHost} https://*.ingest.sentry.io https://*.supabase.co wss://*.supabase.co`
    : `'self' https://${supabaseHost} wss://${supabaseHost} https://*.ingest.sentry.io https://*.supabase.co wss://*.supabase.co`;

  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https:;
    font-src 'self' data:;
    connect-src ${connectSrc};
    worker-src 'self' blob:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `
    .replace(/\s{2,}/g, ' ')
    .trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts/).*)'],
};
