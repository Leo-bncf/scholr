import { supabase } from '@/lib/supabase';

/**
 * Server-side functions.
 *
 * base44 exposed these as `base44.functions.invoke(name, body)`. Supabase Edge
 * Functions have the same shape, so this is a thin wrapper that normalises
 * errors and keeps the call sites free of transport detail.
 *
 * IMPORTANT: the 49 handlers are still being ported from base44 (they were
 * `Deno.serve` there too, so it's mostly swapping the client). Calling one that
 * hasn't been deployed yet throws a clear error rather than returning
 * undefined — see PORTED below.
 */

/**
 * Functions confirmed deployed to this Supabase project. Add a name here as it
 * goes live; anything not listed fails fast with an explanatory message
 * instead of a confusing network error.
 */
export const PORTED = new Set([
  'sendEmail',
  'sendInvitation',
  'acceptInvitation',
  'listAllUsers',
  'removeSchoolMember',
  'updateClassStatus',
  'superAdminDeleteUser',
  'adminUpdateUser',
  'createAccountFromInvitation',
  'createCheckoutSession',
  'createCustomerPortalSession',
  'verifyGoogleConnection',
  'deploymentReady',
  'exportReportPDF',
  // stripeWebhook is called by Stripe, never from the browser.
]);

/**
 * Why the still-unported functions are stuck. Everything here is a real
 * configuration or semantic blocker — none of these can be made true with code
 * alone, so they are surfaced rather than faked.
 */
const BLOCKERS = {
  getGooglePickerToken:
    'It needs Google Workspace OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and a refresh token) in the edge runtime to mint a Picker token — those are unset, so there is no access token to hand the Picker.',
  googleDrivePicker:
    'It needs Google Workspace OAuth credentials in the edge runtime to call the Drive API for file metadata — those are unset.',
  googleDocsCreate:
    'It needs Google Workspace OAuth credentials in the edge runtime to create files in Drive — those are unset.',
  seedDemoData:
    'It seeds a whole demo school including real auth accounts; the base44 spec predates the current schema (memberships now require a profiles row per user, and subjects use text ib_group codes), so it cannot be reconstructed 1:1 from the repo. The sanctioned path is scripts/seed-dev-school.sh on the server.',
  seedSchoolDemoData:
    'It creates demo memberships, which require real profiles/auth users in the current schema (school_memberships.user_id → profiles.id). base44 auto-provisioned users; porting it means provisioning auth users too. The sanctioned path is scripts/seed-dev-school.sh on the server.',
  clearSchoolDemoData:
    'It pairs with seedSchoolDemoData (safe deletion of [Demo]-tagged rows only), which is itself blocked on the demo-user provisioning above.',
  generateReport:
    'It aggregates grades/attendance/behaviour/IB records into `reports` rows. No current UI calls it, and base44\'s version predates the current schema, so it is a real (but deferred) port, not a config blocker.',
  productionLaunchSign:
    'base44\'s spec returned hardcoded launch status. There is no sign-off storage or real check behind it in the current schema, so a truthful port needs an agreed data model first. The only caller (ProductionLaunch.jsx) is not routed to any page.',
};

export class FunctionNotPortedError extends Error {
  constructor(name) {
    super(
      `The "${name}" function has not been ported from base44 to Supabase yet, so this action cannot complete.` +
        (BLOCKERS[name] ? ` ${BLOCKERS[name]}` : ''),
    );
    this.name = 'FunctionNotPortedError';
    this.functionName = name;
  }
}

/**
 * Invoke an edge function.
 *
 * Returns the parsed body directly.
 *
 * base44 wrapped responses in `{ data }`, so its call sites read
 * `result.data.success`. Against this function that reads `undefined` and
 * silently takes the failure branch — every one of those was unwrapped during
 * the migration. Don't reintroduce the envelope.
 */
export async function invoke(name, body = {}) {
  if (!PORTED.has(name)) throw new FunctionNotPortedError(name);

  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const err = new Error(`${name}: ${error.message}`);
    err.cause = error;
    // Supabase surfaces the handler's own response on the error for non-2xx.
    err.status = error.context?.status;
    throw err;
  }
  return data;
}

/** True when a function is available, for hiding UI that would only fail. */
export function isAvailable(name) {
  return PORTED.has(name);
}
