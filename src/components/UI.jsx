import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, ClipboardList, FileText, HeartPulse, LoaderCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Logo({ inverse = false }) {
  return <div className={`brand ${inverse ? 'brand-inverse' : ''}`}><span className="brand-symbol"><HeartPulse size={19} strokeWidth={2.5}/></span>HealthVault</div>;
}
export function Button({ children, variant = 'primary', className = '', loading = false, ...props }) {
  return <button className={`btn btn-${variant} ${className}`} disabled={loading || props.disabled} {...props}>
    {loading && <LoaderCircle size={16} className="spin" />}{children}
  </button>;
}
export function Badge({ children, tone = 'teal' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}
export function EmptyState({ icon: Icon = ClipboardList, title, description, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={23}/></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}
export function Modal({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-label={title} className={`modal-panel ${wide ? 'modal-wide' : ''}`}>
      <div className="modal-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-btn" aria-label="Close" onClick={onClose}><X size={20}/></button></div>
      {children}
    </div>
  </div>;
}
export function FormField({ label, children, hint }) { return <label className="field"><span className="field-label">{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function FormMessage({ message }) { return message ? <div className="form-error"><AlertCircle size={16}/>{message}</div> : null; }
export function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const run = async (callback) => {
    setBusy(true); setMessage('');
    try { await callback(); return true; }
    catch (e) { setMessage(e.message || 'Something went wrong.'); return false; }
    finally { setBusy(false); }
  };
  return { busy, message, setMessage, run };
}
export function Toast() {
  const { toast, setToast, error, setError, demoMode, configurationIssue } = useApp();
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast, setToast]);
  return <>
    {configurationIssue && <div className="configuration-banner">Firebase mode requested, but configuration is missing. Running in demo mode. Fill in the <code>.env</code> file.</div>}
    {demoMode && <div className="demo-banner"><span><strong>DEMO MODE</strong> — Uses sample data and local browser storage. Do not upload real health information.</span><a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">Connect Firebase</a></div>}
    {(toast || error) && <div className={`toast ${error ? 'toast-error' : ''}`}><span>{error ? <AlertCircle size={17}/> : <Check size={17}/>}</span><span>{error || toast}</span><button className="icon-btn" aria-label="Dismiss" onClick={() => { setToast(''); setError(''); }}><X size={16}/></button></div>}
  </>;
}
export function StatusNote() { return <p className="status-note"><FileText size={14}/> Demo information only. HealthVault does not provide medical advice.</p>; }
