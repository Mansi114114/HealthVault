import React, { useState } from 'react';
import { FileText, Plus, Stethoscope, Trash2 } from 'lucide-react';
import { Button, EmptyState, FormField, FormMessage, Modal, useSubmit } from '../components/UI';
import RecordViewer from '../components/RecordViewer';
import { useApp } from '../context/AppContext';
import { formatDate } from '../lib/validators';

const initial = () => ({ medicine: '', dosage: '', doctor: '', date: new Date().toISOString().slice(0,10), recordId: '', notes: '' });
export default function Prescriptions() {
  const { user, data, actions } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [viewer, setViewer] = useState(null);
  const [error, setError] = useState('');
  const submit = useSubmit();
  const records = data.records.filter((r)=>r.ownerUid===user.uid);
  const prescriptions = [...data.prescriptions.filter((p)=>p.ownerUid===user.uid)].sort((a,b)=>b.date.localeCompare(a.date));
  const update = (field,value) => setForm((prev)=>({...prev,[field]:value}));
  const add = async (e) => {
    e.preventDefault();
    const ok = await submit.run(()=>actions.addPrescription(form));
    if (ok) { setOpen(false); setForm(initial()); }
  };
  const remove = async (p) => { if (!window.confirm(`Remove prescription for ${p.medicine}?`)) return; try { await actions.deletePrescription(p); } catch(e) { setError(e.message); } };
  return <>
    <div className="page-heading heading-with-action"><div><span className="eyebrow">Medication journal</span><h1>Prescriptions</h1><p>Medicine, dosage and doctor, with the original file linked.</p></div><Button onClick={()=>setOpen(true)}><Plus size={17}/> Add prescription</Button></div>
    {error && <FormMessage message={error}/>}
    <section className="content-card prescription-card">
      {prescriptions.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Medicine</th><th>Dosage</th><th>Doctor</th><th>Date</th><th>File</th><th aria-label="Actions"/></tr></thead><tbody>{prescriptions.map((p)=>{
        const linked = records.find((r)=>r.id===p.recordId);
        return <tr key={p.id}><td><strong>{p.medicine}</strong>{p.notes && <small className="table-note">{p.notes}</small>}</td><td>{p.dosage}</td><td>{p.doctor}</td><td className="text-muted">{formatDate(`${p.date}T12:00:00`)}</td><td>{linked ? <Button variant="outline" onClick={()=>setViewer(linked)}><FileText size={15}/> View file</Button> : <span className="text-muted">Not attached</span>}</td><td><button className="icon-btn delete-control" aria-label={`Delete ${p.medicine}`} title="Delete prescription" onClick={()=>remove(p)}><Trash2 size={17}/></button></td></tr>;
      })}</tbody></table></div> : <EmptyState icon={Stethoscope} title="No prescriptions yet" description="Keep medicines, doses and doctor's instructions in one place." action={<Button onClick={()=>setOpen(true)}><Plus size={16}/> Add prescription</Button>}/>}
    </section>
    {open && <Modal title="Add prescription" subtitle="Save medication details and optionally link a medical report." onClose={()=>setOpen(false)}><form className="modal-form" onSubmit={add}>
      <div className="form-columns"><FormField label="Medicine name"><input required value={form.medicine} onChange={(e)=>update('medicine',e.target.value)} placeholder="e.g. Vitamin D3"/></FormField><FormField label="Dosage / frequency"><input required value={form.dosage} onChange={(e)=>update('dosage',e.target.value)} placeholder="e.g. 5 mg · once daily"/></FormField></div>
      <div className="form-columns"><FormField label="Doctor"><input required value={form.doctor} onChange={(e)=>update('doctor',e.target.value)} placeholder="Dr. A. Sharma"/></FormField><FormField label="Prescribed date"><input required type="date" value={form.date} onChange={(e)=>update('date',e.target.value)}/></FormField></div>
      <FormField label="Attach an existing document (optional)"><select value={form.recordId} onChange={(e)=>update('recordId',e.target.value)}><option value="">No file attached</option>{records.map((r)=><option value={r.id} key={r.id}>{r.title}</option>)}</select></FormField>
      <FormField label="Notes (optional)"><textarea rows="3" value={form.notes} onChange={(e)=>update('notes',e.target.value)} placeholder="Doctor's instructions or reminders"/></FormField>
      <FormMessage message={submit.message}/><div className="modal-actions"><Button variant="outline" type="button" onClick={()=>setOpen(false)}>Cancel</Button><Button type="submit" loading={submit.busy}>Save prescription</Button></div>
    </form></Modal>}
    {viewer && <RecordViewer record={viewer} onClose={()=>setViewer(null)}/>}
  </>;
}
