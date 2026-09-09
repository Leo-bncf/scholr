import Stripe from 'npm:stripe@17';
import { fromRequest, hasSchoolRole, isSuperAdmin } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, forbidden, badRequest } from '../_shared/http.ts';

/**
 * Start a Stripe Checkout session for a school's subscription.
 *
 * Pricing is per student per year. The price IDs were hardcoded in the base44
 * version, which meant changing a price required a code deploy and made test
 * and live mode impossible to separate — they come from the environment now,
 * with the existing IDs as fallback so nothing breaks before they're set.
 */

const SECRET = Deno.env.get('STRIPE_SECRET_KEY');
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://scholr.pro';

const PRICE_IDS: Record<string, string | undefined> = {
  starter: Deno.env.get('STRIPE_PRICE_ID_STARTER') ?? 'price_1TCqN7BCrwoLhJNy0ZUAckNW',
  growth: Deno.env.get('STRIPE_PRICE_ID_GROWTH') ?? 'price_1TCqN7BCrwoLhJNydURe3Oyz',
  enterprise: Deno.env.get('STRIPE_PRICE_ID_ENTERPRISE') ?? 'price_1TCqN7BCrwoLhJNyELaRhBGI',
};

interface Payload {
  schoolId?: string;
  plan?: string;
  quantity?: number;
}

Deno.serve(
  handler(async (req) => {
    if (!SECRET) {
      return json(req, { error: 'Billing is not configured (STRIPE_SECRET_KEY missing).' }, 503);
    }

    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req);

    const { schoolId, plan, quantity } = await readJsonBody<Payload>(req);
    if (!schoolId || !plan) return badRequest(req, '`schoolId` and `plan` are required.');

    const priceId = PRICE_IDS[plan];
    if (!priceId) return badRequest(req, `"${plan}" is not a plan you can subscribe to.`);

    const allowed = isSuperAdmin(caller) || (await hasSchoolRole(caller, schoolId, ['school_admin']));
    if (!allowed) {
      return forbidden(req, 'Only a school admin can start a subscription for this school.');
    }

    const { data: school } = await caller.admin
      .from('schools')
      .select('id, name, email, billing_email, max_students, stripe_customer_id')
      .eq('id', schoolId)
      .maybeSingle();
    if (!school) return json(req, { error: 'No such school.' }, 404);

    const stripe = new Stripe(SECRET, { apiVersion: '2024-12-18.acacia' });

    // Reuse the customer so a school doesn't accumulate duplicates in Stripe.
    let customerId = school.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: school.name,
        email: school.billing_email ?? school.email ?? caller.user.email ?? undefined,
        metadata: { school_id: school.id },
      });
      customerId = customer.id;
      await caller.admin
        .from('schools')
        .update({ stripe_customer_id: customerId })
        .eq('id', school.id);
    }

    // Seats default to the school's purchased student count; Stripe requires
    // at least one.
    const seats = Math.max(1, quantity ?? school.max_students ?? 1);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: seats }],
      success_url: `${SITE_URL}/SchoolAdminBilling?success=true`,
      cancel_url: `${SITE_URL}/SchoolAdminBilling?canceled=true`,
      // Echoed back on the webhook, which is how we know which school paid.
      metadata: { school_id: school.id, plan },
      subscription_data: { metadata: { school_id: school.id, plan } },
    });

    return json(req, { url: session.url, sessionId: session.id });
  }),
);
