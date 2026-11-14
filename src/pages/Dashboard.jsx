import React, { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Clock3, FileText, Plus, Share2, Stethoscope, UploadCloud } from 'lucide-react';
import { Badge, Button, EmptyState } from '../components/UI';
import RecordViewer from '../components/RecordViewer';
import { useApp } from '../context/AppContext';
import { formatDate, getTime, isShareActive, sortNewest } from '../lib/validators';

export default function Dashboard({ navigate, startUpload }) {
  const { user, data } = useApp();
  const [viewer, setViewer] = useState(null);
  const ownRecords = useMemo(() => data.records.filter((r)=>r.ownerUid===user.uid), [data.records,user.uid]);
  const ownAppointments = data.appointments.filter((a)=>a.ownerUid===user.uid);
  const ownShares = data.shares.filter((s)=>s.ownerUid===user.uid && isShareActive(s));
  const upcoming = [...ownAppointments].filter((a)=>a.status!=='completed' && new Date(a.datetime)>new Date()).sort((a,b)=>new Date(a.datetime)-new Date(b.datetime))[0];
  const stats = [
    { title: 'Reports', number: ownRecords.length, description: 'Lab tests, scans and medical files', icon: FileText, route: '/app/documents' },
    { title: 'Prescriptions', number: data.prescriptions.filter((p)=>p.ownerUid===user.uid).length, description: 'Medicine, dosage and doctor', icon: Stethoscope, route: '/app/prescriptions' },
    { title: 'Appointments', number: ownAppointments.length, description: 'Upcoming and previous visits', icon: CalendarDays, route: '/app/appointments' },
    { title: 'Shared access', number: ownShares.length, description: 'Currently active grants', icon: Share2, route: '/app/sharing' }
  ];
  return <>
    <div className="page-heading heading-with-action"><div><span className="eyebrow">Overview</span><h1>Welcome back, {user?.displayName?.split(' ')[0] || 'there'} <span className="wave">✳</span></h1><p>Your health records, in one secure place.</p></div>
      <Button onClick={startUpload}><UploadCloud size={17}/> Upload report</Button></div>
    <div className="stats-grid">{stats.map(({title,number,description,icon:Icon,route})=><button className="stat-card" key={title} onClick={()=>navigate(route)}><div className="stat-top"><span className="stat-icon"><Icon size={20}/></span><ArrowRight size={17}/></div><h3>{number.toString().padStart(2,'0')}</h3><strong>{title}</strong><p>{description}</p></button>)}</div>
    <div className="dashboard-lower"><section className="content-card"><div className="card-heading"><div><h2>Recent documents</h2><p>Your latest medical files</p></div><button className="link-button" onClick={()=>navigate('/app/documents')}>View all <ArrowRight size={16}/></button></div>
      {ownRecords.length ? <div className="record-list">{sortNewest(ownRecords).slice(0,4).map((record)=><div className="record-row" key={record.id}><span className="file-square"><FileText size={18}/></span><div className="record-primary"><strong>{record.title}</strong><small>Uploaded {formatDate(record.createdAt)}</small></div><Badge>{record.category}</Badge><Button variant="outline" onClick={()=>setViewer(record)}>View</Button></div>)}</div>
        : <EmptyState icon={FileText} title="Your vault is ready" description="Upload the first medical document to get started." action={<Button onClick={startUpload}><Plus size={16}/> Add report</Button>}/>}
    </section>
    <section className="content-card"><div className="card-heading"><div><h2>Next appointment</h2><p>Stay ahead of your visits</p></div><span className="heading-icon"><CalendarDays size={21}/></span></div>
      {upcoming ? <div className="upcoming-highlight"><span className="upcoming-date"><strong>{new Date(upcoming.datetime).toLocaleDateString('en-IN',{day:'2-digit'})}</strong><small>{new Date(upcoming.datetime).toLocaleDateString('en-IN',{month:'short'}).toUpperCase()}</small></span><div><h3>{upcoming.doctor}</h3><strong>{upcoming.specialty}</strong><p><Clock3 size={15}/> {formatDate(upcoming.datetime)} · {getTime(upcoming.datetime)}</p><p>{upcoming.reason}</p></div></div> : <EmptyState icon={CalendarDays} title="No upcoming visits" description="Add an appointment to keep your schedule organized."/>}
      <div className="card-bottom"><span>Everything in one health timeline</span><Button variant="outline" onClick={()=>navigate('/app/appointments')}>Open history <ArrowRight size={15}/></Button></div>
    </section></div>
    <div className="tip-card"><span><Share2 size={21}/></span><div><strong>Share securely, only when needed</strong><p>Give a verified recipient access to one record for 24 hours, 7 days or 30 days.</p></div><button className="link-button" onClick={()=>navigate('/app/sharing')}>Manage sharing <ArrowRight size={16}/></button></div>
    {viewer && <RecordViewer record={viewer} onClose={()=>setViewer(null)}/>}
  </>;
}
