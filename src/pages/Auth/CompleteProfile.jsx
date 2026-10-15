import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoad, must } from '../../lib/api';
import { useMe, homeFor, signOut } from '../../lib/session';
import { completeOnboarding } from '../../lib/actions';
import { ActionForm } from '../../components/kg/ui';

// Onboarding: choose worker or client. New workers get the welcome slots;
// clients wait for krewgrid to verify them before posting.
const CompleteProfile = () => {
  const me = useMe();
  const navigate = useNavigate();
  const cats = useLoad(async () => must(await supabase.from('categories').select('name').eq('active', true).order('id')), []);

  if (me.loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000', color: '#aaa' }}>Loading securely...</div>;
  if (!me.user) return <Navigate to="/login" replace />;
  if (me.profile) return <Navigate to={homeFor(me)} replace />;
  const name = me.user.user_metadata?.full_name ?? me.user.user_metadata?.name ?? '';

  return (
    <div className="min-h-screen w-full p-2 md:p-4 bg-black">
      <div className="relative min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-2xl md:rounded-[2rem]" style={{ background: 'linear-gradient(to bottom right, #1DBC60, #191919)' }}>
        <div className="kg" style={{ maxWidth: 780, margin: '0 auto', padding: '40px 16px 60px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="row between">
            <span style={{ fontSize: 24, fontWeight: 700, color: '#E1E0CC' }}>krewgrid</span>
            <button className="linkish" onClick={signOut}>Sign out</button>
          </div>
          <h1>Set up your account</h1>
          <p className="muted">Signed in as {me.user.email}. You can't switch roles later, so choose carefully.</p>
          <ActionForm run={completeOnboarding} className="stack" onDone={async () => { const m = await me.refresh(); navigate(homeFor(m), { replace: true }); }}>
            <div className="choice" role="radiogroup" aria-label="I am">
              <div><input type="radio" id="r-w" name="role" value="worker" defaultChecked /><label htmlFor="r-w"><b>I want event work</b><span className="muted">Catering, setup, security, valet, cleaning and more. 5 free slots to start.</span></label></div>
              <div><input type="radio" id="r-c" name="role" value="client" /><label htmlFor="r-c"><b>I'm hiring workers</b><span className="muted">Caterers, event managers, families, companies, colleges. Posting is free.</span></label></div>
            </div>
            <div className="card form">
              <div className="fld"><label htmlFor="o-n">Your full name</label><input id="o-n" name="full_name" defaultValue={name} required minLength={2} /></div>
              <div className="fld"><label htmlFor="o-p">Phone number</label><input id="o-p" name="phone" required inputMode="tel" placeholder="98470 12345" pattern="[0-9+ ]{10,16}" /></div>
              <div className="fld"><label htmlFor="o-a">Area in Kochi</label><input id="o-a" name="area" required placeholder="e.g. Edappally" /></div>
              <div className="fld"><label htmlFor="o-l">Languages (workers)</label><input id="o-l" name="languages" placeholder="Malayalam, English" /></div>
              <fieldset className="fld full" style={{ border: 0, padding: 0, margin: 0 }}>
                <legend style={{ marginBottom: 6 }}>Work you do (workers)</legend>
                <div className="row">{(cats.data ?? []).map((c) => (
                  <label key={c.name} className="check"><input type="checkbox" name="skills" value={c.name} /> {c.name}</label>
                ))}</div>
              </fieldset>
              <div className="fld"><label htmlFor="o-o">Business or event name (clients)</label><input id="o-o" name="org_name" placeholder="e.g. Malabar Feasts Catering" /></div>
              <div className="fld"><label htmlFor="o-ab">What you hire for (clients)</label><input id="o-ab" name="about" placeholder="Weddings, about 4 events a month" /></div>
              <p className="note fld full">Your phone number is shared only with people you're booked with: the client sees approved workers' numbers, and approved workers see the client's.</p>
            </div>
            <div><button className="btn p">Continue</button></div>
          </ActionForm>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
