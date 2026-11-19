import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, Clock3, FileText, LockKeyhole, RefreshCw, Search, Share2, ShieldCheck, UsersRound } from 'lucide-react';
import { Badge, Button, EmptyState, FormMessage } from '../components/UI';
import RecordViewer from '../components/RecordViewer';
import { useApp } from '../context/AppContext';
import { formatDate, isShareActive, sortNewest } from '../lib/validators';

const dateMillis = (value) => value?.toMillis ? value.toMillis() : new Date(value || 0).getTime();
const isExpiringSoon = (share) => isShareActive(share) && dateMillis(share.expiresAt) - Date.now() <= 7 * 86400000;
const toRecord = (share) => ({
  id: share.recordId, ownerUid: share.ownerUid, title: share.recordTitle,
  category: share.category, fileName: share.fileName, mimeType: share.mimeType,
  storagePath: share.storagePath, chunkCount: share.chunkCount,
});
const shortReference = (uid) => `Patient HV-${String(uid).slice(-6).toUpperCase()}`;

export default function DoctorDashboard({ navigate, view = 'overview' }) {
  const { user, data, actions } = useApp();
  const [viewer, setViewer] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [expandedPatient, setExpandedPatient] = useState('');
  const [expiryWindow, setExpiryWindow] = useState(7);
  const [activity, setActivity] = useState([]);
  const [activityError, setActivityError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const received = useMemo(() => data.shares.filter((share) =>
    share.ownerUid !== user.uid && share.recipientEmail?.toLowerCase() === user.email?.toLowerCase()), [data.shares, user]);
  const active = received.filter(isShareActive);
  const expiring = active.filter(isExpiringSoon).sort((a, b) => dateMillis(a.expiresAt) - dateMillis(b.expiresAt));
  const patientGroups = [...received.reduce((groups, share) => {
    const group = groups.get(share.ownerUid) || { ownerUid: share.ownerUid, shares: [] };
    group.shares.push(share);
    groups.set(share.ownerUid, group);
    return groups;
  }, new Map()).values()].sort((a, b) => dateMillis(sortNewest(b.shares)[0]?.createdAt) - dateMillis(sortNewest(a.shares)[0]?.createdAt));
  const visiblePatients = patientGroups.filter((patient) =>
    shortReference(patient.ownerUid).toLowerCase().includes(patientSearch.trim().toLowerCase()));

  const loadActivity = async () => {
    setRefreshing(true);
    setActivityError('');
    try { setActivity(await actions.loadRecipientActivity(received)); }
    catch (error) { setActivityError(error.message || 'Could not load record activity.'); }
    finally { setRefreshing(false); }
  };
  const shareKey = received.map((share) => share.id).sort().join('|');
  useEffect(() => { loadActivity(); /* Refresh when grants or demo activity change. */ }, [shareKey, data.logs]); // eslint-disable-line react-hooks/exhaustive-deps

  const recentActivity = [...activity].sort((a, b) => dateMillis(b.viewedAt) - dateMillis(a.viewedAt));
  const matchedActivity = recentActivity.filter((entry) => {
    const share = received.find((item) => item.id === entry.shareId);
    return `${share?.recordTitle || ''} ${share?.category || ''}`.toLowerCase().includes(activitySearch.trim().toLowerCase());
  });
  const stats = [
    { label: 'Shared records', value: received.length, note: 'All access grants', icon: FileText, route: '/app/sharing' },
    { label: 'Available now', value: active.length, note: 'Unexpired access', icon: LockKeyhole, route: '/app/sharing' },
    { label: 'Expiring soon', value: expiring.length, note: 'Within 7 days', icon: Clock3, route: '/app/doctor/expiring' },
    { label: 'Patient access', value: patientGroups.filter((patient) => patient.shares.some(isShareActive)).length, note: 'With active grants', icon: UsersRound, route: '/app/doctor/patients' },
  ];
  const titles = { overview: 'Doctor dashboard', patients: 'Patient access', expiring: 'Expiring soon', activity: 'Activity log' };

  return <>
    <div className="page-heading heading-with-action"><div><span className="eyebrow">Doctor workspace</span><h1>{view === 'overview' ? `Welcome back, ${user?.displayName?.split(' ').slice(-1)[0] || 'Doctor'}` : titles[view]}</h1><p>{view === 'patients' ? 'Find patients who have shared records and review their current grants.' : view === 'expiring' ? 'Prioritize access grants that will end soon.' : view === 'activity' ? 'Review and search your in-app record viewing history.' : 'Review the records patients have shared with your verified account.'}</p></div>
      {view === 'overview' && <Button variant="outline" onClick={() => navigate('/app/sharing')}><Share2 size={16}/> Shared records</Button>}
      {view === 'patients' && <label className="search-field"><Search size={16}/><input value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} placeholder="Search patient reference" aria-label="Search patient references"/></label>}
      {view === 'activity' && <Button variant="outline" disabled={refreshing} onClick={loadActivity}><RefreshCw size={15} className={refreshing ? 'spin' : ''}/> Refresh activity</Button>}
    </div>

    {view === 'overview' && <>
      <div className="stats-grid">{stats.map(({ label, value, note, icon: Icon, route }) => <button key={label} className="stat-card" onClick={() => navigate(route)}><div className="stat-top"><span className="stat-icon"><Icon size={20}/></span><ArrowRight size={17}/></div><h3>{String(value).padStart(2, '0')}</h3><strong>{label}</strong><p>{note}</p></button>)}</div>
      <div className="dashboard-lower doctor-dashboard-lower">
        <section className="content-card"><div className="card-heading"><div><h2>Next access expiry</h2><p>Closest patient grant ending</p></div><span className="heading-icon"><Clock3 size={20}/></span></div>
          {expiring[0] ? <div className="upcoming-highlight"><span className="upcoming-date"><strong>{new Date(dateMillis(expiring[0].expiresAt)).toLocaleDateString('en-IN', { day: '2-digit' })}</strong><small>{new Date(dateMillis(expiring[0].expiresAt)).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</small></span><div><h3>{expiring[0].recordTitle}</h3><strong>{expiring[0].category || 'Medical record'}</strong><p>Access ends {formatDate(expiring[0].expiresAt)}</p></div></div> : <EmptyState icon={Clock3} title="No upcoming expiries" description="Active grants ending within 7 days will appear here."/>}
          <div className="card-bottom"><span>{expiring.length} grant{expiring.length === 1 ? '' : 's'} ending within 7 days</span><Button variant="outline" onClick={() => navigate('/app/doctor/expiring')}>Review grants <ArrowRight size={15}/></Button></div>
        </section>
        <section className="content-card"><div className="card-heading"><div><h2>Recent record activity</h2><p>Your latest in-app opens</p></div><button className="link-button" onClick={loadActivity} disabled={refreshing}><RefreshCw size={14} className={refreshing ? 'spin' : ''}/> Refresh</button></div>
          {recentActivity.length ? <div className="audit-list">{recentActivity.slice(0, 5).map((entry) => { const share = received.find((item) => item.id === entry.shareId); return <div className="audit-item" key={entry.id}><span className="audit-icon"><Activity size={15}/></span><div><strong>{share?.recordTitle || 'Shared record'}</strong><small>{share?.category || 'Medical record'}</small></div><time>{formatDate(entry.viewedAt)}</time></div>; })}</div> : <EmptyState icon={Activity} title="No recent opens" description="Records you open in HealthVault will appear here."/>}
          <div className="card-bottom"><span>Access is logged for shared records</span><Button variant="outline" onClick={() => navigate('/app/doctor/activity')}>Open activity <ArrowRight size={15}/></Button></div>
        </section>
      </div>
    </>}

    {view === 'patients' && <section className="content-card doctor-records"><div className="card-heading"><div><h2>Patient access directory</h2><p>References group grants without exposing patient names or email addresses.</p></div><span className="heading-icon"><UsersRound size={20}/></span></div>
      {visiblePatients.length ? <div className="share-list">{visiblePatients.map((patient) => {
        const current = patient.shares.filter(isShareActive);
        const expanded = expandedPatient === patient.ownerUid;
        return <div className="patient-access-group" key={patient.ownerUid}><button className="share-item patient-access-toggle" aria-expanded={expanded} onClick={() => setExpandedPatient(expanded ? '' : patient.ownerUid)}><div className="share-icon"><UsersRound size={18}/></div><div className="share-details"><strong>{shortReference(patient.ownerUid)}</strong><small>{patient.shares.length} shared record{patient.shares.length === 1 ? '' : 's'} · {current.length} currently available</small></div><Badge tone={current.length ? 'teal' : 'gray'}>{current.length ? 'Active access' : 'No active access'}</Badge><ArrowRight size={17}/></button>
          {expanded && <div className="patient-access-records">{sortNewest(patient.shares).map((share) => <div className="record-row" key={share.id}><span className="file-square"><FileText size={17}/></span><div className="record-primary"><strong>{share.recordTitle}</strong><small>{isShareActive(share) ? `Available until ${formatDate(share.expiresAt)}` : share.revoked ? 'Access revoked' : 'Access expired'}</small></div><Button variant="outline" disabled={!isShareActive(share)} onClick={() => setViewer({ record: toRecord(share), share })}>Open</Button></div>)}</div>}
        </div>;
      })}</div> : <EmptyState icon={UsersRound} title={patientGroups.length ? 'No matching patient' : 'No patient access yet'} description={patientGroups.length ? 'Try a different patient reference.' : 'Patients appear here after they share a record with your account.'}/>}
    </section>}

    {view === 'expiring' && <section className="content-card doctor-records"><div className="card-heading"><div><h2>Access expiry queue</h2><p>Filter active grants by how soon they end.</p></div><span className="heading-icon"><Clock3 size={20}/></span></div>
      <div className="filter-pills expiry-pills">{[1, 3, 7].map((days) => <button className={`filter-pill ${expiryWindow === days ? 'selected' : ''}`} key={days} onClick={() => setExpiryWindow(days)}>Next {days === 1 ? '24 hours' : `${days} days`}</button>)}</div>
      {(() => { const queue = expiring.filter((share) => dateMillis(share.expiresAt) - Date.now() <= expiryWindow * 86400000); return queue.length ? <div className="record-list">{queue.map((share) => {
        const hours = Math.max(0, Math.ceil((dateMillis(share.expiresAt) - Date.now()) / 3600000));
        return <div className="record-row" key={share.id}><span className="file-square"><Clock3 size={18}/></span><div className="record-primary"><strong>{share.recordTitle}</strong><small>{shortReference(share.ownerUid)} · Expires {formatDate(share.expiresAt)}</small></div><Badge tone="gray">{hours < 24 ? `${hours}h left` : `${Math.ceil(hours / 24)}d left`}</Badge><Button variant="outline" onClick={() => setViewer({ record: toRecord(share), share })}>Review</Button></div>;
      })}</div> : <EmptyState icon={Clock3} title="No grants in this window" description={`There are no active shared records ending in the next ${expiryWindow === 1 ? '24 hours' : `${expiryWindow} days`}.`}/>; })()}
    </section>}

    {view === 'activity' && <section className="content-card doctor-records"><div className="card-heading"><div><h2>Record access history</h2><p>Only opens performed in this app are recorded.</p></div><span className="heading-icon"><Activity size={20}/></span></div>
      <div className="documents-tools"><label className="search-field"><Search size={16}/><input value={activitySearch} onChange={(event) => setActivitySearch(event.target.value)} placeholder="Search activity by record" aria-label="Search activity by record"/></label><span className="status-note">{matchedActivity.length} event{matchedActivity.length === 1 ? '' : 's'}</span></div>
      {activityError && <FormMessage message={activityError}/>}
      {matchedActivity.length ? <div className="audit-list">{matchedActivity.map((entry) => { const share = received.find((item) => item.id === entry.shareId); return <div className="audit-item" key={entry.id}><span className="audit-icon"><Activity size={15}/></span><div><strong>{share?.recordTitle || 'Shared record'}</strong><small>{share?.category || 'Medical record'} · {share ? shortReference(share.ownerUid) : 'Patient'}</small></div><time>{formatDate(entry.viewedAt)}</time></div>; })}</div> : !activityError && <EmptyState icon={Activity} title={activity.length ? 'No matching activity' : 'No record activity yet'} description={activity.length ? 'Try another record name or category.' : 'In-app record opens will appear here.'}/>}
    </section>}

    {view === 'overview' && <div className="tip-card"><span><ShieldCheck size={21}/></span><div><strong>Patient controlled access</strong><p>Each patient decides which records to share and for how long.</p></div><button className="link-button" onClick={() => navigate('/app/sharing')}>Review shared records <ArrowRight size={16}/></button></div>}
    {viewer && <RecordViewer record={viewer.record} share={viewer.share} onClose={() => setViewer(null)}/>}
  </>;
}
