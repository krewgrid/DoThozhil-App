import { json, service, siteOrigin, startKyc, userFrom } from '../_lib/server.js';

/** Starts Aadhaar KYC for the signed-in worker and returns the URL to send them to. */
export async function POST(request) {
  const { user, sb } = await userFrom(request);
  if (!user) return json({ error: 'Sign in first' }, 401);
  const { data: w } = await sb.from('workers').select('kyc_status').eq('id', user.id).maybeSingle();
  if (!w) return json({ error: 'Only workers verify Aadhaar' }, 403);
  if (w.kyc_status === 'verified') return json({ error: 'Already verified' }, 409);
  try {
    const { url, ref } = await startKyc(user.id, `${siteOrigin(request)}/worker/kyc-callback`);
    const { error } = await service().rpc('set_kyc_result', { p_worker: user.id, p_status: 'pending', p_ref: ref, p_last4: null, p_hash: null });
    if (error) throw new Error(error.message);
    return json({ url });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}
