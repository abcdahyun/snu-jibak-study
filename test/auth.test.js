import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHandler } from '../src/worker.js';

function setup() {
  const db = new DatabaseSync(':memory:');
  for (const name of ['0000_attendance.sql', '0001_admin.sql']) db.exec(readFileSync(new URL('../drizzle/' + name, import.meta.url), 'utf8'));
  const DB = { prepare(sql) { const statement = db.prepare(sql); let args = []; return { bind(...values) { args = values; return this; }, async first() { return statement.get(...args); }, async all() { return { results: statement.all(...args) }; }, async run() { return statement.run(...args); } }; } };
  const env = { DB, ADMIN_PASSWORD: 'test-only-long-password-123456789' };
  let now = new Date('2026-10-10T13:00:00Z');
  const app = createHandler('<html></html>', () => now);
  const request = (path, method = 'GET', body, cookie, origin = 'https://study.test') => app.fetch(new Request('https://study.test' + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }), env);
  return { env, request, advance() { now = new Date('2026-10-11T13:00:00Z'); } };
}
const attendance = { participant_id: 'p01', date: '2026-10-10', present: true };
async function login(s) {
  const response = await s.request('/api/auth', 'POST', { password: s.env.ADMIN_PASSWORD });
  assert.equal(response.status, 200);
  const header = response.headers.get('set-cookie');
  assert.match(header, /HttpOnly; Secure; SameSite=Strict/);
  return header.split(';')[0];
}
test('public reads work; unauthenticated and forged-cookie writes fail', async () => {
  const s = setup();
  assert.equal((await s.request('/api/attendance')).status, 200);
  assert.equal((await s.request('/api/attendance', 'PUT', attendance)).status, 401);
  assert.equal((await s.request('/api/attendance', 'PUT', attendance, '__Host-study_admin=' + 'a'.repeat(64))).status, 401);
});
test('admin can check and cancel; cross-origin writes fail; logout revokes replay', async () => {
  const s = setup(), cookie = await login(s);
  assert.equal((await s.request('/api/attendance', 'PUT', attendance, cookie, 'https://attacker.test')).status, 403);
  assert.equal((await s.request('/api/attendance', 'PUT', attendance, cookie)).status, 200);
  assert.equal((await (await s.request('/api/attendance')).json()).records.length, 1);
  assert.equal((await s.request('/api/attendance', 'PUT', { ...attendance, present: false }, cookie)).status, 200);
  assert.equal((await (await s.request('/api/attendance')).json()).records.length, 0);
  assert.equal((await s.request('/api/auth', 'DELETE', undefined, cookie)).status, 200);
  assert.equal((await s.request('/api/attendance', 'PUT', attendance, cookie)).status, 401);
});
test('expired sessions and rotated passwords invalidate access', async () => {
  const s = setup(), cookie = await login(s);
  s.advance();
  assert.equal((await s.request('/api/attendance', 'PUT', attendance, cookie)).status, 401);
  const t = setup(), cookie2 = await login(t);
  t.env.ADMIN_PASSWORD = 'a-different-test-password-123456';
  assert.equal((await t.request('/api/attendance', 'PUT', attendance, cookie2)).status, 401);
});
test('wrong passwords are rejected and repeated login attempts throttled', async () => {
  const s = setup();
  for (let i = 0; i < 5; i++) assert.equal((await s.request('/api/auth', 'POST', { password: 'wrong' })).status, 401);
  assert.equal((await s.request('/api/auth', 'POST', { password: s.env.ADMIN_PASSWORD })).status, 429);
});
test('missing password fails closed; cross-origin login fails', async () => {
  const s = setup();
  assert.equal((await s.request('/api/auth', 'POST', { password: s.env.ADMIN_PASSWORD }, undefined, 'https://attacker.test')).status, 403);
  delete s.env.ADMIN_PASSWORD;
  assert.equal((await s.request('/api/auth', 'POST', { password: '' })).status, 503);
  assert.equal((await s.request('/api/attendance', 'PUT', attendance)).status, 401);
});
