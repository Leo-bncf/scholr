// Lets an internal, unattended job call a super-admin endpoint.
//
// The climate autopilot has to read the air conditioning and the iLO sensors,
// but it has no human behind it, so `auth.me()` resolves to nobody and the
// super-admin email check can never pass. Rather than duplicating the Tuya and
// Redfish clients inside the autopilot, those two endpoints accept a shared
// secret presented in a header.
//
// The rules that keep this narrow:
//   - The secret lives only in the edge runtime's environment. It is never
//     sent to a browser and no public endpoint reads it.
//   - It is only honoured by adminClimate and adminIlo — never by anything
//     that touches school data.
//   - An unset AUTOPILOT_SECRET means the door does not exist, rather than a
//     door that opens for an empty string.
//   - Work done this way is audit-logged as "autopilot", so a machine action
//     is never mistaken for a person's.
export function isMachineCaller(req: Request): boolean {
  const secret = Deno.env.get('AUTOPILOT_SECRET') || '';
  if (!secret) return false;
  const presented = req.headers.get('X-Autopilot-Secret') || '';
  if (presented.length !== secret.length) return false;
  // Constant-time compare: a length-safe XOR over the whole string, so the
  // time taken does not reveal how much of the secret was correct.
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ presented.charCodeAt(i);
  return diff === 0;
}
