import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoad, must } from '../../lib/api';
import { day, todayIST } from '../../lib/format';
import { Body, Head, Pill } from '../../components/kg/ui';

const Works = () => {
  const q = useLoad(async () => {
    const rows = must(await supabase.from('jobs').select('id, title, work_date, workers_needed, status, payment_date, client_id, bookings(status, check_in_at, check_out_at, no_show, early_status, paid_at)').order('starts_at', { ascending: false }).limit(200)) ?? [];
    const ids = [...new Set(rows.map((r) => r.client_id))];
    const cl = ids.length ? must(await supabase.from('clients').select('id, org_name').in('id', ids)) ?? [] : [];
    return { rows, cn: Object.fromEntries(cl.map((c) => [c.id, c.org_name])) };
  }, []);
  const today = todayIST();
  return (
    <Body q={q}>{({ rows, cn }) => <>
      <Head title="All works" sub="Open any work to check who was present." />
      <div className="tw"><table>
        <thead><tr><th>Work</th><th>Client</th><th>Date</th><th>Booked</th><th>Checked in</th><th>To check</th></tr></thead>
        <tbody>{rows.map((j) => {
          const bk = j.bookings.filter((b) => b.status === 'approved');
          const prob = bk.filter((b) => b.no_show || b.early_status === 'pending' || (b.check_out_at && !b.paid_at && j.payment_date < today)).length;
          return (
            <tr key={j.id}>
              <td><Link to={`/control-centre/works/${j.id}`}><b>{j.title}</b></Link>{j.status !== 'open' && <> <Pill>{j.status}</Pill></>}</td>
              <td>{cn[j.client_id]}</td><td className="num">{day(j.work_date)}</td>
              <td className="num">{bk.length}/{j.workers_needed}</td><td className="num">{bk.filter((b) => b.check_in_at).length}</td>
              <td>{prob ? <Pill tone="warn">{prob}</Pill> : <span className="faint">—</span>}</td>
            </tr>
          );
        })}</tbody>
      </table></div>
    </>}</Body>
  );
};

export default Works;
