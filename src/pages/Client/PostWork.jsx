import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoad, must } from '../../lib/api';
import { useMe } from '../../lib/session';
import { postJob } from '../../lib/actions';
import { todayIST } from '../../lib/format';
import { ActionForm, Body, Empty, Head } from '../../components/kg/ui';
import { LocateButton } from '../../components/kg/Forms';

const PostWork = () => {
  const { client } = useMe();
  const navigate = useNavigate();
  const q = useLoad(async () => must(await supabase.from('categories').select('*').eq('active', true).order('id')) ?? [], []);
  const today = todayIST();
  return (
    <Body q={q}>{(cats) => <>
      <Head title="Post a work" sub="Workers near the venue see it straight away. Posting is free." />
      {!client.verified ? <Empty>You can post once krewgrid has verified your account.</Empty> : (
        <ActionForm run={postJob} className="card form" onDone={(r) => navigate(`/client/works/${r.data}`)}>
          <div className="fld full"><label htmlFor="p-t">Work title</label><input id="p-t" name="title" required minLength={3} maxLength={90} placeholder="e.g. Wedding reception serving" /></div>
          <div className="fld"><label htmlFor="p-c">Category</label>
            <select id="p-c" name="category">{cats.map((c) =>
              <option key={c.id} value={c.id}>{c.name}{c.needs_driving_licence ? ' (licence needed)' : c.needs_manual_approval ? ' (you approve each)' : ''}</option>)}</select></div>
          <div className="fld"><label htmlFor="p-d">Date</label><input id="p-d" type="date" name="work_date" required min={today} /></div>
          <div className="fld"><label htmlFor="p-s">Start time</label><input id="p-s" type="time" name="start_time" required defaultValue="17:00" /></div>
          <div className="fld"><label htmlFor="p-h">Hours of work</label><input id="p-h" type="number" name="hours" min={1} max={18} step={0.5} required defaultValue={6} /></div>
          <div className="fld"><label htmlFor="p-v">Venue</label><input id="p-v" name="venue" required placeholder="e.g. Gokulam Convention Centre" /></div>
          <div className="fld"><label htmlFor="p-a">Area</label><input id="p-a" name="area" required placeholder="e.g. Kaloor" /></div>
          <div className="fld full"><label>Venue location (for GPS check-in within 300 m)</label>
            <div className="row nowrap"><input name="lat" placeholder="Latitude e.g. 9.99460" inputMode="decimal" style={{ maxWidth: 200 }} /><input name="lng" placeholder="Longitude e.g. 76.29210" inputMode="decimal" style={{ maxWidth: 200 }} /></div>
            <LocateButton />
            <span className="note">Or in Google Maps, long-press the venue and copy the numbers. Without a location, check-in only needs the OTP.</span></div>
          <div className="fld"><label htmlFor="p-pay">Pay per worker (₹)</label><input id="p-pay" type="number" name="pay" min={100} step={50} required defaultValue={1100} /></div>
          <div className="fld"><label htmlFor="p-n">Workers needed</label><input id="p-n" type="number" name="needed" min={1} max={500} required defaultValue={6} /></div>
          <div className="fld"><label htmlFor="p-pd">Payment date</label><input id="p-pd" type="date" name="payment_date" required min={today} /></div>
          <div className="fld"><label htmlFor="p-m">Approval</label><select id="p-m" name="mode"><option value="manual">I approve each worker</option><option value="auto">Auto-approve, first come first served</option></select></div>
          <div className="fld"><label htmlFor="p-l">Minimum level</label><select id="p-l" name="min_level"><option value="any">Any</option><option value="blue">Blue (10+ jobs)</option><option value="silver">Silver (50+)</option><option value="gold">Gold (100+)</option></select></div>
          <div className="fld"><label htmlFor="p-lang">Language</label><select id="p-lang" name="language"><option value="">Any</option><option>Malayalam</option><option>English</option><option>Hindi</option><option>Tamil</option></select></div>
          <div className="fld full"><label htmlFor="p-desc">Description</label><textarea id="p-desc" name="description" placeholder="Dress code, what to bring, where to report" /></div>
          <label className="check fld full" style={{ flexDirection: 'row' }}><input type="checkbox" name="photo_approval" /> Approve applicants by photo (security, front desk)</label>
          <div className="fld full"><div className="row"><button className="btn p">Post work</button><span className="note">Jobs paying ₹1,400 or more cost workers 2 slots to apply.</span></div></div>
        </ActionForm>
      )}
    </>}</Body>
  );
};

export default PostWork;
