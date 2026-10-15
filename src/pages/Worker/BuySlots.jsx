import React from 'react';
import { supabase } from '../../lib/supabase';
import { useLoad, must } from '../../lib/api';
import { useMe } from '../../lib/session';
import { dateTime } from '../../lib/format';
import { Body, Head, Stat } from '../../components/kg/ui';
import { BuySlots as Checkout } from '../../components/kg/Lists';

// Slot packs via Razorpay, plus the full slot history (ledger).
const BuySlots = () => {
  const me = useMe();
  const { profile, worker, phone } = me;
  const q = useLoad(async () => {
    const [log, settings] = await Promise.all([
      supabase.from('slot_ledger').select('*').eq('worker_id', worker.id).order('created_at', { ascending: false }).limit(100).then(must),
      supabase.from('settings').select('key, value').in('key', ['slot_pack_size', 'slot_pack_price_paise', 'noshow_penalty']).then(must),
    ]);
    return { log: log ?? [], s: Object.fromEntries((settings ?? []).map((r) => [r.key, Number(r.value)])) };
  }, [worker.id]);

  return (
    <Body q={q}>{({ log, s }) => {
      const pack = s.slot_pack_size ?? 10, price = (s.slot_pack_price_paise ?? 20000) / 100;
      return <>
        <Head title="Slots" sub="Each application costs one or more slots. Your wage is never cut." />
        <div className="grid g3">
          <Stat k="Balance" v={`${worker.slots} slots`} s={worker.slots < 0 ? 'Top up to apply again' : 'ready to use'} />
          <div className="card stack"><span className="eyebrow">Slot pack</span>
            <div className="row between"><b style={{ fontSize: 24 }}>{pack} slots</b><b style={{ fontSize: 24 }}>₹{price}</b></div>
            <Checkout pack={pack} price={price} name={profile.full_name} phone={phone ?? ''} onDone={() => { q.reload(); me.refresh(); }} />
            <p className="note">UPI, cards, net banking or wallets through Razorpay.</p></div>
          <div className="card stack"><span className="eyebrow">Rules</span>
            <p style={{ fontSize: 13.5 }}>Client rejects you or cancels: slot refunded.<br />No-show: minus {s.noshow_penalty ?? 10} slots.<br />Balance can go below zero after a penalty.</p></div>
        </div>
        <div className="stack"><h2>History</h2>
          <div className="tw"><table><thead><tr><th>When</th><th>What</th><th style={{ textAlign: 'right' }}>Slots</th></tr></thead>
            <tbody>{log.map((l) => (
              <tr key={l.id}><td className="num">{dateTime(l.created_at)}</td><td>{l.reason}</td>
                <td className="num mono" style={{ textAlign: 'right', color: l.delta > 0 ? '#7ee2a8' : '#f6a399' }}>{l.delta > 0 ? '+' : ''}{l.delta}</td></tr>
            ))}</tbody></table></div></div>
      </>;
    }}</Body>
  );
};

export default BuySlots;
