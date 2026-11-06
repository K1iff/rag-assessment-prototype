import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import {
  UserRole,
  RawSessionData,
  normalizeRole,
  getRoleHome,
  extractSessionFromCookies,
} from './authUtils';

export { getRoleHome, normalizeRole };
export type { UserRole, RawSessionData };

/**
 * Server-side session and role resolver for Next.js App Router server components.
 * Reads cookies, verifies session, and determines user role via metadata, cookie,
 * or database lookup in the Users table.
 */
export async function getServerSessionAndRole(): Promise<{
  session: RawSessionData | null;
  user: RawSessionData['user'] | null;
  role: UserRole | null;
}> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const session = extractSessionFromCookies(allCookies);

  if (!session || !session.user) {
    return { session: null, user: null, role: null };
  }

  // Check if session has expired
  if (session.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    // Allow a small 60-second window before declaring expired
    if (session.expires_at < now - 60) {
      return { session: null, user: null, role: null };
    }
  }

  // 1. Inspect metadata within the session token
  const metadataRole =
    session.user.user_metadata?.role ||
    session.user.app_metadata?.role ||
    session.user.user_metadata?.role_id ||
    session.user.app_metadata?.role_id;

  let role = normalizeRole(metadataRole);
  if (role) {
    return { session, user: session.user, role };
  }

  // 2. Check the user-role cookie
  const roleCookie =
    cookieStore.get('user-role')?.value ||
    cookieStore.get('user_role')?.value;

  if (roleCookie) {
    role = normalizeRole(roleCookie);
    if (role) {
      return { session, user: session.user, role };
    }
  }

  // 3. Server-side database lookup in Users table
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serverKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && serverKey) {
      const serverClient = createClient(supabaseUrl, serverKey, {
        auth: { persistSession: false },
      });

      const { data, error } = await serverClient
        .from('Users')
        .select('role_id')
        .eq('user_id', session.user.id)
        .single();

      if (!error && data?.role_id) {
        role = normalizeRole(data.role_id);
        if (role) {
          return { session, user: session.user, role };
        }
      }
    }
  } catch {
    // Non-blocking in isolated or test environments
  }

  return { session, user: session.user, role: null };
}

