import React from 'react';
import { supabase } from '../../lib/supabase';
import { useLoad } from '../../lib/api';
import { useMe } from '../../lib/session';
import { Body, Head, Pill } from '../../components/kg/ui';

const TIERS = [['Blue', 10], ['Silver', 50], ['Gold', 100]];

const Levels = () => {
  const { worker } = useMe();
  const q = useLoad(async () => {
    const [{ data: on }, { data: prize }] = await Promise.all([
      supabase.rpc('setting_bool', { k: 'leaderboard_enabled' }),
      supabase.rpc('setting_int', { k: 'leaderboard_prize_inr' }),
    ]);
    const { data: board } = on ? await supabase.rpc('leaderboard') : { data: [] };
    return { on, prize, board: board ?? [] };
  }, []);
  const n = worker.completed_jobs;
  return (
    <Body q={q}>{({ on, prize, board }) => <>
      <Head title="Levels" sub="A job counts only with an OTP check-in and a photo check-out." />
      <div className="grid g3">{TIERS.map(([name, at]) => (
        <div key={name} className="card stack" style={n >= at ? { borderColor: '#1DBC60' } : undefined}>
          <div className="row between"><span className={`lvl ${name}`}>{name}</span><span className="faint num">{at} jobs</span></div>
          <div className="bar"><i style={{ width: `${Math.min(100, (n / at) * 100)}%` }} /></div>
          <span className="note num">{Math.min(n, at)}/{at}{n >= at ? ' · earned' : ''}</span>
        </div>
      ))}</div>
      {on ? (
        <div className="stack">
          <div className="card row between"><div><h3>This month's prize: ₹{Number(prize ?? 0).toLocaleString('en-IN')}</h3><p className="muted">Ranked by completed jobs rated 4★ or higher by verified clients.</p></div><Pill>Resets on the 1st</Pill></div>
          <div className="tw"><table><thead><tr><th>Rank</th><th>Worker</th><th style={{ textAlign: 'right' }}>Jobs</th></tr></thead>
            <tbody>{board.map((r, i) => (
              <tr key={r.worker_id} style={r.worker_id === worker.id ? { background: 'rgba(29,188,96,.16)' } : undefined}>
                <td className="mono">#{i + 1}</td><td>{r.full_name}{r.worker_id === worker.id && ' (you)'}</td><td className="num" style={{ textAlign: 'right' }}>{r.jobs}</td></tr>
            ))}</tbody></table></div>
        </div>
      ) : (
        <div className="card dashed stack">
          <div className="row between"><h3>Monthly leaderboard</h3><Pill>Coming soon</Pill></div>
          <p className="muted">A cash prize for the most reliable worker each month. It starts once krewgrid is earning enough to fund it. Jobs you complete now still build your level.</p>
        </div>
      )}
    </>}</Body>
  );
};

export default Levels;
