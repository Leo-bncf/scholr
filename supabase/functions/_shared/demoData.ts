import { SERVICE_ROLE_KEY } from './client.ts';

/** Wait before the next attempt. Timers are real in Deno; the mock test
 * harness swaps the beat so tests don't actually sleep. */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const DEMO_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,30}[a-z0-9]$/;

/** Lowercase, shell-safe variant of a school slug for building demo emails. */
export function demoEmailDomain(schoolSlug: string): string {
  const slug = schoolSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  if (!DEMO_SLUG_RE.test(slug)) {
    throw new Error('This school has no usable slug, so demo accounts cannot be named.');
  }
  return `demo.${slug}.scholr.pro`;
}

/** A replacement password in the same shape Conor's demo accounts use:
 * leetspeak word + digits + symbol? No — the real pattern is
 * mixed-case alphanumerics plus one trailing symbol. */
export function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const out = new Uint8Array(16);
  crypto.getRandomValues(out);
  let p = '';
  for (const b of out) p += chars[b % chars.length];
  return `${p}!`;
}

/**
 * Return (or create) an auth account for a tagged demo role at a school, and
 * guarantee it can be signed into.
 *
 *   - Never touches an account that belongs to a real person. If one exists
 *     whose email matches but has a non-demo membership at any school, this
 *     throws rather than silently taking it over.
 *   - Idempotent: on a re-run it re-issues a fresh password (service role can
 *     always reset it) and returns the same user id.
 *   - Fresh accounts are created through GoTrue's admin API so they carry the
 *     fields GoTrue requires; they pick up their profile via the normal
 *     on_auth_user_created trigger.
 */
export async function ensureDemoUser(
  admin: import('./client.ts').Caller['admin'],
  args: {
    schoolId: string;
    schoolSlug: string;
    role: 'ib_coordinator' | 'teacher' | 'student' | 'parent';
    name: string;
    password: string;
  },
): Promise<{ userId: string; email: string }> {
  const email = `demo.${args.role}@${demoEmailDomain(args.schoolSlug)}`;
  const metadata = { full_name: args.name };

  const { data: existing } = await admin
    .from('profiles')
    .select('id, active_school_id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    // Are we allowed to reuse it? Only if it has no real memberships.
    const { count, error: mc } = await admin
      .from('school_memberships')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'pending', 'inactive'])
      .or(`user_id.eq.${existing.id}`);
    if (mc || (count ?? 0) > 0) {
      throw new Error(
        `${email} is in use by a real account — refusing to touch it.`,
      );
    }
    const { error: pw } = await admin.auth.admin.updateUserById(existing.id, {
      password: args.password,
      user_metadata: metadata,
    });
    if (pw) throw new Error(`updateUser ${email}: ${pw.message}`);
    return { userId: existing.id, email };
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: args.password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);

  // The trigger makes the profile row; wait for it so we can finish seeding.
  for (let i = 0; i < 20; i++) {
    const { data } = await admin
      .from('profiles')
      .select('id')
      .eq('id', created.user!.id)
      .maybeSingle();
    if (data) return { userId: data.id, email };
    await sleep(250);
  }
  throw new Error(`Profile for ${email} never appeared — is the trigger healthy?`);
}
