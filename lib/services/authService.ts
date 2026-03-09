import { getCurrentUser as getServerCurrentUser, type CurrentUser } from '@/lib/infra/supabase/currentUser';

/**
 * Application-layer wrapper for auth functions.
 * UI server components import from here — never from infra directly.
 */
export { type CurrentUser };

export const getCurrentUser = getServerCurrentUser;

export async function requireCurrentUser() {
  try {
    const current = await getServerCurrentUser();
    return current ?? null;
  } catch (_err) {
    return null;
  }
}

export async function isAdminUser() {
  const cur = await requireCurrentUser();
  return Boolean(cur?.profile?.role === 'admin');
}

export async function requireAdmin() {
  const cur = await requireCurrentUser();
  if (!cur || cur.profile?.role !== 'admin') {
    return null;
  }
  return cur;
}

export async function requireCustomer() {
  const cur = await requireCurrentUser();
  if (!cur) return null;
  // allow admin for convenience in certain flows
  const role = cur?.profile?.role;
  if (role && role !== 'customer' && role !== 'admin') return null;
  return cur;
}
