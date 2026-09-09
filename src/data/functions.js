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
  // stripeWebhook is called by Stripe, never from the browser.
]);

export class FunctionNotPortedError extends Error {
  constructor(name) {
    super(
      `The "${name}" function has not been ported from base44 to Supabase yet, so this action cannot complete.`,
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
