import { fromRequest } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, badRequest } from '../_shared/http.ts';

/**
 * Report the recorded Google Drive connection state for a user.
 *
 * Everything this does is a read (plus one honest status transition) against
 * the `google_connections` table, so it needs no Google credentials. Refresh
 * and reconnect need real Google OAuth credentials this deployment does not
 * have — until they are set, this function tells the truth about the stored
 * row: connected / expired / disconnected, never "yes" when there is no token.
 *
 * RLS on google_connections exposes only `user_id = auth.uid()`, so reading
 * through the caller's client both scopes the lookup to the caller and lets
 * Postgres, not this code, decide who may see whose connection.
 */

interface Payload {
  schoolId?: string;
  userId?: string;
}

const RECONNECT_URL = '/reconnect-google';

Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req);

    const { schoolId, userId } = await readJsonBody<Payload>(req);
    if (!schoolId) return badRequest(req, '`schoolId` is required.');

    const { data: rows, error } = await caller.supabase
      .from('google_connections')
      .select(
        'id, user_id, status, google_email, token_expiry, last_verified_at, last_error, error_code, reconnection_required, failed_action, created_at',
      )
      .eq('school_id', schoolId)
      .eq('user_id', userId ?? caller.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return json(req, { status: 'error', message: error.message }, 500);
    }

    const row = rows?.[0];
    if (!row) {
      return json(req, {
        status: 'disconnected',
        message: 'Google account not connected',
        requiresConnection: true,
        actionUrl: null,
      });
    }

    // Expired means the stored token expiry has passed. This only records the
    // fact; producing a fresh token is out of scope until Google OAuth
    // credentials exist in this runtime.
    if (row.status === 'connected' && row.token_expiry && new Date(row.token_expiry) < new Date()) {
      await caller.supabase
        .from('google_connections')
        .update({
          status: 'expired',
          error_code: 'token_expired',
          last_error: 'Access token has expired',
          reconnection_required: true,
        })
        .eq('id', row.id);

      return json(req, {
        status: 'expired',
        message: 'Your Google connection has expired. Please reconnect.',
        requiresReconnection: true,
        actionUrl: RECONNECT_URL,
      });
    }

    if (row.reconnection_required || ['expired', 'revoked', 'permission_denied'].includes(row.status)) {
      return json(req, {
        status: row.status,
        message: row.last_error || 'Your Google connection needs to be refreshed',
        errorMessage: row.last_error ?? undefined,
        requiresReconnection: true,
        actionUrl: RECONNECT_URL,
        errorCode: row.error_code ?? undefined,
        failedAction: row.failed_action ?? undefined,
      });
    }

    return json(req, {
      status: 'connected',
      message: 'Google account connected successfully',
      googleEmail: row.google_email,
      connectedSince: row.created_at,
      lastVerified: row.last_verified_at,
      requiresConnection: false,
      requiresReconnection: false,
    });
  }),
);