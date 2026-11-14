// DEMO ONLY. Data is stored in the browser and must never include real patient information.
// Firebase mode is the proper cloud-backed mode used for project evaluation.
const KEY = 'healthvault_ccsa_demo_v2';
const USER_KEY = 'healthvault_ccsa_demo_user';
const PATIENT = { uid: 'demo-patient', email: 'patient@demo.healthvault', displayName: 'Alex Morgan', emailVerified: true, role: 'patient' };
const DOCTOR = { uid: 'demo-doctor', email: 'doctor@clinic.example', displayName: 'Dr. A. Sharma', emailVerified: true, role: 'doctor' };
export { PATIENT, DOCTOR };
const iso = (dateString) => new Date(dateString).toISOString();
export const seedData = {
  records: [
    { id: 'sample-cbc', ownerUid: PATIENT.uid, title: 'Blood Test – CBC', category: 'Blood Test', doctor: 'Dr. A. Sharma', fileName: 'blood-test-cbc.pdf', mimeType: 'application/pdf', storagePath: '/samples/blood-test-cbc.pdf', createdAt: iso('2026-11-12T09:15:00'), size: 13500 },
    { id: 'sample-xray', ownerUid: PATIENT.uid, title: 'Chest X-Ray', category: 'X-Ray', doctor: 'Dr. A. Sharma', fileName: 'chest-xray.pdf', mimeType: 'application/pdf', storagePath: '/samples/chest-xray.pdf', createdAt: iso('2026-11-03T14:15:00'), size: 13500 },
    { id: 'sample-thyroid', ownerUid: PATIENT.uid, title: 'Thyroid Profile', category: 'Blood Test', doctor: 'Dr. R. Mehta', fileName: 'thyroid-profile.pdf', mimeType: 'application/pdf', storagePath: '/samples/thyroid-profile.pdf', createdAt: iso('2026-10-21T12:00:00'), size: 13500 },
    { id: 'sample-mri', ownerUid: PATIENT.uid, title: 'Knee MRI Report', category: 'MRI', doctor: 'Dr. S. Iyer', fileName: 'knee-mri.pdf', mimeType: 'application/pdf', storagePath: '/samples/knee-mri.pdf', createdAt: iso('2026-09-02T10:20:00'), size: 13500 }
  ],
  prescriptions: [
    { id: 'p1', ownerUid: PATIENT.uid, medicine: 'Amlodipine', dosage: '5 mg · once daily', doctor: 'Dr. A. Sharma', date: '2026-11-12', recordId: 'sample-cbc', notes: '' },
    { id: 'p2', ownerUid: PATIENT.uid, medicine: 'Metformin', dosage: '500 mg · twice daily', doctor: 'Dr. R. Mehta', date: '2026-10-28', recordId: '', notes: '' },
    { id: 'p3', ownerUid: PATIENT.uid, medicine: 'Levothyroxine', dosage: '50 mcg · morning', doctor: 'Dr. R. Mehta', date: '2026-10-21', recordId: 'sample-thyroid', notes: '' },
    { id: 'p4', ownerUid: PATIENT.uid, medicine: 'Vitamin D3', dosage: '60,000 IU · weekly', doctor: 'Dr. S. Iyer', date: '2026-09-02', recordId: 'sample-mri', notes: '' }
  ],
  appointments: [
    { id: 'a1', ownerUid: PATIENT.uid, doctor: 'Dr. A. Sharma', specialty: 'Cardiology', datetime: iso('2026-11-18T10:30:00'), reason: 'Follow-up', status: 'confirmed', notes: '' },
    { id: 'a2', ownerUid: PATIENT.uid, doctor: 'Dr. R. Mehta', specialty: 'Endocrinology', datetime: iso('2026-12-02T16:00:00'), reason: 'Thyroid review', status: 'confirmed', notes: '' },
    { id: 'a3', ownerUid: PATIENT.uid, doctor: 'Dr. A. Sharma', specialty: 'Cardiology', datetime: iso('2026-11-04T10:30:00'), reason: 'Routine check', status: 'completed', notes: 'BP stable, continue Amlodipine' },
    { id: 'a4', ownerUid: PATIENT.uid, doctor: 'Dr. R. Mehta', specialty: 'Endocrinology', datetime: iso('2026-10-21T15:30:00'), reason: 'Thyroid review', status: 'completed', notes: 'Repeat thyroid profile in 6 weeks' },
    { id: 'a5', ownerUid: PATIENT.uid, doctor: 'Dr. S. Iyer', specialty: 'General', datetime: iso('2026-09-02T11:30:00'), reason: 'Check-up', status: 'completed', notes: 'Vitamin D prescribed' }
  ],
  shares: [
    { id: 'demo-patient--sample-xray--doctor@clinic.example', ownerUid: PATIENT.uid, recordId: 'sample-xray', recordTitle: 'Chest X-Ray', category: 'X-Ray', fileName: 'chest-xray.pdf', mimeType: 'application/pdf', storagePath: '/samples/chest-xray.pdf', recipientEmail: DOCTOR.email, expiresAt: iso('2026-11-21T00:00:00'), revoked: false, createdAt: iso('2026-11-12T10:00:00') }
  ],
  logs: [{ id: 'log1', shareId: 'demo-patient--sample-xray--doctor@clinic.example', readerUid: DOCTOR.uid, readerEmail: DOCTOR.email, viewedAt: iso('2026-11-12T10:45:00') }]
};
export function getDemoData() {
  try { const saved = JSON.parse(localStorage.getItem(KEY)); return saved && Array.isArray(saved.records) ? saved : structuredClone(seedData); }
  catch { return structuredClone(seedData); }
}
export function saveDemoData(data) { localStorage.setItem(KEY, JSON.stringify(data)); }
export function getDemoUser() {
  const role = localStorage.getItem(USER_KEY);
  return role === 'doctor' ? DOCTOR : role === 'patient' ? PATIENT : null;
}
export function setDemoUser(role) { localStorage.setItem(USER_KEY, role); return role === 'doctor' ? DOCTOR : PATIENT; }
export function clearDemoUser() { localStorage.removeItem(USER_KEY); }
export function resetDemoData() { localStorage.removeItem(KEY); return structuredClone(seedData); }

const DB_NAME = 'healthvault_demo_uploads';
function openDemoDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function putDemoFile(key, file) {
  const database = await openDemoDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('files', 'readwrite');
    transaction.objectStore('files').put(file, key);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}
export async function getDemoFile(key) {
  const database = await openDemoDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('files', 'readonly');
    const request = transaction.objectStore('files').get(key);
    request.onsuccess = () => { database.close(); resolve(request.result); };
    request.onerror = () => { database.close(); reject(request.error); };
  });
}
export async function removeDemoFile(key) {
  const database = await openDemoDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('files', 'readwrite');
    transaction.objectStore('files').delete(key);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}
