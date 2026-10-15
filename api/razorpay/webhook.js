import { json, service, verifyWebhookSignature } from '../_lib/server.js';

/**
 * Razorpay webhook (events: payment.captured, order.paid).
 * Backup path: credits slots even if the worker closed the app before the checkout handler ran.
 * credit_payment() is idempotent, so duplicates are harmless.
 */
export async function POST(request) {
  const raw = await request.text();
  const sig = request.headers.get('x-razorpay-signature') ?? '';
  if (!verifyWebhookSignature(raw, sig)) return json({ error: 'bad signature' }, 400);

  const evt = JSON.parse(raw);
  const pay = evt?.payload?.payment?.entity;
  if ((evt.event === 'payment.captured' || evt.event === 'order.paid') && pay?.order_id) {
    const { error } = await service().rpc('credit_payment', { p_order: pay.order_id, p_payment: pay.id, p_amount: pay.amount });
    if (error && !error.message.includes('Unknown order')) return json({ error: error.message }, 500);
  }
  return json({ ok: true });
}
