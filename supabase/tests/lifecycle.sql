-- End-to-end test of the Krewgrid rules. Run on a fresh database after stubs + migrations.
\set ON_ERROR_STOP 1
\pset tuples_only on
\o /dev/null
create or replace function expect_error(q text, needle text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then
    if position(lower(needle) in lower(sqlerrm)) = 0 then raise exception 'Expected "%" but got "%"', needle, sqlerrm; end if;
    raise notice 'ok (blocked): %', sqlerrm; return;
  end;
  raise exception 'Expected an error containing "%" for: %', needle, q;
end $$;
create or replace function as_user(u uuid) returns void language sql as $$ select set_config('request.jwt.claim.sub', u::text, false) $$;
create or replace function check_eq(label text, got anyelement, want anyelement) returns void language plpgsql as $$
begin if got is distinct from want then raise exception 'FAIL %: got %, want %', label, got, want; end if; raise notice 'ok: % = %', label, got; end $$;
grant execute on function expect_error(text,text), as_user(uuid) to authenticated, anon;
grant execute on function check_eq(text,anyelement,anyelement) to authenticated, anon;

insert into auth.users values
 ('00000000-0000-0000-0000-00000000000a','admin@x'), ('00000000-0000-0000-0000-00000000000c','client@x'),
 ('00000000-0000-0000-0000-000000000001','w1@x'), ('00000000-0000-0000-0000-000000000002','w2@x'),
 ('00000000-0000-0000-0000-000000000003','w3@x');

set role authenticated;
select as_user('00000000-0000-0000-0000-00000000000a');
select complete_onboarding('client','Luthu','98470 00000','Kochi','{}','{}','Krewgrid HQ',null);
select as_user('00000000-0000-0000-0000-00000000000c');
select complete_onboarding('client','Shameer A','98950 40211','Kaloor','{}','{}','Malabar Feasts Catering','Weddings');
select as_user('00000000-0000-0000-0000-000000000001');
select complete_onboarding('worker','Arjun Menon','98470 12345','Edappally','{Catering}','{Malayalam}');
select check_eq('welcome slots', (select slots from workers where id = auth.uid()), 5);
select expect_error($$select complete_onboarding('worker','X','98470 12345','Y')$$, 'already set up');
select as_user('00000000-0000-0000-0000-000000000002');
select complete_onboarding('worker','Fathima Rasheed','94460 22871','Kaloor','{Catering}','{Malayalam}');
select as_user('00000000-0000-0000-0000-000000000003');
select complete_onboarding('worker','Rahul P','70120 98431','Palarivattom','{Catering}','{Malayalam}');

-- RLS: a worker cannot read another worker's private row or write directly
select check_eq('other worker rows visible', (select count(*) from workers)::int, 1);
select expect_error($$update workers set slots = 999$$, 'permission denied');
select check_eq('cannot read OTP table', (select count(*) from booking_otps)::int, 0);

-- Make the admin
reset role; update profiles set is_admin = true where id = '00000000-0000-0000-0000-00000000000a'; set role authenticated;

-- Unverified client cannot post
select as_user('00000000-0000-0000-0000-00000000000c');
select expect_error($$select post_job(1,'Wedding serving','',  'Gokulam','Kaloor',9.99,76.29,current_date+1,'17:00',6,1100,2,current_date+2,'manual','any','',false)$$, 'verifying');
select expect_error($$select admin_verify_client(auth.uid(), true)$$, 'Admins only');
select as_user('00000000-0000-0000-0000-00000000000a');
select admin_verify_client('00000000-0000-0000-0000-00000000000c', true);

select as_user('00000000-0000-0000-0000-00000000000c');
create temp table ids (k text primary key, v uuid);
grant all on ids to authenticated;
insert into ids select 'J',  post_job(1,'Wedding reception serving','Black trousers','Gokulam Convention Centre','Kaloor',9.9946,76.2921,current_date+1,'17:00',6,1100,2,current_date+2,'manual','any','',false);
insert into ids select 'J2', post_job(1,'College fest counter','','Rajagiri','Kakkanad',10.01,76.36,current_date+3,'18:00',5,1000,10,current_date+4,'auto','any','',false);
insert into ids select 'J3', post_job(1,'Lunch serving','','Hyatt','Mulavukad',9.98,76.26,current_date+5,'11:00',5,1000,4,current_date+6,'auto','any','',false);
insert into ids select 'JV', post_job(5,'Valet parking','','Le Meridien','Maradu',9.95,76.31,current_date+6,'16:00',7,1500,5,current_date+7,'auto','any','',false);
select check_eq('valet slot cost', (select slot_cost from jobs where id = (select v from ids where k='JV')), 2);
insert into ids select 'JS', post_job(4,'Summit security','','Bolgatty','Mulavukad',null,null,current_date+2,'08:00',10,1400,8,current_date+3,'auto','any','',false);
select check_eq('security forces manual', (select approval_mode from jobs where id = (select v from ids where k='JS')), 'manual');

-- Worker: KYC gate, apply, duplicates, limits, requirements
select as_user('00000000-0000-0000-0000-000000000001');
select expect_error($$select apply_to_job((select v from ids where k='J'))$$, 'Verify your Aadhaar');
reset role;
set role service_role;
select set_kyc_result('00000000-0000-0000-0000-000000000001','verified','zoop-1','4417','hashA');
select set_kyc_result('00000000-0000-0000-0000-000000000002','verified','zoop-2','1111','hashB');
select set_kyc_result('00000000-0000-0000-0000-000000000003','verified','zoop-3','2222','hashC');
select expect_error($$select set_kyc_result('00000000-0000-0000-0000-000000000003','verified','zoop-4','2222','hashA')$$, 'already linked');
reset role; set role authenticated;
select as_user('00000000-0000-0000-0000-000000000003');
select expect_error($$select set_kyc_result(auth.uid(),'verified','x','1234','h')$$, 'permission denied');
reset role; update workers set kyc_status='verified' where id='00000000-0000-0000-0000-000000000003'; set role authenticated;

select as_user('00000000-0000-0000-0000-000000000001');
select check_eq('manual apply', apply_to_job((select v from ids where k='J')), 'applied');
select check_eq('slots after apply', (select slots from workers where id = auth.uid()), 4);
select expect_error($$select apply_to_job((select v from ids where k='J'))$$, 'already applied');
select check_eq('auto apply', apply_to_job((select v from ids where k='J2')), 'approved');
select expect_error($$select apply_to_job((select v from ids where k='J3'))$$, 'New accounts can hold 2');
select expect_error($$select apply_to_job((select v from ids where k='JV'))$$, 'driving licence');
select check_eq('ledger rows', (select count(*) from slot_ledger where worker_id = auth.uid())::int, 3);

-- Client rejects W1: slot comes back
select as_user('00000000-0000-0000-0000-00000000000c');
select reject_booking((select id from bookings where job_id=(select v from ids where k='J') and worker_id='00000000-0000-0000-0000-000000000001'));
select as_user('00000000-0000-0000-0000-000000000001');
select check_eq('slot refunded on reject', (select slots from workers where id = auth.uid()), 4);

-- W2 and W3 apply to J, client approves both and gets OTPs
select as_user('00000000-0000-0000-0000-000000000002'); select apply_to_job((select v from ids where k='J'));
select as_user('00000000-0000-0000-0000-000000000003'); select apply_to_job((select v from ids where k='J'));
select as_user('00000000-0000-0000-0000-00000000000c');
insert into ids select 'B2', id from bookings where job_id=(select v from ids where k='J') and worker_id='00000000-0000-0000-0000-000000000002';
insert into ids select 'B3', id from bookings where job_id=(select v from ids where k='J') and worker_id='00000000-0000-0000-0000-000000000003';
select length(approve_booking((select v from ids where k='B2'))) = 4 as otp_ok;
select approve_booking((select v from ids where k='B3'));
select check_eq('client sees OTPs', (select count(*) from job_otps((select v from ids where k='J')))::int, 2);
select check_eq('client sees worker phones', (select count(*) from get_job_contacts((select v from ids where k='J')))::int, 2);

select as_user('00000000-0000-0000-0000-000000000002');
select check_eq('worker sees client phone', (select phone from get_job_contacts((select v from ids where k='J'))), '98950 40211');
select expect_error($$select * from job_otps((select v from ids where k='J'))$$, 'not found');
select as_user('00000000-0000-0000-0000-000000000001');
select check_eq('rejected worker sees no phones', (select count(*) from get_job_contacts((select v from ids where k='J')))::int, 0);

-- Chat
select as_user('00000000-0000-0000-0000-000000000002');
insert into messages (job_id, sender_id, body) values ((select v from ids where k='J'), auth.uid(), 'Reaching by 4:40');
select as_user('00000000-0000-0000-0000-000000000001');
select expect_error($$insert into messages (job_id, sender_id, body) values ((select v from ids where k='J'), auth.uid(), 'hi')$$, 'row-level security');
select check_eq('outsider cannot read chat', (select count(*) from messages)::int, 0);

-- Move job J to have started 10 minutes ago (India time)
reset role;
update jobs set work_date = (now() at time zone 'Asia/Kolkata')::date,
                start_time = ((now() at time zone 'Asia/Kolkata') - interval '10 minutes')::time
 where id = (select v from ids where k='J');
set role authenticated;

select as_user('00000000-0000-0000-0000-000000000002');
select expect_error($$select check_in((select v from ids where k='B2'),'0000',9.9946,76.2921)$$, 'does not match');
select expect_error($$select check_in((select v from ids where k='B2'),(select otp from booking_otps limit 1),9.90,76.29)$$, 'from the venue');
reset role; create temp table o2 as select otp from booking_otps where booking_id=(select v from ids where k='B2'); grant select on o2 to authenticated; set role authenticated;
select check_in((select v from ids where k='B2'),(select otp from o2),9.9950,76.2925);
select expect_error($$select check_out((select v from ids where k='B2'),9.9946,76.2921,auth.uid()||'/checkout/a.jpg')$$, 'Check-out opens');
select request_early_checkout((select v from ids where k='B2'),'Family emergency');
select as_user('00000000-0000-0000-0000-00000000000c');
select decide_early_checkout((select v from ids where k='B2'), true, 'hours');
select as_user('00000000-0000-0000-0000-000000000002');
select expect_error($$select check_out((select v from ids where k='B2'),9.9946,76.2921,'someone/checkout/a.jpg')$$, 'photo');
reset role; update bookings set check_in_at = now() - interval '3 hours' where id = (select v from ids where k='B2'); set role authenticated;
select check_eq('hours-worked pay (3 of 6 hrs)', check_out((select v from ids where k='B2'),9.9946,76.2921,auth.uid()||'/checkout/a.jpg'), 550);
select check_eq('completed jobs', (select completed_jobs from workers where id=auth.uid()), 1);

-- W3 never checks in. No-show only after 30 minutes.
select as_user('00000000-0000-0000-0000-00000000000c');
select expect_error($$select report_no_show((select v from ids where k='B3'))$$, 'minutes after the start');
reset role; update jobs set start_time = ((now() at time zone 'Asia/Kolkata') - interval '45 minutes')::time where id=(select v from ids where k='J'); set role authenticated;
select check_eq('first no-show', report_no_show((select v from ids where k='B3')), 'penalised');
reset role;
select check_eq('penalty applied', (select slots from workers where id='00000000-0000-0000-0000-000000000003'), 5 - 1 - 10);
set role authenticated;

-- Ratings both ways
select rate_booking((select v from ids where k='B2'), 5, 'Great');
select as_user('00000000-0000-0000-0000-000000000002');
select rate_booking((select v from ids where k='B2'), 4, '');
select expect_error($$select rate_booking((select v from ids where k='B2'), 4, '')$$, 'already rated');

-- Payment not received: only after the payment date; flags client, no ban
select expect_error($$select report_payment_not_received((select v from ids where k='B2'),'')$$, 'has not passed');
reset role; update jobs set payment_date = current_date - 1 where id=(select v from ids where k='J'); set role authenticated;
select report_payment_not_received((select v from ids where k='B2'),'Not paid');
reset role;
select check_eq('client flagged', (select flags from clients where id='00000000-0000-0000-0000-00000000000c'), 1);
select check_eq('client not banned', (select banned from profiles where id='00000000-0000-0000-0000-00000000000c'), false);
set role authenticated;

-- W3 disputes the no-show; admin reverses it
select as_user('00000000-0000-0000-0000-000000000003');
insert into ids select 'D', raise_dispute((select v from ids where k='B3'),'noshow_wrong','I was at gate 2', auth.uid()||'/disputes/p.jpg', 9.99, 76.29);
select as_user('00000000-0000-0000-0000-00000000000a');
select check_eq('admin stats disputes', (admin_stats()->>'disputes_open')::int, 2);
select admin_resolve_dispute((select v from ids where k='D'),'Worker was at the venue', false, true);
reset role;
select check_eq('penalty reversed', (select slots from workers where id='00000000-0000-0000-0000-000000000003'), -6 + 10);
set role authenticated;

-- Licence: worker adds, admin approves, valet job opens (W2 has 1 job so no new-account limit)
select as_user('00000000-0000-0000-0000-000000000002');
select add_document('driving_licence','KL-07 2020 0012345', current_date + 1000, auth.uid()||'/documents/dl.jpg');
select expect_error($$select apply_to_job((select v from ids where k='JV'))$$, 'driving licence');
select as_user('00000000-0000-0000-0000-00000000000a');
select admin_review_document((select id from documents limit 1), true, null);
select as_user('00000000-0000-0000-0000-000000000002');
select check_eq('valet after licence', apply_to_job((select v from ids where k='JV')), 'approved');

-- Payments: idempotent credit, server only
reset role; set role service_role;
select create_payment_order('00000000-0000-0000-0000-000000000001','order_1',20000,10);
select check_eq('first credit', credit_payment('order_1','pay_1',20000), true);
select check_eq('duplicate webhook ignored', credit_payment('order_1','pay_1',20000), false);
select expect_error($$select credit_payment('order_1x','pay_2',20000)$$, 'Unknown order');
reset role;
select check_eq('slots after purchase', (select slots from workers where id='00000000-0000-0000-0000-000000000001'), 14);
set role authenticated; select as_user('00000000-0000-0000-0000-000000000001');
select expect_error($$select credit_payment('order_1','pay_1',20000)$$, 'permission denied');

-- Cancel refunds: W1 was auto-approved on J2
select as_user('00000000-0000-0000-0000-00000000000c');
select cancel_job((select v from ids where k='J2'));
reset role;
select check_eq('refund on cancel', (select slots from workers where id='00000000-0000-0000-0000-000000000001'), 15);

-- Escalating bans
update bookings set no_show=false;
update workers set no_shows = 1 where id='00000000-0000-0000-0000-000000000003';
update bookings set no_show=false where id=(select v from ids where k='B3');
set role authenticated; select as_user('00000000-0000-0000-0000-00000000000c');
select check_eq('second no-show', report_no_show((select v from ids where k='B3')), 'suspended');
select as_user('00000000-0000-0000-0000-000000000003');
select expect_error($$select apply_to_job((select v from ids where k='J3'))$$, 'suspended until');

-- Public stats hide the count below the threshold
reset role; set role anon;
select check_eq('live count hidden', (public_stats()->>'workers'), null::text);
select expect_error($$select * from jobs$$, 'permission denied');
reset role;
\echo ALL TESTS PASSED
