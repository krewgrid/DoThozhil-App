import React from 'react';
import { supabase } from '../../lib/supabase';
import { useLoad, must } from '../../lib/api';
import { adminSetSetting } from '../../lib/actions';
import { ActionForm, Body, H, Head } from '../../components/kg/ui';

const LABELS = {
  welcome_slots: 'Free slots for new workers',
  slot_pack_size: 'Slots in a pack',
  slot_pack_price_paise: 'Pack price in paise (20000 = ₹200)',
  noshow_penalty: 'No-show penalty (slots)',
  checkin_radius_m: 'Check-in distance limit (metres)',
  checkout_window_min: 'Check-out opens before end (minutes)',
  noshow_after_min: 'No-show can be reported after start (minutes)',
  new_account_active_limit: 'Active applications for new workers',
  kyc_required: 'Aadhaar KYC required to apply (true/false)',
  leaderboard_enabled: 'Leaderboard on (true/false)',
  leaderboard_prize_inr: 'Leaderboard prize (₹)',
  live_count_min: 'Show live worker count from',
  launch_city: 'City',
};

const Settings = () => {
  const q = useLoad(async () => must(await supabase.from('settings').select('*').order('key')) ?? [], []);
  return (
    <Body q={q}>{(rows) => <>
      <Head title="Settings" sub="Changes apply immediately. Turn the leaderboard on once slot revenue can pay the prize." />
      <div className="tw"><table><tbody>{rows.map((s) => (
        <tr key={s.key}><td><b>{LABELS[s.key] ?? s.key}</b><div className="faint mono" style={{ fontSize: 11.5 }}>{s.key}</div></td>
          <td><ActionForm run={adminSetSetting} className="inline" onDone={q.reload}><H name="key" value={s.key} />
            <input name="value" defaultValue={String(s.value)} style={{ width: 160 }} aria-label={LABELS[s.key] ?? s.key} /><button className="btn sm">Save</button></ActionForm></td></tr>
      ))}</tbody></table></div>
    </>}</Body>
  );
};

export default Settings;
