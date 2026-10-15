import { fetchPayment, json, service, userFrom, verifyCheckoutSignature } from '../_lib/server.js';

/** Called by the checkout handler. Slots are added only after the signature and the payment are confirmed. */
export async function POST(request) {
  const { user } = await userFrom(request);
  if (!user) return json({ error: 'Sign in first' }, 401);

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sig } = await request.json();
  if (!orderId || !paymentId || !sig || !verifyCheckoutSignature(orderId, paymentId, sig)) {
    return json({ error: 'Payment could not be verified' }, 400);
  }
  try {
    const svc = service();
    const { data: order } = await svc.from('payments').select('worker_id').eq('razorpay_order_id', orderId).maybeSingle();
    if (!order || order.worker_id !== user.id) return json({ error: 'Order not found' }, 404);
    const p = await fetchPayment(paymentId);
    if (p.order_id !== orderId || p.status !== 'captured') {
      return json({ error: 'Payment not completed yet. Slots will appear when Razorpay confirms it.' }, 202);
    }
    const { error } = await svc.rpc('credit_payment', { p_order: orderId, p_payment: paymentId, p_amount: p.amount });
    if (error) throw new Error(error.message);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}
