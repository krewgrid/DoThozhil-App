-- Krewgrid: core schema, security rules and business functions.
-- Every rule that matters (slots, OTP, GPS, penalties, refunds) runs inside these
-- functions, so it cannot be skipped from the browser. Tables are read through
-- row-level security; almost all writes go through the functions below.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------
create table public.settings (
  key   text primary key,
  value jsonb not null
);

insert into public.settings (key, value) values
  ('welcome_slots',          '5'),
  ('slot_pack_size',         '10'),
  ('slot_pack_price_paise',  '20000'),
  ('noshow_penalty',         '10'),
  ('checkin_radius_m',       '300'),
  ('checkout_window_min',    '30'),
  ('noshow_after_min',       '30'),
  ('new_account_active_limit','2'),
  ('kyc_required',           'true'),
  ('leaderboard_enabled',    'false'),
  ('leaderboard_prize_inr',  '10000'),
  ('live_count_min',         '500'),
  ('launch_city',            '"Kochi"');

create or replace function public.setting_int(k text) returns int
language sql stable security definer set search_path = public as $$
  select (value #>> '{}')::int from settings where key = k
$$;

create or replace function public.setting_bool(k text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((value #>> '{}')::boolean, false) from settings where key = k
$$;

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null check (role in ('worker','client')),
  is_admin     boolean not null default false,
  full_name    text not null check (length(full_name) between 2 and 80),
  area         text,
  avatar_path  text,
  banned       boolean not null default false,
  banned_until timestamptz,
  ban_reason   text,
  created_at   timestamptz not null default now()
);

-- Phone numbers are private. They are shared only through get_job_contacts()
-- once a worker is approved for a job.
create table public.private_contacts (
  id    uuid primary key references public.profiles(id) on delete cascade,
  phone text not null check (phone ~ '^[0-9+ ]{10,16}$')
);

create table public.workers (
  id              uuid primary key references public.profiles(id) on delete cascade,
  skills          text[] not null default '{}',
  languages       text[] not null default '{}',
  slots           int not null default 0,
  completed_jobs  int not null default 0,
  rating_sum      int not null default 0,
  rating_count    int not null default 0,
  no_shows        int not null default 0,
  early_exits     int not null default 0,
  kyc_status      text not null default 'none' check (kyc_status in ('none','pending','verified','failed')),
  kyc_ref         text,
  aadhaar_last4   text check (aadhaar_last4 ~ '^[0-9]{4}$'),
  aadhaar_hash    text unique,          -- one Aadhaar, one account (hash only, never the number)
  kyc_verified_at timestamptz
);

create table public.clients (
  id            uuid primary key references public.profiles(id) on delete cascade,
  org_name      text not null,
  contact_name  text not null,
  about         text,
  verified      boolean not null default false,
  verified_at   timestamptz,
  flags         int not null default 0,
  rating_sum    int not null default 0,
  rating_count  int not null default 0
);

-- ---------------------------------------------------------------------------
-- Work
-- ---------------------------------------------------------------------------
create table public.categories (
  id                     serial primary key,
  name                   text not null unique,
  needs_photo            boolean not null default false,
  needs_manual_approval  boolean not null default false,
  needs_driving_licence  boolean not null default false,
  needs_police_clearance boolean not null default false,
  optional_note          text,
  active                 boolean not null default true
);

insert into public.categories (name, needs_photo, needs_manual_approval, needs_driving_licence, optional_note) values
  ('Catering / Serving',    false, false, false, null),
  ('Event setup / Loading', false, false, false, null),
  ('Cleaning',              false, false, false, null),
  ('Security',              true,  true,  false, null),
  ('Valet parking',         false, false, true,  null),
  ('Sound / Lighting tech', false, false, false, 'Experience photos help');

create table public.jobs (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients(id),
  category_id    int  not null references public.categories(id),
  title          text not null check (length(title) between 3 and 90),
  description    text,
  venue          text not null,
  area           text not null,
  lat            double precision,
  lng            double precision,
  work_date      date not null,
  start_time     time not null,
  hours          numeric(4,1) not null check (hours > 0 and hours <= 18),
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  pay            int not null check (pay >= 100),
  workers_needed int not null check (workers_needed between 1 and 500),
  payment_date   date not null,
  approval_mode  text not null default 'manual' check (approval_mode in ('manual','auto')),
  min_level      text not null default 'any' check (min_level in ('any','blue','silver','gold')),
  language       text,
  photo_approval boolean not null default false,
  slot_cost      int not null default 1 check (slot_cost between 1 and 5),
  status         text not null default 'open' check (status in ('open','cancelled','completed')),
  created_at     timestamptz not null default now()
);
create index on public.jobs (status, work_date);
create index on public.jobs (client_id);

create table public.bookings (
  id               uuid primary key default gen_random_uuid(),
  job_id           uuid not null references public.jobs(id) on delete cascade,
  worker_id        uuid not null references public.workers(id),
  status           text not null check (status in ('applied','approved','rejected','cancelled')),
  slots_spent      int not null default 0,
  approved_at      timestamptz,
  check_in_at      timestamptz,
  check_in_lat     double precision,
  check_in_lng     double precision,
  check_in_dist_m  int,
  check_out_at     timestamptz,
  check_out_lat    double precision,
  check_out_lng    double precision,
  check_out_dist_m int,
  check_out_photo  text,
  early_status     text check (early_status in ('pending','approved','rejected')),
  early_reason     text,
  pay_mode         text not null default 'full' check (pay_mode in ('full','hours')),
  final_pay        int,
  left_early       boolean not null default false,
  no_show          boolean not null default false,
  paid_at          timestamptz,
  created_at       timestamptz not null default now(),
  unique (job_id, worker_id)
);
create index on public.bookings (worker_id);

-- OTPs live apart from bookings so the worker cannot read their own OTP.
create table public.booking_otps (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  otp        text not null
);

-- ---------------------------------------------------------------------------
-- Money, trust, talk
-- ---------------------------------------------------------------------------
create table public.slot_ledger (
  id          bigserial primary key,
  worker_id   uuid not null references public.workers(id),
  delta       int not null,
  reason      text not null,
  booking_id  uuid references public.bookings(id),
  payment_id  uuid,
  created_at  timestamptz not null default now()
);
create index on public.slot_ledger (worker_id, created_at desc);

create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  worker_id           uuid not null references public.workers(id),
  razorpay_order_id   text not null unique,
  razorpay_payment_id text unique,
  amount_paise        int not null,
  slots               int not null,
  status              text not null default 'created' check (status in ('created','paid','failed')),
  created_at          timestamptz not null default now(),
  paid_at             timestamptz
);

create table public.ratings (
  id         bigserial primary key,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  rater      text not null check (rater in ('worker','client')),
  stars      int not null check (stars between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  unique (booking_id, rater)
);

create table public.disputes (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references public.bookings(id),
  raised_by    uuid not null references public.profiles(id),
  kind         text not null check (kind in ('noshow_wrong','payment_not_received','job_changed','other')),
  description  text not null,
  photo_path   text,
  photo_lat    double precision,
  photo_lng    double precision,
  status       text not null default 'open' check (status in ('open','resolved')),
  outcome      text,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

create table public.client_flags (
  id          bigserial primary key,
  client_id   uuid not null references public.clients(id),
  booking_id  uuid references public.bookings(id),
  reason      text not null,
  cleared     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  worker_id   uuid not null references public.workers(id),
  doc_type    text not null check (doc_type in ('driving_licence','police_clearance','other')),
  doc_number  text not null,
  expires_on  date not null,
  photo_path  text not null,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  note        text,
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.messages (
  id         bigserial primary key,
  job_id     uuid not null references public.jobs(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id),
  body       text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index on public.messages (job_id, created_at);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;

create or replace function public.level_rank(n int) returns int
language sql immutable as $$
  select case when n >= 100 then 3 when n >= 50 then 2 when n >= 10 then 1 else 0 end
$$;

create or replace function public.level_name(n int) returns text
language sql immutable as $$
  select (array['new','blue','silver','gold'])[public.level_rank(n) + 1]
$$;

create or replace function public.distance_m(lat1 float8, lng1 float8, lat2 float8, lng2 float8) returns int
language sql immutable as $$
  select round(2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2))))::int
$$;

create or replace function public.assert_active(uid uuid) returns void
language plpgsql stable security definer set search_path = public as $$
declare p profiles;
begin
  select * into p from profiles where id = uid;
  if not found then raise exception 'Finish setting up your account first'; end if;
  if p.banned then raise exception 'Your account is banned. Contact Krewgrid support.'; end if;
  if p.banned_until is not null and p.banned_until > now() then
    raise exception 'Your account is suspended until %', to_char(p.banned_until at time zone 'Asia/Kolkata', 'DD Mon YYYY');
  end if;
end $$;

create or replace function public.has_valid_doc(w uuid, t text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from documents where worker_id = w and doc_type = t
                 and status = 'approved' and expires_on >= current_date)
$$;

create or replace function public.new_otp() returns text
language sql volatile as $$ select lpad((floor(random() * 10000))::int::text, 4, '0') $$;

create or replace function public.add_slots(w uuid, d int, why text, b uuid default null, pay uuid default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  update workers set slots = slots + d where id = w;
  insert into slot_ledger (worker_id, delta, reason, booking_id, payment_id) values (w, d, why, b, pay);
end $$;

-- Job times are entered in India time.
create or replace function public.jobs_set_times() returns trigger
language plpgsql as $$
begin
  new.starts_at := (new.work_date + new.start_time) at time zone 'Asia/Kolkata';
  new.ends_at   := new.starts_at + make_interval(mins => (new.hours * 60)::int);
  return new;
end $$;
create trigger jobs_set_times before insert or update of work_date, start_time, hours on public.jobs
  for each row execute function public.jobs_set_times();

-- ---------------------------------------------------------------------------
-- Public views (stats others may see, without private fields)
-- ---------------------------------------------------------------------------
create view public.worker_public as
  select w.id, p.full_name, p.area, p.avatar_path, w.skills, w.languages, w.completed_jobs,
         level_name(w.completed_jobs) as level,
         case when w.rating_count > 0 then round(w.rating_sum::numeric / w.rating_count, 1) end as rating,
         w.rating_count, w.no_shows, w.early_exits, (w.kyc_status = 'verified') as kyc_verified,
         (p.banned or coalesce(p.banned_until > now(), false)) as suspended
  from workers w join profiles p on p.id = w.id;

create view public.client_public as
  select c.id, c.org_name, c.contact_name, c.verified,
         case when c.rating_count > 0 then round(c.rating_sum::numeric / c.rating_count, 1) end as rating,
         c.rating_count
  from clients c;

-- ---------------------------------------------------------------------------
-- Onboarding and profile
-- ---------------------------------------------------------------------------
create or replace function public.complete_onboarding(
  p_role text, p_full_name text, p_phone text, p_area text,
  p_skills text[] default '{}', p_languages text[] default '{}',
  p_org_name text default null, p_about text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first'; end if;
  if exists (select 1 from profiles where id = uid) then raise exception 'Your account is already set up'; end if;
  if p_role not in ('worker','client') then raise exception 'Choose worker or client'; end if;

  insert into profiles (id, role, full_name, area) values (uid, p_role, trim(p_full_name), trim(p_area));
  insert into private_contacts (id, phone) values (uid, regexp_replace(p_phone, '\s+', ' ', 'g'));

  if p_role = 'worker' then
    insert into workers (id, skills, languages) values (uid, coalesce(p_skills,'{}'), coalesce(p_languages,'{}'));
    perform add_slots(uid, setting_int('welcome_slots'), 'Welcome bonus');
  else
    if coalesce(trim(p_org_name),'') = '' then raise exception 'Enter your business or event name'; end if;
    insert into clients (id, org_name, contact_name, about) values (uid, trim(p_org_name), trim(p_full_name), p_about);
  end if;
end $$;

create or replace function public.update_my_profile(p_full_name text, p_area text, p_phone text,
  p_skills text[] default null, p_languages text[] default null, p_avatar_path text default null) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if p_avatar_path is not null and p_avatar_path not like uid::text || '/%' then raise exception 'Invalid photo'; end if;
  update profiles set full_name = trim(p_full_name), area = trim(p_area),
         avatar_path = coalesce(p_avatar_path, avatar_path) where id = uid;
  update private_contacts set phone = regexp_replace(p_phone, '\s+', ' ', 'g') where id = uid;
  update workers set skills = coalesce(p_skills, skills), languages = coalesce(p_languages, languages) where id = uid;
  update clients set contact_name = trim(p_full_name) where id = uid;
end $$;

-- ---------------------------------------------------------------------------
-- Clients: post and manage work
-- ---------------------------------------------------------------------------
create or replace function public.post_job(
  p_category int, p_title text, p_description text, p_venue text, p_area text,
  p_lat float8, p_lng float8, p_date date, p_start time, p_hours numeric, p_pay int,
  p_needed int, p_payment_date date, p_mode text, p_min_level text, p_language text, p_photo_approval boolean
) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c clients; cat categories; v_id uuid; v_mode text;
begin
  perform assert_active(uid);
  select * into c from clients where id = uid;
  if not found then raise exception 'Only clients can post work'; end if;
  if not c.verified then raise exception 'Krewgrid is still verifying your account. You can post once verified.'; end if;
  select * into cat from categories where id = p_category and active;
  if not found then raise exception 'Choose a category'; end if;
  if p_date < (now() at time zone 'Asia/Kolkata')::date then raise exception 'The work date is in the past'; end if;
  if p_payment_date < p_date then raise exception 'Payment date must be on or after the work date'; end if;
  v_mode := case when cat.needs_manual_approval or p_photo_approval then 'manual' else p_mode end;

  insert into jobs (client_id, category_id, title, description, venue, area, lat, lng, work_date, start_time,
                    hours, starts_at, ends_at, pay, workers_needed, payment_date, approval_mode, min_level,
                    language, photo_approval, slot_cost)
  values (uid, p_category, trim(p_title), p_description, trim(p_venue), trim(p_area), p_lat, p_lng, p_date, p_start,
          p_hours, now(), now(), p_pay, p_needed, p_payment_date, v_mode, coalesce(p_min_level,'any'),
          nullif(p_language,''), coalesce(p_photo_approval,false) or cat.needs_photo,
          case when p_pay >= 1400 then 2 else 1 end)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.my_job(p_job uuid) returns jobs
language plpgsql stable security definer set search_path = public as $$
declare j jobs;
begin
  select * into j from jobs where id = p_job;
  if not found or j.client_id <> auth.uid() then raise exception 'Job not found'; end if;
  return j;
end $$;

create or replace function public.approve_booking(p_booking uuid) returns text
language plpgsql security definer set search_path = public as $$
declare b bookings; j jobs; v_otp text;
begin
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'Application not found'; end if;
  j := my_job(b.job_id);
  if j.status <> 'open' then raise exception 'This job is closed'; end if;
  if b.status <> 'applied' then raise exception 'This application was already handled'; end if;
  if (select count(*) from bookings where job_id = j.id and status = 'approved') >= j.workers_needed then
    raise exception 'All % spots are filled', j.workers_needed; end if;
  update bookings set status = 'approved', approved_at = now() where id = b.id;
  v_otp := new_otp();
  insert into booking_otps (booking_id, otp) values (b.id, v_otp);
  return v_otp;
end $$;

create or replace function public.reject_booking(p_booking uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b bookings; j jobs;
begin
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'Application not found'; end if;
  j := my_job(b.job_id);
  if b.status <> 'applied' then raise exception 'Only new applications can be rejected'; end if;
  update bookings set status = 'rejected' where id = b.id;
  if b.slots_spent > 0 then perform add_slots(b.worker_id, b.slots_spent, 'Refund: not selected for ' || j.title, b.id); end if;
end $$;

create or replace function public.cancel_job(p_job uuid) returns void
language plpgsql security definer set search_path = public as $$
declare j jobs; b bookings;
begin
  j := my_job(p_job);
  if j.status <> 'open' then raise exception 'This job is already closed'; end if;
  if exists (select 1 from bookings where job_id = j.id and check_in_at is not null) then
    raise exception 'Workers have already checked in. Release them instead of cancelling.'; end if;
  update jobs set status = 'cancelled' where id = j.id;
  for b in select * from bookings where job_id = j.id and status in ('applied','approved') for update loop
    update bookings set status = 'cancelled' where id = b.id;
    if b.slots_spent > 0 then perform add_slots(b.worker_id, b.slots_spent, 'Refund: client cancelled ' || j.title, b.id); end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Workers: apply
-- ---------------------------------------------------------------------------
create or replace function public.apply_to_job(p_job uuid) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); p profiles; w workers; j jobs; c clients; cat categories;
        v_active int; v_status text; v_bid uuid; need_rank int;
begin
  perform assert_active(uid);
  select * into p from profiles where id = uid;
  if p.role <> 'worker' then raise exception 'Only workers can apply'; end if;
  select * into w from workers where id = uid for update;
  if setting_bool('kyc_required') and w.kyc_status <> 'verified' then
    raise exception 'Verify your Aadhaar before your first application'; end if;

  select * into j from jobs where id = p_job for update;
  if not found then raise exception 'Job not found'; end if;
  if j.status <> 'open' then raise exception 'This job is closed'; end if;
  if j.starts_at <= now() then raise exception 'This job has already started'; end if;
  select * into c from clients where id = j.client_id;
  if not c.verified or exists (select 1 from profiles where id = c.id and banned) then
    raise exception 'This job is not available'; end if;
  if exists (select 1 from bookings where job_id = j.id and worker_id = uid) then
    raise exception 'You already applied for this job'; end if;

  select * into cat from categories where id = j.category_id;
  if cat.needs_driving_licence and not has_valid_doc(uid, 'driving_licence') then
    raise exception 'This job needs an approved driving licence. Add it in Profile.'; end if;
  if cat.needs_police_clearance and not has_valid_doc(uid, 'police_clearance') then
    raise exception 'This job needs an approved police clearance certificate. Add it in Profile.'; end if;
  if (cat.needs_photo or j.photo_approval) and p.avatar_path is null then
    raise exception 'This job needs a profile photo. Add one in Profile.'; end if;
  need_rank := case j.min_level when 'blue' then 1 when 'silver' then 2 when 'gold' then 3 else 0 end;
  if level_rank(w.completed_jobs) < need_rank then
    raise exception 'This job needs % level or higher', initcap(j.min_level); end if;

  if exists (select 1 from bookings b2 join jobs j2 on j2.id = b2.job_id
             where b2.worker_id = uid and b2.status in ('applied','approved') and b2.check_out_at is null
               and not b2.no_show and j2.status = 'open'
               and tstzrange(j2.starts_at, j2.ends_at) && tstzrange(j.starts_at, j.ends_at)) then
    raise exception 'This clashes with another job you applied for. One job per time slot.'; end if;

  if w.completed_jobs = 0 then
    select count(*) into v_active from bookings b2 join jobs j2 on j2.id = b2.job_id
     where b2.worker_id = uid and b2.status in ('applied','approved') and b2.check_out_at is null
       and j2.status = 'open' and j2.ends_at > now();
    if v_active >= setting_int('new_account_active_limit') then
      raise exception 'New accounts can hold % active applications until the first job is done', setting_int('new_account_active_limit'); end if;
  end if;

  if (select count(*) from bookings where job_id = j.id and status = 'approved') >= j.workers_needed then
    raise exception 'This job is full'; end if;
  if w.slots < j.slot_cost then
    raise exception 'You need % slot(s). You have %.', j.slot_cost, w.slots; end if;

  v_status := case when j.approval_mode = 'auto' and not cat.needs_manual_approval and not j.photo_approval
                   then 'approved' else 'applied' end;
  insert into bookings (job_id, worker_id, status, slots_spent, approved_at)
  values (j.id, uid, v_status, j.slot_cost, case when v_status = 'approved' then now() end)
  returning id into v_bid;
  perform add_slots(uid, -j.slot_cost, 'Applied: ' || j.title, v_bid);
  if v_status = 'approved' then insert into booking_otps (booking_id, otp) values (v_bid, new_otp()); end if;
  return v_status;
end $$;

-- ---------------------------------------------------------------------------
-- Attendance: OTP check-in, photo check-out, early exit
-- ---------------------------------------------------------------------------
create or replace function public.my_booking(p_booking uuid) returns bookings
language plpgsql stable security definer set search_path = public as $$
declare b bookings;
begin
  select * into b from bookings where id = p_booking;
  if not found or b.worker_id <> auth.uid() then raise exception 'Booking not found'; end if;
  return b;
end $$;

create or replace function public.check_venue(j jobs, p_lat float8, p_lng float8) returns int
language plpgsql stable security definer set search_path = public as $$
declare d int;
begin
  if j.lat is null then return null; end if;
  if p_lat is null or p_lng is null then raise exception 'Turn on location to continue'; end if;
  d := distance_m(j.lat, j.lng, p_lat, p_lng);
  if d > setting_int('checkin_radius_m') then
    raise exception 'You are % m from the venue. Move closer and try again.', d; end if;
  return d;
end $$;

create or replace function public.check_in(p_booking uuid, p_otp text, p_lat float8, p_lng float8) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare b bookings; j jobs; d int;
begin
  perform assert_active(auth.uid());
  b := my_booking(p_booking);
  select * into j from jobs where id = b.job_id;
  if b.status <> 'approved' or j.status <> 'open' then raise exception 'You are not booked for this job'; end if;
  if b.check_in_at is not null then raise exception 'Already checked in'; end if;
  if now() < j.starts_at - interval '2 hours' then raise exception 'Check-in opens 2 hours before the start'; end if;
  if now() > j.ends_at then raise exception 'This job has ended'; end if;
  d := check_venue(j, p_lat, p_lng);
  if not exists (select 1 from booking_otps where booking_id = b.id and otp = trim(p_otp)) then
    raise exception 'That OTP does not match. Ask the client for your OTP.'; end if;
  update bookings set check_in_at = now(), check_in_lat = p_lat, check_in_lng = p_lng, check_in_dist_m = d
   where id = b.id;
  return now();
end $$;

create or replace function public.request_early_checkout(p_booking uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare b bookings;
begin
  b := my_booking(p_booking);
  if b.check_in_at is null or b.check_out_at is not null then raise exception 'Check in first'; end if;
  if b.early_status = 'pending' then raise exception 'Your request is already with the client'; end if;
  update bookings set early_status = 'pending', early_reason = left(p_reason, 200) where id = b.id;
end $$;

create or replace function public.decide_early_checkout(p_booking uuid, p_approve boolean, p_pay_mode text default 'full') returns void
language plpgsql security definer set search_path = public as $$
declare b bookings; j jobs;
begin
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'Booking not found'; end if;
  j := my_job(b.job_id);
  if b.early_status is distinct from 'pending' then raise exception 'No early check-out request to answer'; end if;
  update bookings set early_status = case when p_approve then 'approved' else 'rejected' end,
         pay_mode = case when p_approve and p_pay_mode = 'hours' then 'hours' else 'full' end
   where id = b.id;
end $$;

create or replace function public.release_all(p_job uuid) returns int
language plpgsql security definer set search_path = public as $$
declare j jobs; n int;
begin
  j := my_job(p_job);
  update bookings set early_status = 'approved', early_reason = 'Client released all workers', pay_mode = 'full'
   where job_id = j.id and status = 'approved' and check_in_at is not null and check_out_at is null;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.check_out(p_booking uuid, p_lat float8, p_lng float8, p_photo text) returns int
language plpgsql security definer set search_path = public as $$
declare b bookings; j jobs; d int; v_pay int; worked numeric;
begin
  b := my_booking(p_booking);
  select * into j from jobs where id = b.job_id;
  if b.check_in_at is null then raise exception 'Check in first'; end if;
  if b.check_out_at is not null then raise exception 'Already checked out'; end if;
  if b.left_early then raise exception 'The client marked you as left early'; end if;
  if coalesce(p_photo,'') not like auth.uid()::text || '/checkout/%' then raise exception 'Take the check-out photo in the app'; end if;
  if now() < j.ends_at - make_interval(mins => setting_int('checkout_window_min'))
     and b.early_status is distinct from 'approved' then
    raise exception 'Check-out opens at %. Ask the client for early check-out if you need to leave.',
      to_char((j.ends_at - make_interval(mins => setting_int('checkout_window_min'))) at time zone 'Asia/Kolkata', 'HH12:MI AM');
  end if;
  d := check_venue(j, p_lat, p_lng);
  worked := extract(epoch from (now() - b.check_in_at)) / 3600.0;
  v_pay := case when b.pay_mode = 'hours' then (round(j.pay * least(1, worked / j.hours) / 10) * 10)::int else j.pay end;
  update bookings set check_out_at = now(), check_out_lat = p_lat, check_out_lng = p_lng, check_out_dist_m = d,
         check_out_photo = p_photo, final_pay = v_pay where id = b.id;
  update workers set completed_jobs = completed_jobs + 1 where id = b.worker_id;
  return v_pay;
end $$;

create or replace function public.report_left_early(p_booking uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b bookings; j jobs;
begin
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'Booking not found'; end if;
  j := my_job(b.job_id);
  if b.check_in_at is null or b.check_out_at is not null or b.left_early then raise exception 'Only a checked-in worker who has not checked out can be reported'; end if;
  if b.early_status = 'approved' then raise exception 'You approved this worker leaving early'; end if;
  update bookings set left_early = true where id = b.id;
  update workers set early_exits = early_exits + 1 where id = b.worker_id;
end $$;

create or replace function public.report_no_show(p_booking uuid) returns text
language plpgsql security definer set search_path = public as $$
declare b bookings; j jobs; n int; v_result text;
begin
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'Booking not found'; end if;
  j := my_job(b.job_id);
  if b.status <> 'approved' or b.check_in_at is not null or b.no_show then raise exception 'Only booked workers who never checked in can be reported'; end if;
  if now() < j.starts_at + make_interval(mins => setting_int('noshow_after_min')) then
    raise exception 'You can report a no-show % minutes after the start', setting_int('noshow_after_min'); end if;
  update bookings set no_show = true where id = b.id;
  update workers set no_shows = no_shows + 1 where id = b.worker_id returning no_shows into n;
  perform add_slots(b.worker_id, -setting_int('noshow_penalty'), 'No-show penalty: ' || j.title, b.id);
  if n >= 3 then
    update profiles set banned = true, ban_reason = 'Third no-show' where id = b.worker_id; v_result := 'banned';
  elsif n = 2 then
    update profiles set banned_until = now() + interval '30 days', ban_reason = 'Second no-show' where id = b.worker_id; v_result := 'suspended';
  else v_result := 'penalised'; end if;
  return v_result;
end $$;

-- ---------------------------------------------------------------------------
-- Pay, ratings, disputes
-- ---------------------------------------------------------------------------
create or replace function public.mark_paid(p_booking uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b bookings; j jobs;
begin
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'Booking not found'; end if;
  j := my_job(b.job_id);
  if b.check_in_at is null then raise exception 'This worker never checked in'; end if;
  if b.paid_at is not null then raise exception 'Already marked paid'; end if;
  update bookings set paid_at = now(), final_pay = coalesce(final_pay, j.pay) where id = b.id;
end $$;

create or replace function public.booking_party(b bookings) returns text
language plpgsql stable security definer set search_path = public as $$
begin
  if b.worker_id = auth.uid() then return 'worker'; end if;
  if exists (select 1 from jobs where id = b.job_id and client_id = auth.uid()) then return 'client'; end if;
  raise exception 'Booking not found';
end $$;

create or replace function public.rate_booking(p_booking uuid, p_stars int, p_comment text) returns void
language plpgsql security definer set search_path = public as $$
declare b bookings; who text; j jobs;
begin
  select * into b from bookings where id = p_booking;
  if not found then raise exception 'Booking not found'; end if;
  who := booking_party(b);
  if b.check_out_at is null and not b.left_early then raise exception 'You can rate after the job is finished'; end if;
  insert into ratings (booking_id, rater, stars, comment) values (b.id, who, p_stars, nullif(trim(p_comment),''));
  select * into j from jobs where id = b.job_id;
  if who = 'client' then
    update workers set rating_sum = rating_sum + p_stars, rating_count = rating_count + 1 where id = b.worker_id;
  else
    update clients set rating_sum = rating_sum + p_stars, rating_count = rating_count + 1 where id = j.client_id;
  end if;
exception when unique_violation then raise exception 'You already rated this job';
end $$;

create or replace function public.raise_dispute(p_booking uuid, p_kind text, p_description text,
  p_photo text default null, p_lat float8 default null, p_lng float8 default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare b bookings; v_id uuid;
begin
  select * into b from bookings where id = p_booking;
  if not found then raise exception 'Booking not found'; end if;
  perform booking_party(b);
  if p_photo is not null and p_photo not like auth.uid()::text || '/disputes/%' then raise exception 'Take the photo in the app'; end if;
  insert into disputes (booking_id, raised_by, kind, description, photo_path, photo_lat, photo_lng)
  values (b.id, auth.uid(), p_kind, p_description, p_photo, p_lat, p_lng) returning id into v_id;
  return v_id;
end $$;

-- Payment not received: opens a case and flags the client for admin. Clients
-- are never banned automatically.
create or replace function public.report_payment_not_received(p_booking uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare b bookings; j jobs;
begin
  b := my_booking(p_booking);
  select * into j from jobs where id = b.job_id;
  if b.check_out_at is null then raise exception 'Only finished jobs can be reported'; end if;
  if b.paid_at is not null then raise exception 'The client marked this as paid. Raise a dispute if that is wrong.'; end if;
  if j.payment_date >= (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'The payment date (%) has not passed yet', to_char(j.payment_date, 'DD Mon'); end if;
  if exists (select 1 from disputes where booking_id = b.id and kind = 'payment_not_received' and status = 'open') then
    raise exception 'A case is already open for this job'; end if;
  insert into disputes (booking_id, raised_by, kind, description)
  values (b.id, auth.uid(), 'payment_not_received', coalesce(nullif(trim(p_note),''), 'Payment not received by the promised date'));
  insert into client_flags (client_id, booking_id, reason) values (j.client_id, b.id, 'Payment not received: ' || j.title);
  update clients set flags = flags + 1 where id = j.client_id;
end $$;

-- Phone numbers: client sees approved workers; approved worker sees the client.
create or replace function public.get_job_contacts(p_job uuid)
returns table (person_id uuid, name text, phone text, is_client boolean)
language plpgsql stable security definer set search_path = public as $$
declare j jobs;
begin
  select * into j from jobs where id = p_job;
  if not found then return; end if;
  if j.client_id = auth.uid() or is_admin() then
    return query select p.id, p.full_name, pc.phone, false from bookings b
      join profiles p on p.id = b.worker_id join private_contacts pc on pc.id = p.id
      where b.job_id = j.id and b.status = 'approved';
  elsif exists (select 1 from bookings where job_id = j.id and worker_id = auth.uid() and status = 'approved') then
    return query select c.id, c.contact_name || ' (' || c.org_name || ')', pc.phone, true
      from clients c join private_contacts pc on pc.id = c.id where c.id = j.client_id;
  end if;
end $$;

create or replace function public.job_otps(p_job uuid) returns table (booking_id uuid, otp text)
language plpgsql stable security definer set search_path = public as $$
begin
  perform my_job(p_job);
  return query select o.booking_id, o.otp from booking_otps o join bookings b on b.id = o.booking_id where b.job_id = p_job;
end $$;

create or replace function public.add_document(p_type text, p_number text, p_expires date, p_photo text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not exists (select 1 from workers where id = auth.uid()) then raise exception 'Only workers add documents'; end if;
  if p_photo not like auth.uid()::text || '/documents/%' then raise exception 'Upload the photo first'; end if;
  if p_expires < current_date then raise exception 'This document has expired'; end if;
  insert into documents (worker_id, doc_type, doc_number, expires_on, photo_path)
  values (auth.uid(), p_type, trim(p_number), p_expires, p_photo) returning id into v_id;
  return v_id;
end $$;

create or replace function public.leaderboard(p_month date default date_trunc('month', now() at time zone 'Asia/Kolkata')::date)
returns table (worker_id uuid, full_name text, jobs bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not setting_bool('leaderboard_enabled') and not is_admin() then return; end if;
  return query
    select b.worker_id, p.full_name, count(distinct b.id)
    from bookings b join jobs j on j.id = b.job_id join clients c on c.id = j.client_id and c.verified
    join ratings r on r.booking_id = b.id and r.rater = 'client' and r.stars >= 4
    join profiles p on p.id = b.worker_id
    where b.check_out_at >= p_month and b.check_out_at < p_month + interval '1 month'
    group by b.worker_id, p.full_name order by 3 desc limit 50;
end $$;

-- Sign-in page: live count, shown only once the city passes the threshold.
create or replace function public.public_stats() returns jsonb
language sql stable security definer set search_path = public as $$
  with w as (select count(*) n, count(*) filter (where p.created_at > now() - interval '1 day') today
             from workers x join profiles p on p.id = x.id where not p.banned)
  select jsonb_build_object(
    'city', (select value #>> '{}' from settings where key = 'launch_city'),
    'workers', case when w.n >= setting_int('live_count_min') then w.n end,
    'today', case when w.n >= setting_int('live_count_min') then w.today end,
    'by_skill', case when w.n >= setting_int('live_count_min') then
       (select jsonb_object_agg(s, c) from (select unnest(skills) s, count(*) c from workers group by 1) t) end)
  from w
$$;

-- ---------------------------------------------------------------------------
-- Admin (Control Centre)
-- ---------------------------------------------------------------------------
create or replace function public.assert_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin if not is_admin() then raise exception 'Admins only'; end if; end $$;

create or replace function public.admin_set_ban(p_user uuid, p_banned boolean, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform assert_admin();
  update profiles set banned = p_banned, banned_until = case when p_banned then banned_until end,
         ban_reason = case when p_banned then coalesce(p_reason, 'Banned by admin') end where id = p_user;
end $$;

create or replace function public.admin_verify_client(p_client uuid, p_verified boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform assert_admin();
  update clients set verified = p_verified, verified_at = case when p_verified then now() end where id = p_client;
end $$;

create or replace function public.admin_clear_flags(p_client uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform assert_admin();
  update client_flags set cleared = true where client_id = p_client and not cleared;
  update clients set flags = 0 where id = p_client;
end $$;

create or replace function public.admin_resolve_dispute(p_dispute uuid, p_outcome text,
  p_flag_client boolean default false, p_reverse_noshow boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare d disputes; b bookings; j jobs;
begin
  perform assert_admin();
  select * into d from disputes where id = p_dispute for update;
  if not found or d.status <> 'open' then raise exception 'Dispute not open'; end if;
  select * into b from bookings where id = d.booking_id for update;
  select * into j from jobs where id = b.job_id;
  if p_reverse_noshow and b.no_show then
    update bookings set no_show = false where id = b.id;
    update workers set no_shows = greatest(0, no_shows - 1) where id = b.worker_id;
    perform add_slots(b.worker_id, setting_int('noshow_penalty'), 'Penalty reversed: ' || j.title, b.id);
    update profiles set banned_until = null where id = b.worker_id and ban_reason = 'Second no-show';
  end if;
  if p_flag_client then
    insert into client_flags (client_id, booking_id, reason) values (j.client_id, b.id, 'Dispute: ' || p_outcome);
    update clients set flags = flags + 1 where id = j.client_id;
  end if;
  update disputes set status = 'resolved', outcome = p_outcome, resolved_at = now() where id = d.id;
end $$;

create or replace function public.admin_review_document(p_doc uuid, p_approve boolean, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform assert_admin();
  update documents set status = case when p_approve then 'approved' else 'rejected' end,
         note = p_note, reviewed_at = now() where id = p_doc and status = 'pending';
  if not found then raise exception 'Document already reviewed'; end if;
end $$;

create or replace function public.admin_save_category(p_id int, p_name text, p_photo boolean, p_manual boolean,
  p_licence boolean, p_police boolean, p_note text, p_active boolean) returns int
language plpgsql security definer set search_path = public as $$
declare v_id int;
begin
  perform assert_admin();
  if p_id is null then
    insert into categories (name, needs_photo, needs_manual_approval, needs_driving_licence, needs_police_clearance, optional_note, active)
    values (trim(p_name), p_photo, p_manual, p_licence, p_police, nullif(p_note,''), coalesce(p_active,true)) returning id into v_id;
  else
    update categories set name = trim(p_name), needs_photo = p_photo, needs_manual_approval = p_manual,
      needs_driving_licence = p_licence, needs_police_clearance = p_police, optional_note = nullif(p_note,''), active = p_active
    where id = p_id returning id into v_id;
  end if;
  return v_id;
end $$;

create or replace function public.admin_adjust_slots(p_worker uuid, p_delta int, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform assert_admin();
  perform add_slots(p_worker, p_delta, 'Admin: ' || p_reason);
end $$;

create or replace function public.admin_set_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform assert_admin();
  update settings set value = p_value where key = p_key;
  if not found then raise exception 'Unknown setting'; end if;
end $$;

create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform assert_admin();
  return jsonb_build_object(
    'workers',         (select count(*) from workers),
    'workers_today',   (select count(*) from workers w join profiles p on p.id = w.id where p.created_at > now() - interval '1 day'),
    'clients',         (select count(*) from clients where verified),
    'clients_waiting', (select count(*) from clients where not verified),
    'jobs_month',      (select count(*) from jobs where created_at >= date_trunc('month', now())),
    'revenue_month_paise', (select coalesce(sum(amount_paise),0) from payments where status = 'paid' and paid_at >= date_trunc('month', now())),
    'disputes_open',   (select count(*) from disputes where status = 'open'),
    'docs_pending',    (select count(*) from documents where status = 'pending'),
    'flagged_clients', (select count(*) from clients where flags > 0)
  );
end $$;

-- ---------------------------------------------------------------------------
-- Server-only functions (service role): payments and KYC results
-- ---------------------------------------------------------------------------
create or replace function public.create_payment_order(p_worker uuid, p_order text, p_amount int, p_slots int) returns void
language sql security definer set search_path = public as $$
  insert into payments (worker_id, razorpay_order_id, amount_paise, slots) values (p_worker, p_order, p_amount, p_slots)
$$;

-- Idempotent: Razorpay can send the same event more than once.
create or replace function public.credit_payment(p_order text, p_payment text, p_amount int) returns boolean
language plpgsql security definer set search_path = public as $$
declare pay payments;
begin
  select * into pay from payments where razorpay_order_id = p_order for update;
  if not found then raise exception 'Unknown order %', p_order; end if;
  if pay.status = 'paid' then return false; end if;
  if p_amount <> pay.amount_paise then raise exception 'Amount mismatch for %', p_order; end if;
  update payments set status = 'paid', razorpay_payment_id = p_payment, paid_at = now() where id = pay.id;
  perform add_slots(pay.worker_id, pay.slots, 'Bought ' || pay.slots || ' slots (Rs ' || pay.amount_paise / 100 || ')', null, pay.id);
  return true;
end $$;

create or replace function public.set_kyc_result(p_worker uuid, p_status text, p_ref text, p_last4 text, p_hash text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status = 'verified' and exists (select 1 from workers where aadhaar_hash = p_hash and id <> p_worker) then
    update workers set kyc_status = 'failed', kyc_ref = p_ref where id = p_worker;
    raise exception 'This Aadhaar is already linked to another Krewgrid account';
  end if;
  update workers set kyc_status = p_status, kyc_ref = p_ref,
         aadhaar_last4 = case when p_status = 'verified' then p_last4 end,
         aadhaar_hash  = case when p_status = 'verified' then p_hash end,
         kyc_verified_at = case when p_status = 'verified' then now() end
   where id = p_worker;
end $$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.settings         enable row level security;
alter table public.profiles         enable row level security;
alter table public.private_contacts enable row level security;
alter table public.workers          enable row level security;
alter table public.clients          enable row level security;
alter table public.categories       enable row level security;
alter table public.jobs             enable row level security;
alter table public.bookings         enable row level security;
alter table public.booking_otps     enable row level security;
alter table public.slot_ledger      enable row level security;
alter table public.payments         enable row level security;
alter table public.ratings          enable row level security;
alter table public.disputes         enable row level security;
alter table public.client_flags     enable row level security;
alter table public.documents        enable row level security;
alter table public.messages         enable row level security;

create policy "read settings"   on public.settings   for select to authenticated using (true);
create policy "read categories" on public.categories for select to authenticated using (true);
create policy "read profiles"   on public.profiles   for select to authenticated using (true);
create policy "own contact"     on public.private_contacts for select to authenticated using (id = auth.uid() or is_admin());
create policy "own worker row"  on public.workers    for select to authenticated using (id = auth.uid() or is_admin());
create policy "own client row"  on public.clients    for select to authenticated using (id = auth.uid() or is_admin());
create policy "read jobs"       on public.jobs       for select to authenticated using (true);
create policy "read bookings"   on public.bookings   for select to authenticated using (
  worker_id = auth.uid() or is_admin() or exists (select 1 from jobs j where j.id = job_id and j.client_id = auth.uid()));
create policy "admin otps"      on public.booking_otps for select to authenticated using (is_admin());
create policy "own ledger"      on public.slot_ledger  for select to authenticated using (worker_id = auth.uid() or is_admin());
create policy "own payments"    on public.payments     for select to authenticated using (worker_id = auth.uid() or is_admin());
create policy "read ratings"    on public.ratings      for select to authenticated using (true);
create policy "dispute parties" on public.disputes     for select to authenticated using (
  raised_by = auth.uid() or is_admin() or exists (
    select 1 from bookings b join jobs j on j.id = b.job_id where b.id = booking_id and (b.worker_id = auth.uid() or j.client_id = auth.uid())));
create policy "admin flags"     on public.client_flags for select to authenticated using (is_admin());
create policy "own documents"   on public.documents    for select to authenticated using (worker_id = auth.uid() or is_admin());

create or replace function public.in_job_chat(p_job uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin()
      or exists (select 1 from jobs where id = p_job and client_id = auth.uid())
      or exists (select 1 from bookings where job_id = p_job and worker_id = auth.uid() and status = 'approved')
$$;

create or replace function public.chat_open(p_job uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from jobs where id = p_job and status <> 'cancelled' and ends_at > now() - interval '3 days')
$$;

create policy "chat read"  on public.messages for select to authenticated using (in_job_chat(job_id));
create policy "chat write" on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and in_job_chat(job_id) and chat_open(job_id));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke insert, update, delete on all tables in schema public from authenticated;
grant insert on public.messages to authenticated;
grant usage on sequence public.messages_id_seq to authenticated;
revoke all on public.worker_public, public.client_public from anon;
grant select on public.worker_public, public.client_public to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.complete_onboarding(text,text,text,text,text[],text[],text,text),
  public.update_my_profile(text,text,text,text[],text[],text),
  public.post_job(int,text,text,text,text,float8,float8,date,time,numeric,int,int,date,text,text,text,boolean),
  public.approve_booking(uuid), public.reject_booking(uuid), public.cancel_job(uuid),
  public.apply_to_job(uuid), public.check_in(uuid,text,float8,float8),
  public.request_early_checkout(uuid,text), public.decide_early_checkout(uuid,boolean,text),
  public.release_all(uuid), public.check_out(uuid,float8,float8,text),
  public.report_left_early(uuid), public.report_no_show(uuid), public.mark_paid(uuid),
  public.rate_booking(uuid,int,text), public.raise_dispute(uuid,text,text,text,float8,float8),
  public.report_payment_not_received(uuid,text), public.get_job_contacts(uuid), public.job_otps(uuid),
  public.add_document(text,text,date,text), public.leaderboard(date),
  public.admin_set_ban(uuid,boolean,text), public.admin_verify_client(uuid,boolean), public.admin_clear_flags(uuid),
  public.admin_resolve_dispute(uuid,text,boolean,boolean), public.admin_review_document(uuid,boolean,text),
  public.admin_save_category(int,text,boolean,boolean,boolean,boolean,text,boolean),
  public.admin_adjust_slots(uuid,int,text), public.admin_set_setting(text,jsonb), public.admin_stats(),
  public.is_admin(), public.level_name(int), public.level_rank(int),
  public.in_job_chat(uuid), public.chat_open(uuid), public.setting_int(text), public.setting_bool(text)
to authenticated;

grant execute on function public.public_stats() to anon, authenticated;

grant execute on function
  public.create_payment_order(uuid,text,int,int), public.credit_payment(text,text,int),
  public.set_kyc_result(uuid,text,text,text,text)
to service_role;

-- Live chat and live attendance
alter publication supabase_realtime add table public.messages, public.bookings;
