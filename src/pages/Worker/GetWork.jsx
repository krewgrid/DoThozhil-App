import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoad, must } from '../../lib/api';
import { useMe } from '../../lib/session';
import { applyToJob } from '../../lib/actions';
import { clock, day, km, money, todayIST } from '../../lib/format';
import { ActionForm, Body, Empty, H, Head, Pill } from '../../components/kg/ui';

// Find work: jobs from verified clients, filter by category/date/pay, sort by soonest, pay or distance.
const GetWork = () => {
  const me = useMe();
  const { worker } = me;
  const [sp, setSp] = useSearchParams();
  const [locMsg, setLocMsg] = useState(null);
  const f = Object.fromEntries(sp.entries());

  const q = useLoad(async () => {
    const [cats, mine] = await Promise.all([
      supabase.from('categories').select('*').eq('active', true).order('id').then(must),
      supabase.from('bookings').select('job_id, status').eq('worker_id', worker.id).then(must),
    ]);
    let jq = supabase.from('jobs').select('*').eq('status', 'open').gt('starts_at', new Date().toISOString()).limit(100);
    if (f.cat) jq = jq.eq('category_id', Number(f.cat));
    if (f.date) jq = jq.eq('work_date', f.date);
    if (f.min && Number(f.min) > 0) jq = jq.gte('pay', Number(f.min));
    const jobs = must(await jq) ?? [];
    const ids = [...new Set(jobs.map((j) => j.client_id))];
    const cl = ids.length ? must(await supabase.from('client_public').select('*').in('id', ids)) : [];
    return { cats: cats ?? [], mine: mine ?? [], jobs, cl: cl ?? [] };
  }, [sp.toString(), worker.id]);

  function submit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = {};
    for (const [k, v] of fd.entries()) if (v) next[k] = v;
    setSp(next);
  }

  function nearMe(e) {
    const form = e.currentTarget.form;
    if (!navigator.geolocation) { setLocMsg('No location access'); return; }
    setLocMsg('Locating…');
    navigator.geolocation.getCurrentPosition((p) => {
      form.elements.namedItem('lat').value = p.coords.latitude.toFixed(5);
      form.elements.namedItem('lng').value = p.coords.longitude.toFixed(5);
      form.elements.namedItem('sort').value = 'near';
      setLocMsg(null);
      form.requestSubmit();
    }, () => setLocMsg('Location blocked'), { timeout: 15000 });
  }

  return (
    <Body q={q}>{({ cats, mine, jobs: raw, cl }) => {
      const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));
      const applied = Object.fromEntries(mine.map((b) => [b.job_id, b.status]));
      const client = Object.fromEntries(cl.map((c) => [c.id, c]));
      let jobs = raw;
      if (f.q) {
        const t = f.q.toLowerCase();
        jobs = jobs.filter((j) => `${j.title} ${j.venue} ${j.area}`.toLowerCase().includes(t));
      }
      const lat = f.lat ? Number(f.lat) : null, lng = f.lng ? Number(f.lng) : null;
      const dist = (j) => (lat != null && lng != null && j.lat != null && j.lng != null ? km(lat, lng, j.lat, j.lng) : null);
      const sort = f.sort ?? (lat != null ? 'near' : 'soon');
      jobs = [...jobs].sort(sort === 'pay' ? (a, b) => b.pay - a.pay
        : sort === 'near' ? (a, b) => (dist(a) ?? 9e9) - (dist(b) ?? 9e9)
        : (a, b) => a.starts_at.localeCompare(b.starts_at));

      return <>
        <Head title="Find work" sub="Jobs from verified clients only. If a client rejects you or cancels, your slots come back.">
          <Pill>{worker.slots} slots</Pill>
        </Head>
        <form className="card form" onSubmit={submit} key={sp.toString()}>
          <div className="fld"><label htmlFor="f-q">Search</label><input id="f-q" name="q" defaultValue={f.q} placeholder="Job name, venue or area" /></div>
          <div className="fld"><label htmlFor="f-c">Category</label>
            <select id="f-c" name="cat" defaultValue={f.cat ?? ''}><option value="">All</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="fld"><label htmlFor="f-d">Date</label><input id="f-d" type="date" name="date" defaultValue={f.date} min={todayIST()} /></div>
          <div className="fld"><label htmlFor="f-m">Pay from</label>
            <select id="f-m" name="min" defaultValue={f.min ?? '0'}>{[0, 800, 1000, 1200, 1500].map((v) => <option key={v} value={v}>{v ? money(v) : 'Any'}</option>)}</select></div>
          <div className="fld"><label htmlFor="f-s">Sort</label>
            <select id="f-s" name="sort" defaultValue={sort}><option value="soon">Soonest</option><option value="pay">Highest pay</option><option value="near">Nearest</option></select></div>
          <input type="hidden" name="lat" defaultValue={f.lat} /><input type="hidden" name="lng" defaultValue={f.lng} />
          <div className="row" style={{ alignSelf: 'end' }}><button className="btn p">Search</button><button type="button" className="btn" onClick={nearMe}>Near me</button>{locMsg && <span className="note">{locMsg}</span>}</div>
        </form>

        {jobs.length === 0 ? <Empty>No jobs match. Clear a filter to see more.</Empty> : (
          <div className="grid g2">{jobs.map((j) => {
            const c = client[j.client_id], cat = catMap[j.category_id], d = dist(j), st = applied[j.id];
            const tags = [
              j.min_level !== 'any' && `Min level: ${j.min_level}`, j.photo_approval && 'Photo approval',
              cat?.needs_driving_licence && 'Driving licence', cat?.needs_police_clearance && 'Police clearance',
              j.language && `Language: ${j.language}`,
            ].filter(Boolean);
            const s = j.slot_cost > 1 ? 's' : '';
            return (
              <article key={j.id} className="job">
                <div className="row between" style={{ alignItems: 'flex-start' }}><div><span className="eyebrow">{cat?.name}</span><h3 style={{ marginTop: 3 }}>{j.title}</h3></div><div className="pay">{money(j.pay)}</div></div>
                <dl className="kv">
                  <dt>When</dt><dd className="num">{day(j.work_date)} · {clock(j.start_time)} · {j.hours} hrs</dd>
                  <dt>Where</dt><dd>{j.venue}, {j.area}{d != null && ` · ${d.toFixed(1)} km`}</dd>
                  <dt>Client</dt><dd>{c?.org_name} <Pill tone="good">Verified</Pill>{c?.rating && ` · ★ ${c.rating}`}</dd>
                  <dt>Paid by</dt><dd>{day(j.payment_date)}</dd>
                  <dt>Spots</dt><dd>{j.workers_needed} · {j.approval_mode === 'auto' ? 'auto-approve' : 'client approves'}</dd>
                </dl>
                {j.description && <p className="faint" style={{ fontSize: 13 }}>{j.description}</p>}
                {tags.length > 0 && <div className="row">{tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
                {st ? <div><Pill tone="info">{st === 'applied' ? 'Applied' : st === 'approved' ? 'Booked' : st === 'rejected' ? 'Not selected' : 'Cancelled'}</Pill></div> : (
                  <ActionForm run={applyToJob} className="row between" confirm={`Spend ${j.slot_cost} slot${s}? Tap again`} onDone={() => { q.reload(); me.refresh(); }}>
                    <H name="job" value={j.id} />
                    <span className="note">{j.slot_cost} slot{s} to apply</span>
                    <button className="btn p">Apply · {j.slot_cost} slot{s}</button>
                  </ActionForm>
                )}
              </article>
            );
          })}</div>
        )}
      </>;
    }}</Body>
  );
};

export default GetWork;
