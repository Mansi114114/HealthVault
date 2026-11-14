import React, { useMemo, useRef, useState } from 'react';
import { FileSearch, FileText, FolderOpen, Search, Trash2, UploadCloud, X } from 'lucide-react';
import { Badge, Button, EmptyState, FormField, FormMessage, Modal, useSubmit } from '../components/UI';
import RecordViewer from '../components/RecordViewer';
import { useApp } from '../context/AppContext';
import { CATEGORIES, formatDate, sortNewest, validateFile } from '../lib/validators';

export function UploadModal({ onClose }) {
  const { actions } = useApp();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Blood Test');
  const [doctor, setDoctor] = useState('');
  const submit = useSubmit();
  const fileInput = useRef(null);
  const setSelectedFile = (selected) => {
    if (!selected) return;
    const error = validateFile(selected);
    if (error) { submit.setMessage(error); return; }
    submit.setMessage(''); setFile(selected);
    if (!title) setTitle(selected.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await submit.run(()=>actions.addRecord({title,category,doctor,file}));
    if (ok) onClose();
  };
  return <Modal title="Upload medical report" subtitle="Securely organize your PDF or image report." onClose={onClose}>
    <form onSubmit={handleSubmit} className="modal-form"><input ref={fileInput} className="visually-hidden" type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e)=>setSelectedFile(e.target.files?.[0])}/>
      <div className="upload-drop small" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();setSelectedFile(e.dataTransfer.files?.[0]);}}><span className="drop-icon"><UploadCloud size={22}/></span><strong>{file ? file.name : 'Choose a PDF or image'}</strong><p>{file ? `${(file.size/1024).toFixed(1)} KB · Ready to upload` : 'PDF, JPG or PNG · maximum 5 MB'}</p><Button variant="outline" type="button" onClick={()=>fileInput.current?.click()}>{file ? 'Change file' : 'Browse files'}</Button></div>
      <FormField label="Document title"><input required value={title} maxLength={120} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g. Complete Blood Count"/></FormField>
      <div className="form-columns"><FormField label="Category"><select value={category} onChange={(e)=>setCategory(e.target.value)}>{CATEGORIES.map((c)=><option key={c}>{c}</option>)}</select></FormField><FormField label="Doctor / clinic (optional)"><input value={doctor} onChange={(e)=>setDoctor(e.target.value)} placeholder="Dr. A. Sharma"/></FormField></div>
      <FormMessage message={submit.message}/><div className="modal-actions"><Button variant="outline" type="button" onClick={onClose}>Cancel</Button><Button loading={submit.busy} type="submit"><UploadCloud size={16}/> Upload report</Button></div>
    </form>
  </Modal>;
}
export default function Documents({ startUpload }) {
  const { user, data, actions } = useApp();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [viewer, setViewer] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const owned = useMemo(()=>sortNewest(data.records.filter((r)=>r.ownerUid===user.uid)),[data.records,user.uid]);
  const filtered = owned.filter((r)=>(filter==='All'||r.category===filter) && [r.title,r.category,r.doctor].join(' ').toLowerCase().includes(search.toLowerCase()));
  const remove = async () => {
    try { await actions.deleteRecord(deleting); setDeleting(null); setDeleteError(''); }
    catch (e) { setDeleteError(e.message); }
  };
  return <>
    <div className="page-heading"><span className="eyebrow">Medical library</span><h1>Documents</h1><p>Upload, search and organize your medical reports.</p></div>
    <div className="upload-drop main-upload" role="button" tabIndex={0} onClick={startUpload} onKeyDown={(e)=>{if(e.key==='Enter')startUpload();}}><span className="drop-icon"><UploadCloud size={26}/></span><strong>Upload a PDF or image here</strong><p>Choose a file · PDF, JPG, PNG up to 5 MB</p><Button onClick={(e)=>{e.stopPropagation();startUpload();}}>Choose file</Button></div>
    <section className="content-card documents-card"><div className="documents-tools"><div className="filter-pills">{['All',...CATEGORIES].map((c)=><button key={c} className={`filter-pill ${filter===c?'selected':''}`} onClick={()=>setFilter(c)}>{c}</button>)}</div><label className="search-field"><Search size={17}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search documents…" aria-label="Search documents"/></label></div>
      {filtered.length ? <div className="record-list">{filtered.map((record)=><div className="record-row document-record" key={record.id}><span className="file-square"><FileText size={19}/></span><div className="record-primary"><strong>{record.title}</strong><small>{formatDate(record.createdAt)} · {record.fileName?.split('.').at(-1)?.toUpperCase()} {record.doctor && `· ${record.doctor}`}</small></div><Badge>{record.category}</Badge><div className="record-actions"><Button variant="outline" onClick={()=>setViewer(record)}>View</Button><button className="icon-btn delete-control" title="Delete document" aria-label={`Delete ${record.title}`} onClick={()=>setDeleting(record)}><Trash2 size={18}/></button></div></div>)}</div>
        : <EmptyState icon={filter==='All'?FolderOpen:FileSearch} title="No matching documents" description="Try a different filter or upload a new report."/>}
    </section>
    {viewer && <RecordViewer record={viewer} onClose={()=>setViewer(null)}/>}
    {deleting && <Modal title="Delete this document?" subtitle="This will also revoke any active shares for this file." onClose={()=>setDeleting(null)}><p className="confirm-description">“{deleting.title}” will be permanently removed from your vault. You cannot undo this action.</p><FormMessage message={deleteError}/><div className="modal-actions"><Button variant="outline" onClick={()=>setDeleting(null)}>Cancel</Button><Button variant="danger" onClick={remove}><Trash2 size={16}/> Delete report</Button></div></Modal>}
  </>;
}
