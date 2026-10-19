import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ============================================================================
// Supabase & App Session Middleware
// - Refreshes auth sessions
// - Protects owner routes (/dashboard, /services, /availability, /bookings, /settings, /onboarding)
// - Redirects authenticated users away from /login and /signup
// ============================================================================

const LOCAL_SESSION_COOKIE = 'nsg_dev_session';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/services') ||
    pathname.startsWith('/availability') ||
    pathname.startsWith('/bookings') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/onboarding');

  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/signup';

  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
  );

  let isAuthenticated = false;

  if (hasSupabase) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              );
              supabaseResponse = NextResponse.next({
                request,
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      isAuthenticated = Boolean(user);
    } catch (err) {
      console.warn('Middleware Supabase session check error:', err);
    }
  }

  // Check fallback dev session if Supabase wasn't used or had no user
  if (!isAuthenticated) {
    const devCookie = request.cookies.get(LOCAL_SESSION_COOKIE)?.value;
    if (devCookie) {
      try {
        const parsed = JSON.parse(devCookie);
        if (parsed?.id) {
          isAuthenticated = true;
        }
      } catch {
        // invalid cookie
      }
    }
  }

  // 1. Unauthenticated user trying to access protected route -> redirect to /login
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Authenticated user trying to access /login or /signup -> redirect to /dashboard
  if (isAuthRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
