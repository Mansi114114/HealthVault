import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification,
  sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile
} from 'firebase/auth';
import {
  addDoc, Bytes, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot,
  query, serverTimestamp, setDoc, Timestamp, updateDoc, where, writeBatch
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { CONFIG_ERROR, DEMO_MODE } from '../lib/config';
import {
  PATIENT, DOCTOR, clearDemoUser, getDemoData, getDemoFile, getDemoUser,
  putDemoFile, removeDemoFile, resetDemoData, saveDemoData, setDemoUser
} from '../lib/demo';
import { CHUNK_BYTES, createShareId, getShareExpiry, isShareActive, normalizeEmail, validateFile } from '../lib/validators';

const AppContext = createContext(null);
const emptyData = { records: [], prescriptions: [], appointments: [], shares: [], logs: [] };
const uid = () => crypto.randomUUID();
const readableError = (e) => {
  const code = e?.code || '';
  const named = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Choose a password with at least 6 characters.',
    'auth/invalid-email': 'Enter a valid email address.',
    'permission-denied': 'Access denied. Check your Firebase security rules and account permissions.',
  };
  return named[code] || e?.message || 'Something went wrong. Please try again.';
};
// Files live in Firestore (free Spark plan): records/{recordId}/chunks/{index} = { ownerUid, index, data: Bytes }
const chunkRef = (recordId, index) => doc(db, 'records', recordId, 'chunks', String(index));
async function saveFileChunks(recordId, ownerUid, file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const count = Math.max(1, Math.ceil(bytes.length / CHUNK_BYTES));
  await Promise.all(Array.from({ length: count }, (_, index) =>
    setDoc(chunkRef(recordId, index), {
      ownerUid, index, data: Bytes.fromUint8Array(bytes.slice(index * CHUNK_BYTES, (index + 1) * CHUNK_BYTES))
    })));
  return count;
}
async function deleteFileChunks(recordId, count) {
  await Promise.allSettled(Array.from({ length: count || 0 }, (_, index) => deleteDoc(chunkRef(recordId, index))));
}
async function loadFileBlob(recordId, count, mimeType) {
  if (!count) throw new Error('This document has no stored file data.');
  const parts = await Promise.all(Array.from({ length: count }, async (_, index) => {
    const snap = await getDoc(chunkRef(recordId, index));
    if (!snap.exists()) throw new Error('Part of the file is missing.');
    return snap.data().data.toUint8Array();
  }));
  return new Blob(parts, { type: mimeType });
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => DEMO_MODE ? getDemoUser() : null);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [data, setData] = useState(() => DEMO_MODE ? getDemoData() : emptyData);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const notify = useCallback((text) => { setToast(text); }, []);
  const updateDemo = useCallback((change) => {
    setData((previous) => {
      const next = typeof change === 'function' ? change(previous) : change;
      saveDemoData(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (DEMO_MODE) return undefined;
    return onAuthStateChanged(auth, (current) => {
      setUser(current);
      setLoading(false);
      setError('');
      if (!current) setData(emptyData);
    }, (e) => { setError(readableError(e)); setLoading(false); });
  }, []);

  useEffect(() => {
    if (DEMO_MODE || !user) return undefined;
    let active = true;
    const subscriptions = [];
    const watch = (name, criteria, setter) => {
      const q = query(collection(db, name), where(criteria[0], '==', criteria[1]));
      subscriptions.push(onSnapshot(q, (snapshot) => {
        if (active) setter(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
      }, (e) => setError(readableError(e))));
    };
    const setResource = (name) => (items) => setData((prev) => ({ ...prev, [name]: items }));
    watch('records', ['ownerUid', user.uid], setResource('records'));
    watch('prescriptions', ['ownerUid', user.uid], setResource('prescriptions'));
    watch('appointments', ['ownerUid', user.uid], setResource('appointments'));
    let ownShares = [];
    let incomingShares = [];
    const mergeShares = () => setData((prev) => ({ ...prev, shares: [...new Map([...ownShares, ...incomingShares].map((s) => [s.id, s])).values()] }));
    watch('shares', ['ownerUid', user.uid], (items) => { ownShares = items; mergeShares(); });
    if (user.emailVerified && user.email) {
      watch('shares', ['recipientEmail', normalizeEmail(user.email)], (items) => { incomingShares = items; mergeShares(); });
    }
    return () => { active = false; subscriptions.forEach((unsub) => unsub()); };
  }, [user]);

  const actions = useMemo(() => ({
    clearError: () => setError(''),
    signIn: async (email, password) => {
      setError('');
      if (DEMO_MODE) {
        const selected = normalizeEmail(email) === DOCTOR.email ? 'doctor' : 'patient';
        setUser(setDemoUser(selected));
        notify('Demo session opened. Only use sample information.');
        return;
      }
      try { await signInWithEmailAndPassword(auth, normalizeEmail(email), password); }
      catch (e) { throw new Error(readableError(e)); }
    },
    signUp: async (name, email, password) => {
      setError('');
      if (DEMO_MODE) { setUser(setDemoUser('patient')); notify('Demo account opened. No real account was created.'); return; }
      try {
        const credential = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
        await updateProfile(credential.user, { displayName: name.trim() });
        await setDoc(doc(db, 'users', credential.user.uid), {
          displayName: name.trim(), email: credential.user.email, createdAt: serverTimestamp()
        });
        await sendEmailVerification(credential.user);
        setUser({ uid: credential.user.uid, email: credential.user.email, displayName: name.trim(), emailVerified: credential.user.emailVerified });
        notify('Account created. Verify your email before receiving shared files.');
      } catch (e) { throw new Error(readableError(e)); }
    },
    resetPassword: async (email) => {
      if (DEMO_MODE) { notify('Password reset is available only in Firebase mode.'); return; }
      try { await sendPasswordResetEmail(auth, normalizeEmail(email)); notify('If the email is registered, a reset message has been sent.'); }
      catch (e) { throw new Error(readableError(e)); }
    },
    refreshVerification: async () => {
      if (DEMO_MODE) return;
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      setUser({ uid: auth.currentUser.uid, email: auth.currentUser.email, displayName: auth.currentUser.displayName, emailVerified: auth.currentUser.emailVerified });
      notify(auth.currentUser.emailVerified ? 'Email verified.' : 'Email not verified yet. Check your inbox.');
    },
    signOut: async () => {
      if (DEMO_MODE) { clearDemoUser(); setUser(null); return; }
      await signOut(auth);
    },
    switchDemoRole: (role) => { if (DEMO_MODE) setUser(setDemoUser(role)); },
    resetDemo: () => { if (DEMO_MODE) { setData(resetDemoData()); notify('Sample data restored.'); } },
    addRecord: async ({ title, category, doctor, file }) => {
      const problem = validateFile(file);
      if (problem) throw new Error(problem);
      if (!title.trim()) throw new Error('Please enter a document title.');
      const recordId = uid();
      if (DEMO_MODE) {
        await putDemoFile(recordId, file);
        const record = { id: recordId, ownerUid: user.uid, title: title.trim(), category, doctor: doctor.trim(),
          fileName: file.name, mimeType: file.type, storagePath: `demo:${recordId}`, createdAt: new Date().toISOString(), size: file.size };
        updateDemo((prev) => ({ ...prev, records: [record, ...prev.records] }));
        notify('Report added to the demo vault.');
        return recordId;
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      let chunkCount = 0;
      try {
        chunkCount = await saveFileChunks(recordId, user.uid, file);
        await setDoc(doc(db, 'records', recordId), {
          ownerUid: user.uid, title: title.trim(), category, doctor: doctor.trim(), fileName: safeName,
          mimeType: file.type, storagePath: `firestore:${recordId}`, chunkCount, size: file.size, createdAt: serverTimestamp()
        });
      } catch (e) {
        await deleteFileChunks(recordId, Math.ceil(file.size / CHUNK_BYTES));
        throw new Error(readableError(e));
      }
      notify('Medical report uploaded to the cloud.');
      return recordId;
    },
    deleteRecord: async (record) => {
      if (DEMO_MODE) {
        if (record.storagePath.startsWith('demo:')) await removeDemoFile(record.id);
        updateDemo((prev) => ({
          ...prev, records: prev.records.filter((r) => r.id !== record.id),
          shares: prev.shares.map((s) => s.recordId === record.id ? { ...s, revoked: true } : s),
        }));
      } else {
        const linkedShares = data.shares.filter((s) => s.ownerUid === user.uid && s.recordId === record.id && !s.revoked);
        if (linkedShares.length) {
          const batch = writeBatch(db);
          linkedShares.forEach((s) => batch.update(doc(db, 'shares', s.id), { revoked: true }));
          await batch.commit();
        }
        await deleteFileChunks(record.id, record.chunkCount);
        await deleteDoc(doc(db, 'records', record.id));
      }
      notify('Document deleted and its active shares revoked.');
    },
    addPrescription: async (entry) => {
      if (!entry.medicine.trim() || !entry.dosage.trim() || !entry.doctor.trim() || !entry.date) throw new Error('Complete the required prescription fields.');
      const values = { medicine: entry.medicine.trim(), dosage: entry.dosage.trim(), doctor: entry.doctor.trim(),
        date: entry.date, notes: entry.notes?.trim() || '', recordId: entry.recordId || '', ownerUid: user.uid };
      if (DEMO_MODE) updateDemo((prev) => ({ ...prev, prescriptions: [{ ...values, id: uid() }, ...prev.prescriptions] }));
      else await addDoc(collection(db, 'prescriptions'), { ...values, createdAt: serverTimestamp() });
      notify('Prescription saved.');
    },
    deletePrescription: async (entry) => {
      if (DEMO_MODE) updateDemo((prev) => ({ ...prev, prescriptions: prev.prescriptions.filter((p) => p.id !== entry.id) }));
      else await deleteDoc(doc(db, 'prescriptions', entry.id));
      notify('Prescription removed.');
    },
    addAppointment: async (entry) => {
      if (!entry.doctor.trim() || !entry.datetime || !entry.specialty.trim()) throw new Error('Enter doctor, specialty, and date/time.');
      const values = { ownerUid: user.uid, doctor: entry.doctor.trim(), specialty: entry.specialty.trim(),
        datetime: new Date(entry.datetime).toISOString(), reason: entry.reason.trim(), notes: entry.notes.trim(), status: entry.status };
      if (DEMO_MODE) updateDemo((prev) => ({ ...prev, appointments: [...prev.appointments, { ...values, id: uid() }] }));
      else await addDoc(collection(db, 'appointments'), { ...values, createdAt: serverTimestamp() });
      notify('Appointment saved.');
    },
    updateAppointment: async (id, changes) => {
      if (DEMO_MODE) updateDemo((prev) => ({ ...prev, appointments: prev.appointments.map((a) => a.id === id ? { ...a, ...changes } : a) }));
      else await updateDoc(doc(db, 'appointments', id), changes);
      notify('Appointment updated.');
    },
    deleteAppointment: async (entry) => {
      if (DEMO_MODE) updateDemo((prev) => ({ ...prev, appointments: prev.appointments.filter((a) => a.id !== entry.id) }));
      else await deleteDoc(doc(db, 'appointments', entry.id));
      notify('Appointment removed.');
    },
    createShare: async (record, email, days) => {
      const recipientEmail = normalizeEmail(email);
      if (!/^\S+@\S+\.\S+$/.test(recipientEmail)) throw new Error('Enter a valid doctor email address.');
      if (recipientEmail === normalizeEmail(user.email)) throw new Error('You already own this document.');
      if (!record || record.ownerUid !== user.uid) throw new Error('Select a document from your vault.');
      const shareId = createShareId(user.uid, record.id, recipientEmail);
      const expiresAt = getShareExpiry(days);
      if (DEMO_MODE) {
        const existing = data.shares.find((s) => s.id === shareId);
        const share = { id: shareId, ownerUid: user.uid, recordId: record.id, recordTitle: record.title,
          category: record.category, fileName: record.fileName, mimeType: record.mimeType, storagePath: record.storagePath,
          recipientEmail, expiresAt: expiresAt.toISOString(), revoked: false, createdAt: new Date().toISOString() };
        updateDemo((prev) => ({ ...prev, shares: existing ? prev.shares.map((s) => s.id === shareId ? share : s) : [share, ...prev.shares] }));
      } else {
        const shareRef = doc(db, 'shares', shareId);
        const existing = data.shares.find((s) => s.id === shareId);
        if (existing) await updateDoc(shareRef, { revoked: false, expiresAt: Timestamp.fromDate(expiresAt) });
        else await setDoc(shareRef, {
          ownerUid: user.uid, recordId: record.id, recordTitle: record.title, category: record.category,
          fileName: record.fileName, mimeType: record.mimeType, storagePath: record.storagePath, chunkCount: record.chunkCount,
          recipientEmail, expiresAt: Timestamp.fromDate(expiresAt), revoked: false, createdAt: serverTimestamp()
        });
      }
      notify('Access created. Only the verified recipient can open the file.');
      return shareId;
    },
    revokeShare: async (share) => {
      if (share.ownerUid !== user.uid) throw new Error('Only the owner may revoke access.');
      if (DEMO_MODE) updateDemo((prev) => ({ ...prev, shares: prev.shares.map((s) => s.id === share.id ? { ...s, revoked: true } : s) }));
      else await updateDoc(doc(db, 'shares', share.id), { revoked: true });
      notify('Sharing access revoked.');
    },
    openRecord: async (record, share = null) => {
      if (share && (!isShareActive(share) || normalizeEmail(share.recipientEmail) !== normalizeEmail(user.email))) {
        throw new Error('This share is expired, revoked, or does not belong to your account.');
      }
      let blob;
      if (DEMO_MODE) {
        if (record.storagePath.startsWith('/samples/')) {
          const response = await fetch(record.storagePath);
          if (!response.ok) throw new Error('Sample document not found.');
          blob = await response.blob();
        } else {
          blob = await getDemoFile(record.id);
          if (!blob) throw new Error('Demo upload not available in this browser.');
        }
        if (share) updateDemo((prev) => ({ ...prev, logs: [
          { id: uid(), shareId: share.id, readerUid: user.uid, readerEmail: user.email, viewedAt: new Date().toISOString() }, ...prev.logs
        ] }));
      } else {
        // File chunks are read through Firestore rules, so expiry and revocation apply to every read.
        blob = await loadFileBlob(record.id, record.chunkCount, record.mimeType);
        if (share) {
          try {
            await addDoc(collection(db, 'shares', share.id, 'views'), { readerUid: user.uid, viewedAt: serverTimestamp() });
          } catch (e) { throw new Error(`File retrieved, but view logging failed: ${readableError(e)}`); }
        }
      }
      return { url: URL.createObjectURL(blob), type: blob.type || record.mimeType, name: record.title };
    },
    loadAuditLogs: async (ownedShares) => {
      if (DEMO_MODE) return data.logs.filter((log) => ownedShares.some((s) => s.id === log.shareId));
      const results = await Promise.all(ownedShares.map(async (share) => {
        const snap = await getDocs(collection(db, 'shares', share.id, 'views'));
        return snap.docs.map((d) => ({ id: d.id, shareId: share.id, readerEmail: share.recipientEmail, ...d.data() }));
      }));
      return results.flat();
    }
  }), [data.shares, data.logs, notify, updateDemo, user]);

  const value = { user, loading, data, error, setError, toast, setToast, actions,
    demoMode: DEMO_MODE, configurationIssue: CONFIG_ERROR };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
