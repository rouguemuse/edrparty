import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const auth = readFileSync(new URL('../lib/auth.ts', import.meta.url),'utf8');
const login = readFileSync(new URL('../app/api/auth/login/route.ts', import.meta.url),'utf8');
const guards = [
  '../app/admin/page.tsx',
  '../app/api/admin/reservations/route.ts',
  '../app/api/admin/reservations/[id]/payment/route.ts'
];
test('no permissive session length fallback',()=>{
  assert.doesNotMatch(auth,/token\.length\s*>\s*10/);
  assert.match(auth,/\^\[a-f0-9\]\{64\}\$/);
  assert.match(auth,/revoked_at IS NULL/);
  assert.match(auth,/expires_at > datetime/);
});
test('no hardcoded accepted passwords',()=>{
  assert.doesNotMatch(login,/edrparty2026!/);
  assert.doesNotMatch(login,/password === ['"]admin['"]/);
  assert.match(login,/verifyAdminPassword/);
  assert.match(auth,/timingSafeEqual/);
});
test('session DB failure must never log in',()=>{
  assert.match(login,/Admin session persistence failed/);
  assert.match(login,/status:\s*503/);
  assert.match(auth,/return \{ error: 'Unauthorized', status: 401 \}/);
});
test('all privileged entrypoints fail closed',()=>{
 for(const file of guards){
  const src=readFileSync(new URL(file,import.meta.url),'utf8');
  assert.match(src,/!auth\.success \|\| auth\.status === 401/,file);
 }
});
