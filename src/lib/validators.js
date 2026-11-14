export const CATEGORIES = ['Blood Test', 'X-Ray', 'MRI', 'Discharge', 'Other'];
export const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // files are stored in Firestore as chunks (free Spark plan)
export const CHUNK_BYTES = 700 * 1024; // must stay under Firestore's 1 MiB document limit
export const MAX_CHUNKS = Math.ceil(MAX_FILE_BYTES / CHUNK_BYTES);

export function validateFile(file) {
  if (!file) return 'Please choose a file.';
  if (!FILE_TYPES.includes(file.type)) return 'Only PDF, JPG and PNG files are supported.';
  if (file.size > MAX_FILE_BYTES) return 'File must be 5 MB or smaller.';
  return '';
}
export function normalizeEmail(value) { return String(value ?? '').trim().toLowerCase(); }
export function createShareId(ownerUid, recordId, recipientEmail) {
  return `${ownerUid}--${recordId}--${normalizeEmail(recipientEmail)}`;
}
export function isShareActive(share, now = Date.now()) {
  if (!share || share.revoked) return false;
  const raw = share.expiresAt;
  const milliseconds = raw?.toMillis ? raw.toMillis() : raw?.seconds ? raw.seconds * 1000 : new Date(raw).getTime();
  return Number.isFinite(milliseconds) && milliseconds > now;
}
export function formatDate(value) {
  if (!value) return '—';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function shortDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
export function getTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}
export function getShareExpiry(days) {
  return new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000);
}
export function sortNewest(records, field = 'createdAt') {
  const ms = (value) => value?.toMillis ? value.toMillis() : new Date(value ?? 0).getTime();
  return [...records].sort((a, b) => ms(b[field]) - ms(a[field]));
}
