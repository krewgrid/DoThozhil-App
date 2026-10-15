import { finishKyc, hashRef, json, service, userFrom } from '../_lib/server.js';

/** The worker is back from the Aadhaar provider: check the result and record it. */
export async function POST(request) {
  const { user } = await userFrom(request);
  if (!user) return json({ error: 'Sign in first' }, 401);
  const body = await request.json().catch(() => ({}));
  try {
    const svc = service();
    const { data: w } = await svc.from('workers').select('kyc_ref, kyc_status').eq('id', user.id).maybeSingle();
    const ref = body.ref || w?.kyc_ref;
    if (!w || !ref || ref !== w.kyc_ref) return json({ error: 'Verification not found' }, 400);

    const r = await finishKyc(ref, user.id);
    if (!r.ok) {
      await svc.rpc('set_kyc_result', { p_worker: user.id, p_status: 'failed', p_ref: ref, p_last4: null, p_hash: null });
      return json({ error: r.reason }, 400);
    }
    const { error } = await svc.rpc('set_kyc_result', { p_worker: user.id, p_status: 'verified', p_ref: ref, p_last4: r.last4, p_hash: hashRef(r.uniqueRef) });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}
