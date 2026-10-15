import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoad, must, signedUrls } from '../../lib/api';
import { bookingStatus, clock, day, money, time } from '../../lib/format';
import { Body, Head, Level, Loading, Page, Pill } from '../../components/kg/ui';

// Admin view of one work: OTPs, GPS distances, check-out photos, payment state.
const WorkDetail = () => {
  const { id } = useParams();
  const q = useLoad(async () => {
    const j = must(await supabase.from('jobs').select('*').eq('id', id).maybeSingle());
    if (!j) return { missing: true };
    const [bookings, client, contacts] = await Promise.all([
      supabase.from('bookings').select('*').eq('job_id', id).order('created_at').then(must),
      supabase.from('clients').select('org_name, contact_name, flags').eq('id', j.client_id).single().then((r) => r.data),
      supabase.rpc('get_job_contacts', { p_job: id }).then((r) => r.data),
    ]);
    const bIds = (bookings ?? []).map((b) => b.id);
    const [wp, otps] = await Promise.all([
      bIds.length ? supabase.from('worker_public').select('id, full_name, completed_jobs').in('id', bookings.map((b) => b.worker_id)).then(must) : [],
      bIds.length ? supabase.from('booking_otps').select('*').in('booking_id', bIds).then(must) : [],
    ]);
    return {
      j, client, bookings: bookings ?? [],
      W: Object.fromEntries((wp ?? []).map((w) => [w.id, w])),
      otp: Object.fromEntries((otps ?? []).map((o) => [o.booking_id, o.otp])),
      ph: Object.fromEntries((contacts ?? []).map((c) => [c.person_id, c.phone])),
      urls: await signedUrls((bookings ?? []).map((b) => b.check_out_photo)),
    };
  }, [id]);
  if (q.data?.missing) return <Page><Loading error="Work not found." /></Page>;
  return (
    <Body q={q}>{({ j, client, bookings, W, otp, ph, urls }) => <>
      <Head title={j.title} sub={`${client?.org_name} (${client?.contact_name}) · ${day(j.work_date)} · ${clock(j.start_time)} · ${j.hours} hrs · ${j.venue} · ${money(j.pay)} · pay by ${day(j.payment_date)}`}>
        <Link className="btn" to={`/control-centre/chat/${j.id}`}>Read job chat</Link>
        {client && client.flags > 0 && <Pill tone="warn">Client has {client.flags} flag(s)</Pill>}
      </Head>
      <div className="tw"><table>
        <thead><tr><th>Worker</th><th>Application</th><th>OTP</th><th>Check-in (GPS)</th><th>Check-out (photo)</th><th>Status</th><th>Pay</th></tr></thead>
        <tbody>{bookings.map((b) => { const [l, t] = bookingStatus(b, j); return (
          <tr key={b.id}>
            <td><b>{W[b.worker_id]?.full_name}</b> <Level jobs={W[b.worker_id]?.completed_jobs ?? 0} />{ph[b.worker_id] && <div className="mono faint" style={{ fontSize: 12 }}>{ph[b.worker_id]}</div>}</td>
            <td>{b.status} · {b.slots_spent} slot(s)</td>
            <td className="mono">{otp[b.id] ?? '—'}</td>
            <td className="num">{b.check_in_at ? `${time(b.check_in_at)} · ${b.check_in_dist_m ?? '?'} m` : '—'}</td>
            <td className="num">{b.check_out_at ? <>{time(b.check_out_at)} · {b.check_out_dist_m ?? '?'} m {b.check_out_photo && urls[b.check_out_photo] && <a href={urls[b.check_out_photo]} target="_blank" rel="noreferrer">photo</a>}</> : '—'}</td>
            <td><Pill tone={t}>{l}</Pill></td>
            <td>{b.status !== 'approved' ? '' : b.paid_at ? <Pill tone="good">Paid {money(b.final_pay)}</Pill> : <Pill>Not yet</Pill>}</td>
          </tr>); })}</tbody>
      </table></div>
    </>}</Body>
  );
};

export default WorkDetail;
