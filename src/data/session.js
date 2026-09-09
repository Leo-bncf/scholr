import { supabase } from '@/lib/supabase';
import { maybeOne, one } from './_query';

/**
 * Identity and the current user's profile.
 *
 * base44 had a single `auth.me()` that returned identity and app fields
 * together. Supabase splits them: `auth.users` is GoTrue's (email, session),
 * `public.profiles` is ours (role, active_school_id, display_name...). Callers
 * almost always want the merged view, so `getCurrentUser` returns one object.
 */

const PROFILE_COLUMNS =
  'id, email, full_name, display_name, role, active_school_id, phone, avatar_url, email_preferences';

/** The GoTrue session, or null. Cheap — reads local storage, no network. */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function isAuthenticated() {
  return (await getSession()) !== null;
}

/**
 * The signed-in user merged with their profile row, or null if signed out.
 * Shaped to match what the old `base44.auth.me()` callers expect: a flat object
 * with `id`, `email`, `role`, `active_school_id`.
 */
export async function getCurrentUser() {
  const { data: authData, error } = await supabase.auth.getUser();
  if (error || !authData?.user) return null;

  const profile = await maybeOne(
    supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', authData.user.id),
    'getCurrentUser/profile',
  );

  // The profile is created by a trigger on auth.users, but a race on very first
  // login can beat it. Fall back to identity so the app renders rather than
  // crashing; UserProvider will reload.
  if (!profile) {
    return {
      id: authData.user.id,
      email: authData.user.email,
      role: 'user',
      active_school_id: null,
      _profileMissing: true,
    };
  }

  return { ...profile, email: profile.email ?? authData.user.email };
}

/**
 * Update the signed-in user's own profile.
 *
 * `role` and `active_school_id` are privilege-bearing: a trigger
 * (guard_profile_privileges) rejects a self-service role change outright, and
 * only allows switching to a school you belong to. Attempting either here will
 * throw rather than silently no-op.
 */
export async function updateMyProfile(patch) {
  const session = await getSession();
  if (!session) throw new Error('updateMyProfile: not signed in');

  return one(
    supabase
      .from('profiles')
      .update(patch)
      .eq('id', session.user.id)
      .select(PROFILE_COLUMNS),
    'updateMyProfile',
  );
}

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle(redirectTo = window.location.origin) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email, redirectTo) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

/**
 * Set a new password.
 *
 * Called after the user follows the emailed recovery link, which puts a
 * recovery session in place — so this is an ordinary update on the signed-in
 * user rather than a token exchange.
 *
 * base44 needed `requestPasswordReset` and `resetPassword` edge functions
 * because it minted and validated its own tokens. GoTrue does both natively, so
 * neither function was ported.
 */
export async function setPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/** Subscribe to sign-in/sign-out. Returns an unsubscribe function. */
export function onAuthChange(handler) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => handler(event, session));
  return () => data.subscription.unsubscribe();
}

/**
 * Send an unauthenticated visitor to sign in.
 *
 * base44 hosted its own login page and `auth.redirectToLogin(next)` bounced to
 * it. Supabase has no such page — the app renders its own — so this navigates
 * to the in-app route, preserving where the user was heading.
 */
export function redirectToLogin(next = window.location.pathname) {
  const target = next && next !== '/' ? `?next=${encodeURIComponent(next)}` : '';
  window.location.href = `/FirstLogin${target}`;
}
