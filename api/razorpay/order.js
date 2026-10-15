import { createOrder, json, razorpayKeyId, service, userFrom } from '../_lib/server.js';

/** Creates a Razorpay order for one slot pack and records it against the signed-in worker. */
export async function POST(request) {
  const { user, sb } = await userFrom(request);
  if (!user) return json({ error: 'Sign in first' }, 401);
  const { data: w } = await sb.from('workers').select('id').eq('id', user.id).maybeSingle();
  if (!w) return json({ error: 'Only workers buy slots' }, 403);

  try {
    const svc = service();
    const { data: rows } = await svc.from('settings').select('key, value').in('key', ['slot_pack_size', 'slot_pack_price_paise']);
    const s = Object.fromEntries((rows ?? []).map((r) => [r.key, Number(r.value)]));
    const slots = s.slot_pack_size ?? 10, amount = s.slot_pack_price_paise ?? 20000;
    const order = await createOrder(amount, `slots-${user.id.slice(0, 8)}-${Date.now()}`, { worker: user.id, slots: String(slots) });
    const { error } = await svc.rpc('create_payment_order', { p_worker: user.id, p_order: order.id, p_amount: amount, p_slots: slots });
    if (error) throw new Error(error.message);
    return json({ orderId: order.id, amount, keyId: razorpayKeyId() });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}
