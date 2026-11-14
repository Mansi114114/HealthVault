import test from 'node:test';
import assert from 'node:assert/strict';
import { FILE_TYPES, MAX_FILE_BYTES, normalizeEmail, createShareId, isShareActive,
  validateFile, getShareExpiry, sortNewest, formatDate } from '../src/lib/validators.js';

test('email is trimmed and normalized', () => assert.equal(normalizeEmail('  DOCTOR@Clinic.Example '), 'doctor@clinic.example'));
test('share ID matches deterministic share grant lookup', () => assert.equal(createShareId('owner123','report123',' DR@EXAMPLE.COM '),'owner123--report123--dr@example.com'));
test('valid PDF is accepted', () => assert.equal(validateFile({type:'application/pdf',size:1000}),'') );
test('unsupported file is blocked', () => assert.match(validateFile({type:'application/zip',size:1000}),/Only PDF/));
test('oversize file is blocked', () => assert.match(validateFile({type:'image/jpeg',size:MAX_FILE_BYTES+1}),/5 MB/));
test('missing file is blocked', () => assert.match(validateFile(null),/choose/));
test('active share checks revocation and expiration', () => {
  assert.equal(isShareActive({revoked:false,expiresAt:'2099-01-01T00:00:00Z'}),true);
  assert.equal(isShareActive({revoked:true,expiresAt:'2099-01-01T00:00:00Z'}),false);
  assert.equal(isShareActive({revoked:false,expiresAt:'2020-01-01T00:00:00Z'}),false);
});
test('expiry date is correct for chosen days',()=>{
 const start=Date.now();const result=getShareExpiry(7).getTime();
 assert.ok(result-start >= 7*24*3600000-1000 && result-start <= 7*24*3600000+1000);
});
test('sortNewest does not mutate input',()=>{
 const list=[{id:'a',createdAt:'2026-01-01'},{id:'b',createdAt:'2026-12-01'}];
 assert.deepEqual(sortNewest(list).map((x)=>x.id),['b','a']);assert.equal(list[0].id,'a');
});
test('date formatter handles invalid input',()=>assert.equal(formatDate('bad date'),'—'));
