import Stripe from 'npm:stripe@17';
import { fromRequest, hasSchoolRole, isSuperAdmin } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, forbidden, badRequest } from '../_shared/http.ts';

/**
 * Open Stripe's billing portal so a school admin can manage their own payment
 * method, invoices and cancellation.
 */

const SECRET = Deno.env.get('STRIPE_SECRET_KEY');
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://scholr.pro';

Deno.serve(
  handler(async (req) => {
    if (!SECRET) {
      return json(req, { error: 'Billing is not configured (STRIPE_SECRET_KEY missing).' }, 503);
    }

    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req);

    const { schoolId } = await readJsonBody<{ schoolId?: string }>(req);
    if (!schoolId) return badRequest(req, '`schoolId` is required.');

    const allowed = isSuperAdmin(caller) || (await hasSchoolRole(caller, schoolId, ['school_admin']));
    if (!allowed) {
      return forbidden(req, 'Only a school admin can manage billing for this school.');
    }

    const { data: school } = await caller.admin
      .from('schools')
      .select('id, stripe_customer_id')
      .eq('id', schoolId)
      .maybeSingle();

    if (!school?.stripe_customer_id) {
      // No customer means they've never checked out — sending them to the
      // portal would 500 in Stripe; point them at checkout instead.
      return badRequest(req, 'This school has no billing account yet. Start a subscription first.');
    }

    const stripe = new Stripe(SECRET, { apiVersion: '2024-12-18.acacia' });
    const session = await stripe.billingPortal.sessions.create({
      customer: school.stripe_customer_id,
      return_url: `${SITE_URL}/SchoolAdminBilling`,
    });

    return json(req, { url: session.url });
  }),
);
