// denomailer, pinned — the same client Schedual uses on this runtime.
// (`jsr:@denodrivers/smtp` does not exist; importing it makes the isolate hang
// at cold start and the gateway returns a 503 connection timeout.)
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import { fromRequest } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, badRequest } from '../_shared/http.ts';

/**
 * Transactional email.
 *
 * base44 provided this as a managed integration callable straight from the
 * browser. Here it must be server-side: sending needs SMTP credentials, and
 * anything the browser holds is public.
 *
 * Deliberately restricted to signed-in callers. An open email endpoint is an
 * open relay — someone would find it and use your domain to send spam.
 */

const SMTP_HOST = Deno.env.get('SMTP_HOST');
const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') ?? '587');
const SMTP_USER = Deno.env.get('SMTP_USER');
const SMTP_PASS = Deno.env.get('SMTP_PASS');
const SMTP_FROM = Deno.env.get('SMTP_ADMIN_EMAIL') ?? SMTP_USER;
const SENDER_NAME = Deno.env.get('SMTP_SENDER_NAME') ?? 'Scholr';

interface Payload {
  to?: string;
  subject?: string;
  body?: string;
  from_name?: string;
  reply_to?: string;
}

Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req, 'Sign in to send email.');

    // A fresh Supabase .env ships placeholder SMTP values that point at a mail
    // container this stack doesn't run. Left unchecked, the send hangs and then
    // fails as a 502 that looks like a broken mail server rather than an
    // unconfigured one.
    const PLACEHOLDERS = ['supabase-mail', 'fake_mail_user', 'fake_mail_password', 'admin@example.com'];
    const unconfigured =
      !SMTP_HOST || !SMTP_USER || !SMTP_PASS ||
      PLACEHOLDERS.includes(SMTP_HOST) ||
      PLACEHOLDERS.includes(SMTP_USER) ||
      PLACEHOLDERS.includes(SMTP_PASS);

    if (unconfigured) {
      return json(
        req,
        {
          error:
            'Email is not configured on this server yet — SMTP_HOST/USER/PASS in /opt/supabase/docker/.env are still the Supabase defaults.',
          code: 'smtp_not_configured',
        },
        503,
      );
    }

    const { to, subject, body, from_name, reply_to } = await readJsonBody<Payload>(req);

    if (!to || !subject || !body) {
      return badRequest(req, '`to`, `subject` and `body` are all required.');
    }
    // Basic shape check; the SMTP server is the real authority.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return badRequest(req, `"${to}" is not a valid email address.`);
    }

    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        // 465 is implicit TLS; 587 upgrades via STARTTLS, which denomailer
        // handles when tls is false.
        tls: SMTP_PORT === 465,
        auth: { username: SMTP_USER, password: SMTP_PASS },
      },
    });

    try {
      await client.send({
        from: `${from_name ?? SENDER_NAME} <${SMTP_FROM}>`,
        to,
        subject,
        content: 'auto',
        html: body,
        ...(reply_to ? { replyTo: reply_to } : {}),
      });
    } catch (err) {
      console.error('SMTP send failed:', err);
      return json(req, { error: `Could not send the email: ${(err as Error).message}` }, 502);
    } finally {
      await client.close().catch(() => {});
    }

    // Who sent what, for the audit trail. Best-effort: a logging failure must
    // not make a delivered email look like a failure.
    await caller.admin
      .from('audit_logs')
      .insert({
        user_id: caller.user.id,
        user_email: caller.user.email,
        action: 'email.sent',
        entity_type: 'email',
        details: { to, subject },
        level: 'info',
      })
      .then(undefined, (e: unknown) => console.error('audit log failed', e));

    return json(req, { sent: true, to });
  }),
);
