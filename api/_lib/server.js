// Shared helpers for the Vercel API functions (server only; never bundled into the site).
import { createClient } from '@supabase/supabase-js';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** Service-role client: payments and KYC results. Bypasses row-level security. */
export function service() {
  if (!SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** The signed-in user from the "Authorization: Bearer <token>" header, plus a client acting as them. */
export async function userFrom(request) {
  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token || !SUPABASE_URL || !ANON) return { user: null };
  const sb = createClient(SUPABASE_URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await sb.auth.getUser(token);
  return { user, sb };
}

export function siteOrigin(request) {
  return process.env.SITE_URL || new URL(request.url).origin;
}

/* ---------- Razorpay ---------- */
const RZP = 'https://api.razorpay.com/v1';
const keyId = () => process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;

function rzpAuth() {
  const id = keyId(), secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error('Razorpay keys are not set');
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

export const razorpayKeyId = keyId;

export async function createOrder(amountPaise, receipt, notes) {
  const r = await fetch(`${RZP}/orders`, {
    method: 'POST',
    headers: { Authorization: rzpAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, notes }),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body?.error?.description ?? 'Razorpay order failed');
  return body;
}

export async function fetchPayment(paymentId) {
  const r = await fetch(`${RZP}/payments/${paymentId}`, { headers: { Authorization: rzpAuth() } });
  if (!r.ok) throw new Error('Could not fetch payment');
  return r.json();
}

function safeEqual(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Checkout handler signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
export function verifyCheckoutSignature(orderId, paymentId, signature) {
  const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ?? '').update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, String(signature));
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret) in X-Razorpay-Signature */
export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

/* ---------- Aadhaar KYC ----------
 * mock: marks the worker verified with no real check. For testing only.
 * zoop: real check through Zoop (fill in the four ZOOP: places below from Zoop's docs).
 * krewgrid never stores the Aadhaar number: only the last 4 digits and a salted hash
 * of Zoop's unique reference, so the same Aadhaar can't open a second account.
 */
export const kycProvider = () => (process.env.KYC_PROVIDER ?? 'mock');

export function hashRef(ref) {
  return createHash('sha256').update(`${process.env.KYC_HASH_SALT ?? ''}:${ref}`).digest('hex');
}

function zoopHeaders() {
  if (!process.env.ZOOP_BASE_URL || !process.env.ZOOP_APP_ID || !process.env.ZOOP_API_KEY) {
    throw new Error('Zoop is not configured. Set ZOOP_BASE_URL, ZOOP_APP_ID and ZOOP_API_KEY, or use KYC_PROVIDER=mock for testing.');
  }
  return { 'app-id': process.env.ZOOP_APP_ID, 'api-key': process.env.ZOOP_API_KEY, 'Content-Type': 'application/json' };
}

/** Returns the URL to send the worker to. */
export async function startKyc(userId, callbackUrl) {
  if (kycProvider() !== 'zoop') {
    const ref = `mock-${userId}`;
    return { url: `${callbackUrl}?ref=${encodeURIComponent(ref)}`, ref };
  }
  // ZOOP: path of the "initiate DigiLocker / Aadhaar request" endpoint
  const r = await fetch(`${process.env.ZOOP_BASE_URL}/REPLACE-initiate-path`, {
    method: 'POST',
    headers: zoopHeaders(),
    // ZOOP: request body fields (consent text, purpose, redirect/callback URL, your reference)
    body: JSON.stringify({ redirect_url: callbackUrl, reference_id: userId, consent: 'Y', purpose: 'Worker identity verification for krewgrid' }),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body?.message ?? 'Zoop request failed');
  // ZOOP: response fields holding the request id and the URL to send the user to
  const ref = body.request_id, url = body.sdk_url;
  if (!ref || !url) throw new Error('Unexpected Zoop response');
  return { url, ref };
}

/** Reads the result after the worker comes back. */
export async function finishKyc(ref, userId) {
  if (kycProvider() !== 'zoop') {
    if (ref !== `mock-${userId}`) return { ok: false, ref, reason: 'Reference mismatch' };
    return { ok: true, ref, last4: '0000', uniqueRef: `mock-aadhaar-${userId}` };
  }
  // ZOOP: path of the "fetch result" endpoint for a request id
  const r = await fetch(`${process.env.ZOOP_BASE_URL}/REPLACE-result-path/${encodeURIComponent(ref)}`, { headers: zoopHeaders() });
  const body = await r.json();
  if (!r.ok || body?.success === false) return { ok: false, ref, reason: body?.message ?? 'Verification failed' };
  // ZOOP: masked Aadhaar number and a reference that is unique per Aadhaar (e.g. a UID token / reference id)
  const masked = String(body?.result?.masked_aadhaar ?? '');
  const unique = String(body?.result?.uid_token ?? body?.result?.reference_id ?? '');
  const last4 = masked.replace(/\D/g, '').slice(-4);
  if (last4.length !== 4 || !unique) return { ok: false, ref, reason: 'Incomplete result from Zoop' };
  return { ok: true, ref, last4, uniqueRef: unique };
}
