import * as fns from './functions';

/**
 * Transactional email.
 *
 * base44 provided `integrations.Core.SendEmail` as a managed service. There is
 * no browser-side equivalent here, and there shouldn't be: sending mail needs
 * SMTP credentials, which must never reach the client. So this goes through an
 * edge function holding those credentials server-side.
 *
 * The `sendEmail` function is not deployed yet (Phase 4), so calls throw a
 * clear FunctionNotPortedError rather than failing silently. Callers should
 * surface that to the user — an invitation that appears to send but doesn't is
 * worse than a visible error.
 */

/**
 * @param {object} message
 * @param {string} message.to           recipient address
 * @param {string} message.subject
 * @param {string} message.body         HTML body
 * @param {string} [message.fromName]   display name for the sender
 * @param {string} [message.replyTo]
 */
export function send({ to, subject, body, fromName, replyTo }) {
  if (!to) throw new Error('email.send: `to` is required');
  if (!subject) throw new Error('email.send: `subject` is required');

  return fns.invoke('sendEmail', {
    to,
    subject,
    body,
    from_name: fromName,
    reply_to: replyTo,
  });
}

/** Whether email can currently be sent, for disabling UI that would only fail. */
export function isAvailable() {
  return fns.isAvailable('sendEmail');
}
