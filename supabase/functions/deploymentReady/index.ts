import { fromRequest, serviceClient, isSuperAdmin } from '../_shared/client.ts';
import { handler, json, unauthorized, forbidden } from '../_shared/http.ts';

/**
 * Platform deployment readiness.
 *
 * base44 returned a static checklist wearing a "checked" coat. This one is
 * real: it inspects the runtime environment the edge functions actually run in
 * and pings the database through the same PostgREST path the app uses, then
 * reports pass/fail per area. Nothing is hardcoded green.
 *
 * The checks deliberately mirror what the deployed functions consume:
 *
 *   SMTP  → sendEmail  (supabase/functions/sendEmail)
 *   Stripe→ createCheckoutSession / createCustomerPortalSession / stripeWebhook
 *   Google→ the Drive/Docs functions (still behind Google OAuth credentials)
 *
 * `readyForDeployment` is false while any SMTP/Stripe/database check fails;
 * Google and NODE_ENV failures are reported as warnings because the features
 * they gate (Google attachments) are product-level, not go-live blockers.
 */

const SMTP_PLACEHOLDERS = ['supabase-mail', 'fake_mail_user', 'fake_mail_password', 'admin@example.com'];
const STRIPE_KEYS = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
const GOOGLE_KEYS = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'];
const ENV_KEYS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];

interface Checkish {
  name: string;
  status: string;
  [key: string]: unknown;
}

function envPresenceCheck(keys: string[], name: string): Checkish {
  const check: Checkish = { name, status: 'pass', missing: [] as string[] };
  for (const key of keys) {
    if (!Deno.env.get(key)) {
      check.status = 'fail';
      (check.missing as string[]).push(key);
    }
  }
  return check;
}

function smtpCheck(): Checkish {
  const check: Checkish = { name: 'Transactional email (SMTP)', status: 'pass', missing: [] as string[] };
  for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']) {
    const value = Deno.env.get(key);
    if (!value || SMTP_PLACEHOLDERS.includes(value)) {
      check.status = 'fail';
      (check.missing as string[]).push(key);
    }
  }
  return check;
}

Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req);
    if (!isSuperAdmin(caller)) {
      return forbidden(req, 'Deployment readiness is a super-admin check.');
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const checks: Record<string, unknown> = {};

    const environment = envPresenceCheck(ENV_KEYS, 'Environment configuration');
    checks.environment = environment;
    if (environment.status !== 'pass') {
      errors.push(`Missing critical environment variables: ${environment.missing.join(', ')}`);
    }

    const smtp = smtpCheck();
    checks.smtp = smtp;
    if (smtp.status !== 'pass') {
      errors.push(
        'Email cannot send: SMTP_HOST/SMTP_USER/SMTP_PASS are unset or still Supabase placeholders. Set them in /opt/supabase/docker/.env.',
      );
    }

    const stripe = envPresenceCheck(STRIPE_KEYS, 'Billing (Stripe)');
    checks.stripe = stripe;
    if (stripe.status !== 'pass') {
      errors.push(`Stripe is not configured: missing ${stripe.missing.join(', ')}.`);
    }

    for (const key of ['STRIPE_PRICE_ID_STARTER', 'STRIPE_PRICE_ID_GROWTH', 'STRIPE_PRICE_ID_ENTERPRISE']) {
      if (!Deno.env.get(key)) {
        warnings.push(`${key} is unset; createCheckoutSession will fall back to its default price.`);
      }
    }

    const google = envPresenceCheck(GOOGLE_KEYS, 'Google Drive / Docs');
    checks.google = google;
    if (google.status !== 'pass') {
      warnings.push(
        `Google Drive/Docs credentials are not set: ${google.missing.join(', ')}. Google attachments stay disabled.`,
      );
    }

    const nodeEnv = Deno.env.get('NODE_ENV');
    if (nodeEnv && nodeEnv !== 'production') {
      warnings.push(`NODE_ENV is "${nodeEnv}"; set it to "production" before go-live.`);
    }
    checks.nodeEnvironment = { name: 'Node environment', value: nodeEnv ?? '(unset, defaults to production)', status: 'pass' };

    // Real connectivity probe through PostgREST, the same path the app uses.
    const db = await serviceClient()
      .from('schools')
      .select('id')
      .limit(1);
    if (db.error) {
      checks.database = { name: 'Database connectivity', status: 'fail', error: db.error.message };
      errors.push(`Database probe failed: ${db.error.message}`);
    } else {
      checks.database = { name: 'Database connectivity', status: 'pass' };
    }

    const readyForDeployment = errors.length === 0;

    return json(req, {
      timestamp: new Date().toISOString(),
      userEmail: caller.user.email,
      checks,
      readyForDeployment,
      warnings,
      errors,
    });
  }),
);