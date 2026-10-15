import React from 'react';
import { supabase } from '../../lib/supabase';
import { useLoad, must } from '../../lib/api';
import { adminSaveCategory } from '../../lib/actions';
import { ActionForm, Body, H, Head } from '../../components/kg/ui';

function CatForm({ c, onDone }) {
  const k = c?.id ?? 'new';
  return (
    <ActionForm run={adminSaveCategory} className="form" onDone={onDone} reset={!c}>
      {c && <H name="id" value={c.id} />}
      <div className="fld"><label htmlFor={`n${k}`}>Name</label><input id={`n${k}`} name="name" defaultValue={c?.name} required placeholder="e.g. Anchor / Emcee" /></div>
      <div className="fld"><label htmlFor={`o${k}`}>Note for workers</label><input id={`o${k}`} name="optional_note" defaultValue={c?.optional_note ?? ''} /></div>
      <div className="fld full row">
        <label className="check"><input type="checkbox" name="needs_photo" defaultChecked={c?.needs_photo} /> Profile photo</label>
        <label className="check"><input type="checkbox" name="needs_manual_approval" defaultChecked={c?.needs_manual_approval} /> Client approves each</label>
        <label className="check"><input type="checkbox" name="needs_driving_licence" defaultChecked={c?.needs_driving_licence} /> Driving licence</label>
        <label className="check"><input type="checkbox" name="needs_police_clearance" defaultChecked={c?.needs_police_clearance} /> Police clearance</label>
        {c && <label className="check"><input type="checkbox" name="active" value="off" defaultChecked={!c.active} /> Hide category</label>}
      </div>
      <div className="fld full"><div><button className="btn sm p">{c ? 'Save' : 'Add category'}</button></div></div>
    </ActionForm>
  );
}

const Categories = () => {
  const q = useLoad(async () => must(await supabase.from('categories').select('*').order('id')) ?? [], []);
  return (
    <Body q={q}>{(cats) => <>
      <Head title="Categories" sub="Each category sets who may apply. Every worker needs Aadhaar KYC on top of these." />
      {cats.map((c) => (
        <details key={c.id} className="card"><summary>{c.name}{!c.active && ' (hidden)'}</summary><div style={{ marginTop: 12 }}><CatForm c={c} onDone={q.reload} /></div></details>
      ))}
      <div className="card stack"><h3>New category</h3><CatForm onDone={q.reload} /></div>
    </>}</Body>
  );
};

export default Categories;
