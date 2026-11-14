import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, Clock3, Copy, Eye, FileText, Link2, LockKeyhole, RefreshCw, Share2, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge, Button, EmptyState, FormField, FormMessage, useSubmit } from '../components/UI';
import RecordViewer from '../components/RecordViewer';
import { useApp } from '../context/AppContext';
import { formatDate, getTime, isShareActive, sortNewest } from '../lib/validators';

export default function Sharing() {
  const { user, data, actions, demoMode } = useApp();
  const [selectedRecord, setSelectedRecord] = useState('');
  const [email, setEmail] = useState('');
  const [duration, setDuration] = useState(7);
  const [lastLink, setLastLink] = useState('');
  const [viewer, setViewer] = useState(null);
  const [logs, setLogs] = useState([]);
  const [auditError, setAuditError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const form = useSubmit();
  const ownedRecords = data.records.filter((r)=>r.ownerUid===user.uid);
  const ownedShares = useMemo(() => data.shares.filter((s)=>s.ownerUid===user.uid), [data.shares,user.uid]);
  const receivedShares = data.shares.filter((s)=>s.recipientEmail===user.email && s.ownerUid!==user.uid);
  const idKey = ownedShares.map((s)=>s.id).sort().join('|');
  const refreshLogs = async () => {
    setRefreshing(true); setAuditError('');
    try { setLogs(await actions.loadAuditLogs(ownedShares)); }
    catch(e) { setAuditError(e.message); }
    finally { setRefreshing(false); }
  };
  useEffect(() => {
    let stillHere = true;
    actions.loadAuditLogs(ownedShares).then((result)=>{if(stillHere) setLogs(result);}).catch((e)=>{if(stillHere)setAuditError(e.message);});
    return () => { stillHere = false; };
  }, [idKey, data.logs]); // eslint-disable-line react-hooks/exhaustive-deps
  const share = async (e) => {
    e.preventDefault();
    const record = ownedRecords.find((r)=>r.id===selectedRecord);
    const ok = await form.run(async()=>{
      const id = await actions.createShare(record,email,duration);
      setLastLink(`${location.origin}${location.pathname}#/app/sharing?share=${encodeURIComponent(id)}`);
    });
    if (ok) { setEmail(''); setSelectedRecord(''); }
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(lastLink); }
    catch { form.setMessage('Copy the link manually from the box.'); }
  };
  const orderedLogs = [...logs].sort((a,b)=>{
    const ms = (v)=>v?.toMillis?v.toMillis():new Date(v).getTime();
    return ms(b.viewedAt)-ms(a.viewedAt);
  });
  return <>
    <div className="page-heading"><span className="eyebrow">Permission center</span><h1>Sharing</h1><p>Give a doctor temporary access to a single document. Revoke it any time.</p></div>
    {!demoMode && !user.emailVerified && <div className="security-notice"><ShieldCheck size={19}/><div><strong>Verify your email to receive shared documents</strong><p>Sharing with you requires a verified Firebase email address.</p></div><Button variant="outline" onClick={actions.refreshVerification}><RefreshCw size={15}/> Check verification</Button></div>}
    <div className="sharing-grid"><section className="content-card sharing-card"><div className="card-heading"><div><h2>Share a document</h2><p>Only the specified recipient can access it.</p></div><span className="heading-icon"><Share2 size={20}/></span></div>
      <form onSubmit={share} className="sharing-form"><FormField label="Document"><select required value={selectedRecord} onChange={(e)=>setSelectedRecord(e.target.value)}><option value="">Choose a document</option>{ownedRecords.map((r)=><option key={r.id} value={r.id}>{r.title}</option>)}</select></FormField>
        <FormField label="Recipient's email"><input required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="doctor@clinic.example"/><small>Recipient must have a verified HealthVault account.</small></FormField>
        <div className="field"><span className="field-label">Access expires</span><div className="filter-pills expiry-pills">{[[1,'24 hours'],[7,'7 days'],[30,'30 days']].map(([days,label])=><button type="button" className={`filter-pill ${duration===days?'selected':''}`} key={days} onClick={()=>setDuration(days)}>{label}</button>)}</div></div>
        <FormMessage message={form.message}/><Button loading={form.busy} type="submit" className="full-width"><Link2 size={17}/> Create access link</Button>
        {lastLink && <div className="link-created"><p><Check size={16}/> Link ready — share it with the specified recipient</p><div className="copy-row"><input readOnly value={lastLink} aria-label="Share link"/><button type="button" title="Copy link" onClick={copyLink}><Copy size={17}/></button></div><small>The link is not a substitute for authorization: the recipient must sign in with the matching, verified email.</small></div>}
      </form>
    </section>
    <section className="content-card sharing-card"><div className="card-heading"><div><h2>Access management</h2><p>Active, expired and revoked permissions</p></div><span className="heading-icon"><LockKeyhole size={20}/></span></div>
      <h3 className="section-subtitle">Your shared documents <span>{ownedShares.length}</span></h3>
      {ownedShares.length ? <div className="share-list">{sortNewest(ownedShares).map((share)=>{
        const active = isShareActive(share);
        return <div className="share-item" key={share.id}><div className="share-icon"><FileText size={18}/></div><div className="share-details"><strong>{share.recordTitle}</strong><small>{share.recipientEmail}</small><small><Clock3 size={12}/> {active ? `Expires ${formatDate(share.expiresAt)}` : share.revoked ? 'Access revoked' : 'Expired'}</small></div>{active ? <button className="small-outline outline-danger" onClick={()=>actions.revokeShare(share)}>Revoke</button> : <Badge tone="gray">Inactive</Badge>}</div>;
      })}</div> : <div className="small-empty"><Share2 size={20}/><p>No shares yet. Choose a document to grant access.</p></div>}
      <div className="audit-heading"><h3 className="section-subtitle">Access log</h3><button className="link-button" disabled={refreshing} onClick={refreshLogs}><RefreshCw size={14} className={refreshing ? 'spin':''}/> Refresh</button></div>
      {auditError && <FormMessage message={auditError}/>}
      {orderedLogs.length ? <div className="audit-list">{orderedLogs.slice(0,8).map((log)=>{
        const share = ownedShares.find((s)=>s.id===log.shareId);
        return <div className="audit-item" key={log.id}><span className="audit-icon"><Eye size={15}/></span><div><strong>{log.readerEmail || share?.recipientEmail || 'Recipient'}</strong><small>opened {share?.recordTitle || 'a document'}</small></div><time>{formatDate(log.viewedAt)}</time></div>;
      })}</div> : <div className="small-empty"><Eye size={19}/><p>No in-app views have been logged yet.</p></div>}
    </section></div>
    <section className="content-card received-card"><div className="card-heading"><div><h2>Documents shared with me</h2><p>Records that other patients allowed your account to open</p></div><span className="heading-icon"><ArrowUpRight size={20}/></span></div>
      {receivedShares.length ? <div className="record-list">{receivedShares.map((share)=>{
        const active = isShareActive(share);
        const record = { id:share.recordId, ownerUid:share.ownerUid, title:share.recordTitle, category:share.category, fileName:share.fileName, mimeType:share.mimeType, storagePath:share.storagePath, chunkCount:share.chunkCount };
        return <div className="record-row" key={share.id}><span className="file-square"><FileText size={19}/></span><div className="record-primary"><strong>{share.recordTitle}</strong><small>{active?`Valid until ${formatDate(share.expiresAt)}`:share.revoked?'Access revoked':'Expired'}</small></div><Badge tone={active?'teal':'gray'}>{active?'Accessible':'Inactive'}</Badge><Button variant="outline" disabled={!active} onClick={()=>setViewer({record,share})}>Open <ArrowUpRight size={15}/></Button></div>;
      })}</div> : <EmptyState icon={LockKeyhole} title="Nothing shared with you yet" description="Shared reports appear here when a patient grants your verified email access."/>}
    </section>
    <div className="security-footnote"><ShieldCheck size={17}/><span>Access is checked against Firebase rules on every authenticated file retrieval. An in-app view is logged; downloads outside the app and already saved copies cannot be recalled.</span></div>
    {viewer && <RecordViewer record={viewer.record} share={viewer.share} onClose={()=>setViewer(null)}/>}
  </>;
}
