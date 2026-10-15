# krewgrid

Event work in Kochi, paid in full. Clients post work, workers apply with slots, attendance is proven with an OTP check-in and a photo check-out. Zero commission: krewgrid earns from slot packs (₹200 for 10).

This is the Vite + React website (same look as before) running on the new krewgrid database: every business rule lives in Postgres functions (`supabase/migrations/0001_krewgrid.sql`) behind row-level security, so nothing can be bypassed from the browser. Razorpay and Aadhaar KYC run as Vercel functions in `api/`.

## What's new

**Workers**: Find work (search, category, date, pay, nearest), apply with slots (refunded if rejected or cancelled), My works, OTP + GPS check-in (within 300 m), early check-out requests, camera-only check-out photo stamped with time and GPS, Razorpay slot packs with full slot history, Levels (Blue 10 / Silver 50 / Gold 100) and an optional monthly leaderboard, disputes with photo proof, "payment not received" cases, Aadhaar verification, licence/police-clearance upload, profile photo.

**Clients**: verified before posting, post work (category rules, min level, language, auto or manual approval, photo approval, venue GPS), applicants with reliability stats, OTPs per worker, live attendance, approve early check-out (full pay or hours worked), release all, cancel with refunds, report no-show (−10 slots, 2nd = 30-day suspension, 3rd = ban), left early, mark paid, ratings, saved workers, disputes.

**Both**: live job chat, phone numbers shared only once a worker is approved.

**Control Centre** (`/control-centre`): overview, all works with OTP/GPS/photo evidence, users (ban/unban, slot adjustments, client flags), client verification queue, dispute decisions (reverse no-show, flag client), document review, categories, and settings (all the numbers above).

## Go live

You need **Supabase**, **Vercel**, **Google Cloud** (for Google sign-in) and **Razorpay**.

### 1. Supabase (a fresh project)

The new database replaces the old tables (`works`, `applications`, the old `profiles`), so use a **new Supabase project** (or reset the old one).

1. supabase.com → **New project**, region **Mumbai (ap-south-1)**.
2. **SQL Editor** → paste all of `supabase/migrations/0001_krewgrid.sql` → **Run**. Then the same for `supabase/migrations/0002_storage.sql`.
3. **Project Settings → API**: copy the Project URL, the `anon` key and the `service_role` key.

### 2. Sign-in

- Google: console.cloud.google.com → OAuth client ID (Web). Authorised redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`. Paste the Client ID and secret into Supabase → **Authentication → Sign In / Providers → Google**.
- Email + password also works (Supabase → Email provider).
- Supabase → **Authentication → URL Configuration**: Site URL = your Vercel address; add `https://YOUR-SITE/login` and `http://localhost:5173/login` to Redirect URLs.

### 3. Razorpay

1. dashboard.razorpay.com → **Test mode** → **API Keys** → generate. Keep **automatic capture** on.
2. **Webhooks** → URL `https://YOUR-SITE/api/razorpay/webhook`, choose a secret, tick `payment.captured` and `order.paid`.
3. When test payments work, activate Live mode and swap the keys in Vercel.

### 4. Vercel

Add every variable from `.env.example` in **Project → Settings → Environment Variables**, then redeploy. `vercel.json` sends every path except `/api/*` to the website.

### 5. Make yourself admin

Sign in once and finish setup, then in Supabase SQL Editor:

```sql
update profiles set is_admin = true
where id = (select id from auth.users where email = 'luthufulhak@gmail.com');
```

Refresh: **Control Centre** appears in your menu.

### 6. Aadhaar KYC (Zoop)

Until Zoop is ready, `KYC_PROVIDER=mock` marks workers verified when they tap *Verify with Aadhaar*. **Don't launch publicly in mock mode.** When Zoop is live, fill in the four places marked `ZOOP:` in `api/_lib/server.js`, then set `KYC_PROVIDER=zoop` and the `ZOOP_*` variables. krewgrid stores only the last 4 Aadhaar digits plus a salted hash, so one Aadhaar = one account.

## Run it on your computer

```bash
npm install
cp .env.example .env    # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev             # http://localhost:5173
```

`npm run dev` serves the website only. Slot payments and KYC need the `/api` functions: use `npx vercel dev` or test on your Vercel address. Camera and GPS need HTTPS on phones.

## Test the rules

`supabase/tests/lifecycle.sql` runs the whole job lifecycle against Postgres 15+:

```bash
PGHOST=localhost PGUSER=postgres sh supabase/tests/run.sh
```

## Project map

```
src/
  App.jsx                    routes
  components/Layout.jsx      PrismaHero shell (workers, clients) + Control Centre sidebar
  components/kg/             UI kit, camera, check-out, disputes, chat, Razorpay checkout
  lib/actions.js             every button's database call
  lib/session.jsx            signed-in person (profile + worker/client row)
  lib/api.js                 data loading, live updates, private photo links
  pages/Worker|Client|ControlCentre|Shared|Auth
api/                         Vercel functions: razorpay (order, verify, webhook), kyc (start, finish)
supabase/migrations/         database, rules, security
supabase/tests/              lifecycle test
```
