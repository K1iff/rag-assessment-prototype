import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  extractSessionFromCookies,
  normalizeRole,
  getRoleHome,
  UserRole,
} from './lib/authUtils';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals, static assets, and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Identify mapped routes for each group
  const isLearnerRoute = pathname.startsWith('/learner') || pathname === '/home';
  const isFacultyRoute =
    !pathname.startsWith('/learner') &&
    (pathname.startsWith('/faculty') ||
      pathname.startsWith('/blueprint') ||
      pathname.startsWith('/exams'));
  const isAdminRoute = pathname.startsWith('/admin');
  const isProtectedRoute = isLearnerRoute || isFacultyRoute || isAdminRoute;
  const isLoginOrRoot = pathname === '/login' || pathname === '/';

  // Extract session from cookies
  const session = extractSessionFromCookies(request.cookies.getAll());
  const isSessionExpired = session?.expires_at
    ? session.expires_at < Math.floor(Date.now() / 1000) - 60
    : false;
  const isAuthenticated = Boolean(session && session.user && !isSessionExpired);

  // 1. Unauthenticated Guests
  if (!isAuthenticated) {
    if (isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2. Authenticated Users: Resolve Role
  let role: UserRole | null = normalizeRole(
    session?.user?.user_metadata?.role ||
      session?.user?.app_metadata?.role ||
      session?.user?.user_metadata?.role_id ||
      session?.user?.app_metadata?.role_id
  );

  // Fallback to user-role cookie if metadata didn't have it
  if (!role) {
    const roleCookie =
      request.cookies.get('user-role')?.value ||
      request.cookies.get('user_role')?.value;
    if (roleCookie) {
      role = normalizeRole(roleCookie);
    }
  }

  // Fallback to direct DB lookup via REST if not cached
  if (!role && process.env.NEXT_PUBLIC_SUPABASE_URL && session?.user?.id) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        '';
      const res = await fetch(
        `${supabaseUrl}/rest/v1/Users?user_id=eq.${session.user.id}&select=role_id`,
        {
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${session.access_token || apiKey}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.role_id) {
          role = normalizeRole(data[0].role_id);
        }
      }
    } catch {
      // Non-blocking in isolated or test mode
    }
  }

  const targetHome = role ? getRoleHome(role) : null;

  // 3. Entry Route Redirect for Already Authenticated Users
  if (isLoginOrRoot && targetHome) {
    if (pathname !== targetHome) {
      const url = request.nextUrl.clone();
      url.pathname = targetHome;
      return NextResponse.redirect(url);
    }
  }

  // 4. Role-based Route Protection
  if (role === 'learner') {
    if (isFacultyRoute || isAdminRoute) {
      if (pathname !== '/learner') {
        const url = request.nextUrl.clone();
        url.pathname = '/learner';
        return NextResponse.redirect(url);
      }
    }
    if (pathname === '/home') {
      const url = request.nextUrl.clone();
      url.pathname = '/learner';
      return NextResponse.redirect(url);
    }
  } else if (role === 'faculty') {
    if (isLearnerRoute || isAdminRoute) {
      if (pathname !== '/faculty') {
        const url = request.nextUrl.clone();
        url.pathname = '/faculty';
        return NextResponse.redirect(url);
      }
    }
  } else if (role === 'admin') {
    if (isLearnerRoute || isFacultyRoute) {
      if (pathname !== '/admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }
    }
  }

  // Sync role cookie for fast subsequent checks
  const response = NextResponse.next();
  if (role && request.cookies.get('user-role')?.value !== role) {
    response.cookies.set('user-role', role, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
      secure: true,
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
