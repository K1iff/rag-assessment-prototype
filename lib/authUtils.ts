export type UserRole = 'learner' | 'faculty' | 'admin';

export const ROLE_HOME_MAP: Record<UserRole, string> = {
  learner: '/learner',
  faculty: '/faculty',
  admin: '/admin',
};

export function getRoleHome(role: UserRole): string {
  return ROLE_HOME_MAP[role] || '/login';
}

/**
 * Normalizes various role representations (names, synonyms, and numeric IDs)
 * to one of the strict canonical role types: 'learner' | 'faculty' | 'admin'.
 */
export function normalizeRole(raw: unknown): UserRole | null {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === 'number') {
    if (raw === 1) return 'learner';
    if (raw === 2) return 'faculty';
    if (raw === 3) return 'admin';
    return null;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '1') return 'learner';
    if (trimmed === '2') return 'faculty';
    if (trimmed === '3') return 'admin';

    const lower = trimmed.toLowerCase();
    if (
      lower === 'learner' ||
      lower === 'student' ||
      lower.includes('learner') ||
      lower.includes('student') ||
      lower.includes('reviewer')
    ) {
      return 'learner';
    }

    if (
      lower === 'faculty' ||
      lower === 'teacher' ||
      lower.includes('faculty') ||
      lower.includes('teacher') ||
      lower.includes('instructor')
    ) {
      return 'faculty';
    }

    if (
      lower === 'admin' ||
      lower.includes('admin') ||
      lower.includes('administrator')
    ) {
      return 'admin';
    }
  }

  return null;
}

export interface RawSessionData {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  user?: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
    app_metadata?: Record<string, any>;
  };
}

/**
 * Parses raw or base64-encoded cookie session strings safely.
 */
export function parseSessionCookieValue(raw: string): RawSessionData | null {
  if (!raw) return null;
  let decoded = raw;

  if (decoded.startsWith('base64-')) {
    try {
      decoded = Buffer.from(decoded.slice(7), 'base64url').toString('utf8');
    } catch {
      return null;
    }
  }

  try {
    return JSON.parse(decoded);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(decoded));
    } catch {
      return null;
    }
  }
}

/**
 * Extracts and reconstructs session data from single or chunked Supabase auth cookies.
 */
export function extractSessionFromCookies(
  cookiesList: { name: string; value: string }[]
): RawSessionData | null {
  // 1. Single cookie pattern: sb-<projectRef>-auth-token
  const single = cookiesList.find(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );
  if (single && single.value) {
    const parsed = parseSessionCookieValue(single.value);
    if (parsed && (parsed.access_token || parsed.user)) {
      return parsed;
    }
  }

  // 2. Chunked cookies pattern: sb-<projectRef>-auth-token.0, sb-<projectRef>-auth-token.1, etc.
  const chunks = cookiesList
    .filter((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token.'))
    .sort((a, b) => {
      const idxA = parseInt(a.name.split('-auth-token.')[1] || '0', 10);
      const idxB = parseInt(b.name.split('-auth-token.')[1] || '0', 10);
      return idxA - idxB;
    });

  if (chunks.length > 0) {
    const combined = chunks.map((c) => c.value).join('');
    const parsed = parseSessionCookieValue(combined);
    if (parsed && (parsed.access_token || parsed.user)) {
      return parsed;
    }
  }

  return null;
}

