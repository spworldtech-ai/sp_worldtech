const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { stub, makeModel } = require('./helpers');

process.env.JWT_SECRET = 'test-secret-not-a-real-secret';

const Ebook = makeModel();
const EbookPurchase = makeModel();
stub('models/Ebook.js', Ebook);
stub('models/EbookPurchase.js', EbookPurchase);
stub('models/Wallet.js', makeModel());
stub('models/SystemWallet.js', makeModel());
stub('models/Transaction.js', makeModel());
stub('models/JobNotification.js', makeModel());
stub('services/paystackService.js', { initializePaystackPayment: async () => ({}), verifyPaystackTransaction: async () => ({}) });
stub('services/fxService.js', { convertUsdToNgn: async (usd) => ({ usd, ngn: usd * 1500 }) });
stub('services/adminEmailService.js', { sendAdminNotification: async () => {} });
// Auth stub: role comes from a test header; keeps the real normalizeRole behaviour.
stub('middleware/auth.js', {
  normalizeRole: (role) => (role === 'social_worker' ? 'staff' : role),
  authorize: () => (_req, _res, next) => next(),
  protect: (req, res, next) => {
    const role = req.headers['x-test-role'];
    if (!role) return res.status(401).json({ message: 'Not authorized' });
    req.user = { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', role, email: `${role}@example.test` };
    next();
  }
});

const router = require('../routes/marketplaceRoutes');
const app = express();
app.use(express.json({ limit: '30mb' }));
app.use('/api/marketplace', router);

let server, base;
test.before(async () => { await new Promise((r) => { server = app.listen(0, r); }); base = `http://127.0.0.1:${server.address().port}/api/marketplace`; });
test.after(() => server.close());

const call = async (method, url, { role, body } = {}) => {
  const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(role ? { 'x-test-role': role } : {}) }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' });
  const type = res.headers.get('content-type') || '';
  const data = type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer());
  return { status: res.status, data, headers: res.headers };
};

const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n').toString('base64');
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('fakepngbody')]).toString('base64');
const goodProduct = (over = {}) => ({ title: 'Test Guide', description: 'A guide', category: 'Education', productType: 'ebook', price: 12.5, oldPrice: 20, pageCount: 30, fileName: 'guide.pdf', mimeType: 'application/pdf', fileBase64: pdf, coverMimeType: 'image/png', coverBase64: png, published: true, ...over });

let publishedId, hiddenId;

test('upload requires authentication and an authorised role', async () => {
  assert.equal((await call('POST', '/admin/ebooks', { body: goodProduct() })).status, 401);
  assert.equal((await call('POST', '/admin/ebooks', { role: 'user', body: goodProduct() })).status, 403);
  assert.equal(Ebook._rows.length, 0, 'nothing may be saved for rejected requests');
});

test('server rejects invalid uploads', async () => {
  const cases = [
    [goodProduct({ title: '  ' }), 400, /title/i],
    [goodProduct({ price: -1 }), 400, /price/i],
    [goodProduct({ price: 'abc' }), 400, /price/i],
    [goodProduct({ productType: 'weapon' }), 400, /product type/i],
    [goodProduct({ mimeType: 'application/x-msdownload' }), 400, /supported files/i],
    [goodProduct({ fileBase64: '***not base64***' }), 400, /could not be read/i],
    [goodProduct({ fileBase64: Buffer.from('plain text, not a pdf').toString('base64') }), 400, /does not match/i],
    [goodProduct({ coverBase64: Buffer.from('not an image').toString('base64') }), 400, /does not match/i],
    [goodProduct({ coverUrl: 'javascript:alert(1)', coverBase64: '', coverMimeType: '' }), 400, /cover url/i]
  ];
  for (const [body, status, pattern] of cases) {
    const r = await call('POST', '/admin/ebooks', { role: 'admin', body });
    assert.equal(r.status, status, JSON.stringify(r.data).slice(0, 120));
    assert.match(r.data.message, pattern);
  }
  assert.equal(Ebook._rows.length, 0, 'invalid uploads must not create records');
});

test('valid upload is saved, published and served publicly', async () => {
  const r = await call('POST', '/admin/ebooks', { role: 'admin', body: goodProduct() });
  assert.equal(r.status, 201);
  assert.equal(r.data.ebook.published, true);
  publishedId = r.data.ebook.id;
  assert.equal(Ebook._rows.length, 1);
  assert.ok(Ebook._rows[0].fileData.length > 0, 'file bytes stored');

  const list = await call('GET', '/ebooks');
  assert.equal(list.data.ebooks.length, 1);
  assert.equal(list.data.ebooks[0].title, 'Test Guide');
  assert.equal(list.data.ebooks[0].fileData, undefined, 'file bytes must never be listed publicly');

  const cover = await call('GET', `/ebooks/${publishedId}/cover`);
  assert.equal(cover.status, 200);
  assert.equal(cover.headers.get('content-type'), 'image/png');
});

test('hidden (draft) products never appear publicly but stay visible to admins', async () => {
  const r = await call('POST', '/admin/ebooks', { role: 'staff', body: goodProduct({ title: 'Draft Item', published: false }) });
  assert.equal(r.status, 201);
  hiddenId = r.data.ebook.id;
  assert.equal(r.data.ebook.published, false);
  const pub = await call('GET', '/ebooks');
  assert.deepEqual(pub.data.ebooks.map((x) => x.title), ['Test Guide']);
  assert.equal((await call('GET', `/ebooks/${hiddenId}`)).status, 404);
  assert.equal((await call('GET', `/ebooks/${hiddenId}/cover`)).status, 404);
  const admin = await call('GET', '/admin/ebooks', { role: 'admin' });
  assert.equal(admin.data.ebooks.length, 2);
  assert.equal((await call('GET', '/summary')).data.published, 1);
});

test('publication flag is parsed strictly when editing', async () => {
  let r = await call('PATCH', `/admin/ebooks/${publishedId}`, { role: 'admin', body: { published: 'false' } });
  assert.equal(r.status, 200);
  assert.equal(r.data.ebook.published, false, 'the string "false" must hide the product');
  assert.equal((await call('GET', '/ebooks')).data.ebooks.length, 0);
  r = await call('PATCH', `/admin/ebooks/${publishedId}`, { role: 'admin', body: { published: 'maybe' } });
  assert.equal(r.status, 400);
  r = await call('PATCH', `/admin/ebooks/${publishedId}`, { role: 'staff', body: { published: true } });
  assert.equal(r.status, 200);
  assert.equal((await call('GET', '/ebooks')).data.ebooks.length, 1);
});

test('editing validates input and supports replacing file and cover', async () => {
  const url = `/admin/ebooks/${publishedId}`;
  assert.equal((await call('PATCH', url, { role: 'admin', body: { price: 'abc' } })).status, 400);
  assert.equal((await call('PATCH', url, { role: 'admin', body: { price: -5 } })).status, 400);
  assert.equal((await call('PATCH', url, { role: 'admin', body: { title: '' } })).status, 400);
  assert.equal((await call('PATCH', url, { role: 'admin', body: { coverUrl: 'javascript:alert(1)' } })).status, 400);
  assert.equal((await call('PATCH', '/admin/ebooks/not-an-id', { role: 'admin', body: { price: 1 } })).status, 404);

  let r = await call('PATCH', url, { role: 'admin', body: { title: 'Renamed Guide', price: 9.99 } });
  assert.equal(r.status, 200);
  assert.equal(r.data.ebook.title, 'Renamed Guide');
  assert.equal(r.data.ebook.price, 9.99);

  const newPdf = Buffer.from('%PDF-1.7 replacement file contents').toString('base64');
  r = await call('PATCH', url, { role: 'admin', body: { fileBase64: newPdf, fileName: 'v2.pdf', mimeType: 'application/pdf' } });
  assert.equal(r.status, 200);
  assert.equal(r.data.ebook.fileName, 'v2.pdf');
  const dl = await call('GET', `${url}/download`, { role: 'admin' });
  assert.equal(dl.status, 200);
  assert.match(dl.data.toString(), /replacement file contents/);

  r = await call('PATCH', url, { role: 'admin', body: { fileBase64: Buffer.from('fake').toString('base64'), fileName: 'x.pdf', mimeType: 'application/pdf' } });
  assert.equal(r.status, 400, 'replacement file must pass signature validation');

  r = await call('PATCH', url, { role: 'admin', body: { removeCover: true } });
  assert.equal(r.status, 200);
  assert.equal(r.data.ebook.coverUrl, '');
});

test('cover route cannot redirect to itself', async () => {
  const doc = Ebook._rows.find((row) => String(row._id) === publishedId);
  doc.coverUrl = `/api/marketplace/ebooks/${publishedId}/cover`;
  doc.coverData = undefined;
  const r = await call('GET', `/ebooks/${publishedId}/cover`);
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), '/assets/logo.jpeg');
});

test('deletion is administrator-only and protects paid purchases', async () => {
  assert.equal((await call('DELETE', `/admin/ebooks/${publishedId}`)).status, 401);
  assert.equal((await call('DELETE', `/admin/ebooks/${publishedId}`, { role: 'user' })).status, 403);
  assert.equal((await call('DELETE', `/admin/ebooks/${publishedId}`, { role: 'staff' })).status, 403, 'staff cannot delete');
  assert.equal(Ebook._rows.length, 2);

  await EbookPurchase.create({ ebook: publishedId, status: 'paid', user: 'u1' });
  let r = await call('DELETE', `/admin/ebooks/${publishedId}`, { role: 'admin' });
  assert.equal(r.status, 409);
  assert.match(r.data.message, /hide it instead/i);
  assert.equal(EbookPurchase._rows.length, 1, 'paid purchase record preserved');

  await EbookPurchase.create({ ebook: hiddenId, status: 'pending', user: 'u2' });
  r = await call('DELETE', `/admin/ebooks/${hiddenId}`, { role: 'owner' });
  assert.equal(r.status, 200);
  assert.equal(Ebook._rows.length, 1);
  assert.equal(EbookPurchase._rows.filter((p) => String(p.ebook) === hiddenId).length, 0, 'pending purchase cleaned up');
  assert.equal((await call('DELETE', `/admin/ebooks/${hiddenId}`, { role: 'admin' })).status, 404);
  assert.equal((await call('DELETE', '/admin/ebooks/xyz', { role: 'admin' })).status, 404);
});
