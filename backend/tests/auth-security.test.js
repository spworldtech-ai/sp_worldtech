const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { stub, makeModel } = require('./helpers');

process.env.JWT_SECRET = 'test-secret-not-a-real-secret';
delete process.env.OPERATIONS_SETUP_CODE;
delete process.env.STAFF_ALLOWED_EMAILS;
process.env.ADMIN_GOOGLE_EMAIL = 'boss@example.test';

const User = makeModel();
const origCreate = User.create;
// minimal select()-aware findOne used by the controllers
stub('models/User.js', User);
stub('models/Wallet.js', makeModel());

const authRoutes = require('../routes/authRoutes');
const adminAuthRoutes = require('../routes/adminAuthRoutes');
const { rateLimit } = require('../middleware/rateLimit');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/limited', rateLimit({ max: 3 }), (_req, res) => res.json({ ok: true }));

let server, base;
test.before(async () => { await new Promise((r) => { server = app.listen(0, r); }); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());
const post = async (url, body) => { const r = await fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { status: r.status, data: await r.json() }; };

test('privileged operations PINs cannot be created without a configured setup code', async () => {
  for (const role of ['owner', 'admin', 'staff']) {
    const r = await post('/api/auth/operations-pin/create', { role, fullName: 'Intruder', pin: '1234' });
    assert.equal(r.status, 403, `${role} creation must be refused when OPERATIONS_SETUP_CODE is unset`);
    assert.equal(r.data.token, undefined, 'no token may be issued');
  }
  assert.equal(User._rows.length, 0, 'no privileged account may be created');
});

test('privileged operations PINs require the correct setup code when configured', async () => {
  process.env.OPERATIONS_SETUP_CODE = 'correct-horse';
  let r = await post('/api/auth/operations-pin/create', { role: 'owner', fullName: 'Intruder', pin: '1234', setupCode: 'wrong' });
  assert.equal(r.status, 403);
  r = await post('/api/auth/operations-pin/create', { role: 'owner', fullName: 'Real Owner', pin: '1234', setupCode: 'correct-horse' });
  assert.equal(r.status, 201);
  assert.equal(r.data.user.role, 'owner');
  delete process.env.OPERATIONS_SETUP_CODE;
});

test('staff self-registration honours the optional STAFF_ALLOWED_EMAILS allowlist', async () => {
  const payload = (email) => ({ fullName: 'Staff Person', email, username: email.split('@')[0], password: 'long-enough-pass' });
  process.env.STAFF_ALLOWED_EMAILS = 'okstaff@example.test, other@example.test';
  let r = await post('/api/auth/staff-signup', payload('attacker@example.test'));
  assert.equal(r.status, 403);
  r = await post('/api/auth/staff-signup', payload('okstaff@example.test'));
  assert.equal(r.status, 201);
  assert.equal(r.data.user.role, 'staff');
  delete process.env.STAFF_ALLOWED_EMAILS;
});

test('admin signup cannot take over or promote an existing account', async () => {
  await User.create({ email: 'boss@example.test', role: 'user', password: 'existing-hash', fullName: 'Existing Person' });
  const r = await post('/api/admin/auth/signup', { fullName: 'Attacker', email: 'boss@example.test', password: 'attacker-password' });
  assert.equal(r.status, 409);
  const row = User._rows.find((u) => u.email === 'boss@example.test');
  assert.equal(row.role, 'user');
  assert.equal(row.password, 'existing-hash');
});

test('admin auth error messages do not reveal the administrator email', async () => {
  const r = await post('/api/admin/auth/signup', { fullName: 'Someone', email: 'random@example.test', password: 'some-password-1' });
  assert.equal(r.status, 403);
  assert.ok(!JSON.stringify(r.data).includes('boss@example.test'));
});

test('admin login rejects wrong credentials and non-approved emails', async () => {
  assert.equal((await post('/api/admin/auth/login', { email: '', password: '' })).status, 400);
  assert.equal((await post('/api/admin/auth/login', { email: 'random@example.test', password: 'x' })).status, 403);
});

test('rate limiter blocks repeated attempts with 429 and Retry-After', async () => {
  const hit = () => fetch(base + '/limited');
  assert.equal((await hit()).status, 200);
  assert.equal((await hit()).status, 200);
  assert.equal((await hit()).status, 200);
  const blocked = await hit();
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get('retry-after'));
});
