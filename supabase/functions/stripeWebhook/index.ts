import Stripe from 'npm:stripe@17';
import { serviceClient } from '../_shared/client.ts';

/**
 * Stripe webhook: keep each school's billing state in step with Stripe.
 *
 * Called by Stripe, not by a browser — so no CORS, no session, and crucially
 * NOT the shared readJsonBody helper: signature verification needs the exact
 * raw bytes, and any reparsing would invalidate it.
 *
 * The signature IS the authentication here. Without STRIPE_WEBHOOK_SECRET set,
 * anyone who finds the URL could post fake "payment succeeded" events, so the
 * handler refuses to run rather than trusting unverified input.
 *
 * Public URL: https://api.scholr.pro/functions/v1/stripeWebhook
 */

const SECRET = Deno.env.get('STRIPE_SECRET_KEY');
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

/** Stripe subscription status -> the school's billing_status. */
const STATUS_MAP: Record<string, string> = {
  active: 'active',
  trialing: 'trial',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'unpaid',
  incomplete: 'incomplete',
  incomplete_expired: 'canceled',
};

Deno.serve(async (req) => {
  if (!SECRET || !WEBHOOK_SECRET) {
    console.error('Stripe webhook called but STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET are unset.');
    return new Response(JSON.stringify({ error: 'Webhook not configured' }), { status: 503 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 400 });

  const stripe = new Stripe(SECRET, { apiVersion: '2024-12-18.acacia' });
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Signature verification failed:', (err as Error).message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  const admin = serviceClient();

  /** Find the school this event belongs to, by metadata or customer id. */
  async function resolveSchoolId(
    metadata: Record<string, string> | null | undefined,
    customerId: string | null | undefined,
  ): Promise<string | null> {
    if (metadata?.school_id) return metadata.school_id;
    if (!customerId) return null;
    const { data } = await admin
      .from('schools')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    return data?.id ?? null;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const schoolId = await resolveSchoolId(
          session.metadata as Record<string, string>,
          session.customer as string,
        );
        if (!schoolId) break;

        await admin
          .from('schools')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            billing_status: 'active',
            status: 'active',
            ...(session.metadata?.plan ? { plan: session.metadata.plan } : {}),
          })
          .eq('id', schoolId);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const schoolId = await resolveSchoolId(
          sub.metadata as Record<string, string>,
          sub.customer as string,
        );
        if (!schoolId) break;

        await admin
          .from('schools')
          .update({
            stripe_subscription_id: sub.id,
            billing_status: STATUS_MAP[sub.status] ?? sub.status,
            subscription_current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            subscription_cancel_at_period_end: sub.cancel_at_period_end,
          })
          .eq('id', schoolId);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const schoolId = await resolveSchoolId(
          sub.metadata as Record<string, string>,
          sub.customer as string,
        );
        if (!schoolId) break;

        // Suspend rather than delete: the school's data stays intact so they
        // can come back, and an accidental cancellation isn't destructive.
        await admin
          .from('schools')
          .update({ billing_status: 'canceled', status: 'suspended' })
          .eq('id', schoolId);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const schoolId = await resolveSchoolId(null, invoice.customer as string);
        if (!schoolId) break;
        await admin
          .from('schools')
          .update({ billing_status: 'active', status: 'active' })
          .eq('id', schoolId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const schoolId = await resolveSchoolId(null, invoice.customer as string);
        if (!schoolId) break;
        // Flag it, but don't suspend — Stripe retries, and cutting a school off
        // over one failed card would be worse than a few days of grace.
        await admin.from('schools').update({ billing_status: 'past_due' }).eq('id', schoolId);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    await admin.from('audit_logs').insert({
      action: `stripe.${event.type}`,
      entity_type: 'billing',
      entity_id: event.id,
      details: { type: event.type },
      level: 'info',
    });
  } catch (err) {
    // Return 500 so Stripe retries rather than treating a transient failure as
    // delivered and dropping the event.
    console.error('Webhook handling failed:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
