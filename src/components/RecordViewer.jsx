import React, { useEffect, useState } from 'react';
import { Download, File, LoaderCircle } from 'lucide-react';
import { Modal, FormMessage, Button } from './UI';
import { useApp } from '../context/AppContext';

export default function RecordViewer({ record, share = null, onClose }) {
  const { actions } = useApp();
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let createdUrl;
    actions.openRecord(record, share).then((result) => {
      createdUrl = result.url;
      if (active) setFile(result);
      else URL.revokeObjectURL(result.url);
    }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; if (createdUrl) URL.revokeObjectURL(createdUrl); };
  }, [record, share]);
  return <Modal title={record.title} subtitle={`${record.category || 'Medical document'} · ${record.fileName || 'File'}`} onClose={onClose} wide>
    {error && <FormMessage message={error}/>}
    {!file && !error && <div className="viewer-loading"><LoaderCircle className="spin" size={28}/> Opening secured document…</div>}
    {file && <><div className="viewer-frame">{file.type === 'application/pdf' ?
      <iframe title={record.title} src={file.url} /> : file.type?.startsWith('image/') ?
      <img src={file.url} alt={record.title}/> : <div><File size={30}/> Preview not available for this file type.</div>}</div>
      <div className="modal-actions"><a className="btn btn-primary" href={file.url} download={record.fileName || 'health-record'}><Download size={16}/> Download file</a><Button variant="outline" onClick={onClose}>Close</Button></div>
    </>}
  </Modal>;
}
