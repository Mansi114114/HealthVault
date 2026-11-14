import React, { useState } from 'react';
import { CalendarDays, CheckCheck, CheckCircle2, Clock3, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, EmptyState, FormField, FormMessage, Modal, useSubmit } from '../components/UI';
import { useApp } from '../context/AppContext';
import { formatDate, getTime } from '../lib/validators';

const init = () => ({ doctor:'', specialty:'', datetime:'', reason:'', notes:'', status:'confirmed' });
function AppointmentItem({ appointment, onDetails, onComplete, onDelete }) {
  const date = new Date(appointment.datetime);
  const isPast = appointment.status === 'completed' || date < new Date();
  return <div className="appointment-item"><div className="date-square"><strong>{date.toLocaleDateString('en-IN',{day:'2-digit'})}</strong><span>{date.toLocaleDateString('en-IN',{month:'short'}).toUpperCase()}</span></div>
    <div className="appointment-detail"><strong>{appointment.doctor}</strong><span>{appointment.specialty}</span><small>{getTime(appointment.datetime)} · {appointment.reason}</small></div>
    <Badge tone={isPast ? 'gray' : 'teal'}>{isPast ? 'Past visit' : 'Confirmed'}</Badge>
    <button className="small-outline" onClick={()=>onDetails(appointment)}>{isPast ? 'Notes' : 'Details'}</button>
    <button className="icon-btn delete-control" title="Delete visit" aria-label={`Delete visit with ${appointment.doctor}`} onClick={()=>onDelete(appointment)}><Trash2 size={16}/></button>
  </div>;
}
export default function Appointments() {
  const { user, data, actions } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(init);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const submit = useSubmit();
  const appointments = data.appointments.filter((a)=>a.ownerUid===user.uid);
  const upcoming = appointments.filter((a)=>a.status!=='completed' && new Date(a.datetime)>=new Date()).sort((a,b)=>new Date(a.datetime)-new Date(b.datetime));
  const previous = appointments.filter((a)=>a.status==='completed' || new Date(a.datetime)<new Date()).sort((a,b)=>new Date(b.datetime)-new Date(a.datetime));
  const update = (field,value) => setForm((prev)=>({...prev,[field]:value}));
  const add = async (e) => { e.preventDefault(); const ok = await submit.run(()=>actions.addAppointment(form)); if(ok){setOpen(false);setForm(init());} };
  const markComplete = async (item) => { try { await actions.updateAppointment(item.id,{status:'completed'}); setDetails(null); } catch(e) { setError(e.message); } };
  const remove = async (item) => { if(!window.confirm(`Delete appointment with ${item.doctor}?`))return; try { await actions.deleteAppointment(item); }catch(e){setError(e.message);} };
  return <>
    <div className="page-heading heading-with-action"><div><span className="eyebrow">Health timeline</span><h1>Appointments</h1><p>Upcoming visits and your complete history.</p></div><Button onClick={()=>setOpen(true)}><Plus size={17}/> Add appointment</Button></div>
    {error && <FormMessage message={error}/>}
    <div className="appointment-grid"><section className="content-card appointment-card"><div className="card-heading"><div><h2>Upcoming</h2><p>{upcoming.length} scheduled visits</p></div><Clock3 size={19} className="soft-icon"/></div>
      {upcoming.length ? upcoming.map((a)=><AppointmentItem key={a.id} appointment={a} onDetails={setDetails} onDelete={remove}/>) : <EmptyState icon={CalendarDays} title="You're all caught up" description="No upcoming appointments scheduled."/>}
    </section>
    <section className="content-card appointment-card"><div className="card-heading"><div><h2>Past visits</h2><p>Notes from previous appointments</p></div><CheckCheck size={19} className="soft-icon"/></div>
      {previous.length ? previous.map((a)=><AppointmentItem key={a.id} appointment={a} onDetails={setDetails} onDelete={remove}/>) : <EmptyState icon={CheckCircle2} title="No previous visits" description="Past appointments appear here automatically."/>}
    </section></div>
    {open && <Modal title="Add appointment" subtitle="Save an upcoming or completed medical visit." onClose={()=>setOpen(false)}><form className="modal-form" onSubmit={add}>
      <div className="form-columns"><FormField label="Doctor"><input required value={form.doctor} onChange={(e)=>update('doctor',e.target.value)} placeholder="Dr. A. Sharma"/></FormField><FormField label="Specialty"><input required value={form.specialty} onChange={(e)=>update('specialty',e.target.value)} placeholder="Cardiology"/></FormField></div>
      <FormField label="Date and time"><input required type="datetime-local" value={form.datetime} onChange={(e)=>update('datetime',e.target.value)}/></FormField>
      <div className="form-columns"><FormField label="Reason"><input value={form.reason} onChange={(e)=>update('reason',e.target.value)} placeholder="Follow-up"/></FormField><FormField label="Visit status"><select value={form.status} onChange={(e)=>update('status',e.target.value)}><option value="confirmed">Confirmed</option><option value="completed">Completed</option></select></FormField></div>
      <FormField label="Notes"><textarea rows="3" value={form.notes} onChange={(e)=>update('notes',e.target.value)} placeholder="Bring previous reports; doctor recommendations…"/></FormField>
      <FormMessage message={submit.message}/><div className="modal-actions"><Button variant="outline" type="button" onClick={()=>setOpen(false)}>Cancel</Button><Button type="submit" loading={submit.busy}>Save appointment</Button></div>
    </form></Modal>}
    {details && <Modal title="Appointment details" subtitle={formatDate(details.datetime)} onClose={()=>setDetails(null)}><div className="detail-list"><div><span>Doctor</span><strong>{details.doctor}</strong></div><div><span>Specialty</span><strong>{details.specialty}</strong></div><div><span>Time</span><strong>{getTime(details.datetime)}</strong></div><div><span>Reason</span><strong>{details.reason || 'Not specified'}</strong></div><div className="detail-notes"><span>Visit notes</span><strong>{details.notes || 'No notes added.'}</strong></div></div><div className="modal-actions"><Button variant="outline" onClick={()=>setDetails(null)}>Close</Button>{details.status!=='completed' && <Button onClick={()=>markComplete(details)}><CheckCircle2 size={16}/> Mark completed</Button>}</div></Modal>}
  </>;
}
