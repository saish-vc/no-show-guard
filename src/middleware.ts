import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// ============================================================================
// Next.js Middleware
// Runs on every matched request to keep the Supabase auth session alive
// and protect dashboard routes.
// ============================================================================

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public assets (svg, png, jpg, etc.)
     * - API cron routes (authenticated via CRON_SECRET)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/cron).*)',
  ],
};
