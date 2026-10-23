const router = require('express').Router();
const crypto = require('crypto');
const Ebook = require('../models/Ebook');
const EbookPurchase = require('../models/EbookPurchase');
const Wallet = require('../models/Wallet');
const SystemWallet = require('../models/SystemWallet');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { protect, authorize, normalizeRole } = require('../middleware/auth');
const { initializePaystackPayment, verifyPaystackTransaction } = require('../services/paystackService');
const { convertUsdToNgn } = require('../services/fxService');
const { sendAdminNotification } = require('../services/adminEmailService');
const JobNotification = require('../models/JobNotification');

// Admins, owners and staff may manage products (upload, edit, publish/hide).
function requireAdmin(req, res, next) {
  const role = normalizeRole(String(req.user?.role || '').toLowerCase());
  if (!['admin', 'owner', 'staff'].includes(role)) return res.status(403).json({ message: 'Administrator, owner or staff access required.' });
  next();
}

// Destructive operations stay administrator/owner only.
function requireAdminOnly(req, res, next) {
  const role = String(req.user?.role || '').toLowerCase();
  if (!['admin', 'owner'].includes(role)) return res.status(403).json({ message: 'Only an administrator or owner can delete products. Staff can hide a product instead.' });
  next();
}

const PRODUCT_TYPES = ['ebook', 'download', 'logo', 'template', 'software', 'other'];
const ALLOWED_FILE_TYPES = ['application/zip', 'application/x-zip-compressed', 'application/pdf', 'application/epub+zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/octet-stream', 'application/vnd.oasis.opendocument.text'];
const ALLOWED_COVER_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_COVER_BYTES = 3 * 1024 * 1024;

// Server-side check that the bytes match the declared type, so a client cannot
// label an arbitrary file as a PDF/image.
function signatureMatches(mime, buffer) {
  const type = String(mime || '').toLowerCase();
  const startsWith = (...bytes) => bytes.every((byte, index) => buffer[index] === byte);
  if (type === 'application/pdf') return startsWith(0x25, 0x50, 0x44, 0x46);
  if (['application/zip', 'application/x-zip-compressed', 'application/epub+zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.oasis.opendocument.text'].includes(type)) return startsWith(0x50, 0x4b, 0x03, 0x04) || startsWith(0x50, 0x4b, 0x05, 0x06);
  if (type === 'application/msword') return startsWith(0xd0, 0xcf, 0x11, 0xe0) || startsWith(0x50, 0x4b, 0x03, 0x04);
  if (type === 'image/png') return startsWith(0x89, 0x50, 0x4e, 0x47);
  if (type === 'image/jpeg') return startsWith(0xff, 0xd8, 0xff);
  if (type === 'image/gif') return startsWith(0x47, 0x49, 0x46, 0x38);
  if (type === 'image/webp') return buffer.length > 12 && buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
  if (type === 'image/svg+xml') return /<svg[\s>]/i.test(buffer.slice(0, 2048).toString('utf8'));
  if (type === 'text/plain') return !buffer.slice(0, 4096).includes(0);
  return true; // application/octet-stream: no signature to verify
}

function decodeBase64(raw) {
  const clean = String(raw || '').replace(/^data:[^;]+;base64,/, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 === 1) return null;
  return Buffer.from(clean, 'base64');
}

function parseBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null || value === '') return fallback;
  const text = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(text)) return true;
  if (['false', '0', 'no', 'off'].includes(text)) return false;
  return fallback;
}

function validCoverUrl(value) {
  const url = String(value || '').trim();
  return url === '' || /^(https:\/\/|\/assets\/|\.\/assets\/|\/api\/marketplace\/ebooks\/[a-f0-9]{24}\/cover$)/i.test(url);
}

function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || `ebook-${Date.now()}`;
}

function reference() {
  return `SPWT-EBOOK-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function publicEbook(item) {
  return {
    id: item._id,
    title: item.title,
    slug: item.slug,
    description: item.description,
    category: item.category,
    productType: item.productType || 'ebook',
    price: item.price,
    oldPrice: Number(item.oldPrice || 0),
    currency: 'USD',
    priceUsd: item.currency === 'USD' ? item.price : item.priceUsd || item.price,
    pageCount: item.pageCount,
    fileName: item.fileName,
    fileSize: item.fileSize,
    coverUrl: item.coverUrl,
    whatsappNumber: item.whatsappNumber || '',
    published: item.published,
    createdAt: item.createdAt
  };
}

router.get('/summary', async (_req, res) => {
  try {
    const [total, published] = await Promise.all([Ebook.countDocuments(), Ebook.countDocuments({ published: true })]);
    res.json({ total, published });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/ebooks', async (_req, res) => {
  try {
    const ebooks = await Ebook.find({ published: true }).sort({ createdAt: -1 });
    res.json({ ebooks: ebooks.map(publicEbook) });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/ebooks/:id/cover', async (req, res) => {
  try {
    const ebook = await Ebook.findOne({ _id: req.params.id, published: true }).select('+coverData +coverMimeType coverUrl');
    if (!ebook) return res.status(404).end();
    if (ebook.coverData?.length) {
      res.setHeader('Content-Type', ebook.coverMimeType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(ebook.coverData);
    }
    const target = ebook.coverUrl && !/\/api\/marketplace\/ebooks\/[^/]+\/cover$/i.test(ebook.coverUrl) ? ebook.coverUrl : '/assets/logo.jpeg';
    return res.redirect(target);
  } catch (_error) { return res.status(404).end(); }
});

router.get('/ebooks/:id', async (req, res) => {
  try {
    const ebook = await Ebook.findOne({ _id: req.params.id, published: true });
    if (!ebook) return res.status(404).json({ message: 'E-book not found.' });
    res.json({ ebook: publicEbook(ebook) });
  } catch (_error) { res.status(404).json({ message: 'E-book not found.' }); }
});

router.post('/ebooks/:id/checkout', protect, async (req, res) => {
  try {
    const ebook = await Ebook.findOne({ _id: req.params.id, published: true });
    if (!ebook) return res.status(404).json({ message: 'E-book not found.' });
    if (Number(ebook.price) <= 0) return res.status(400).json({ message: 'This e-book does not require payment.' });
    const already = await EbookPurchase.findOne({ user: req.user._id, ebook: ebook._id, status: 'paid' });
    if (already) return res.json({ alreadyOwned: true, message: 'You already own this e-book.' });

    const conversion = await convertUsdToNgn(ebook.price);
    const paystackReference = reference();
    await EbookPurchase.create({ user: req.user._id, ebook: ebook._id, amount: conversion.ngn, currency: 'NGN', paystackReference, status: 'pending', metadata: { type: 'ebook', ebookId: String(ebook._id), userId: String(req.user._id), priceUsd: conversion.usd, exchangeRateUsdToNgn: conversion.rate, payableNgn: conversion.ngn } });
    const site = String(process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://spworldtech.com').replace(/\/$/, '');
    const callbackUrl = process.env.PAYSTACK_EBOOK_CALLBACK_URL || `${site}/marketplace.html`;
    let checkout;
    try {
      checkout = await initializePaystackPayment({ email: req.user.email, amount: conversion.ngn, currency: 'NGN', reference: paystackReference, callbackUrl, metadata: { type: 'ebook', ebookId: String(ebook._id), userId: String(req.user._id), title: ebook.title, displayAmountUsd: conversion.usd, exchangeRateUsdToNgn: conversion.rate } });
    } catch (paymentError) {
      await EbookPurchase.deleteOne({ paystackReference });
      throw paymentError;
    }
    if (!checkout.attempted || !checkout.data?.authorization_url) {
      await EbookPurchase.deleteOne({ paystackReference });
      return res.status(503).json({ message: checkout.message || 'Paystack checkout is not configured.' });
    }
    res.json({ checkoutUrl: checkout.data.authorization_url, accessCode: checkout.data.access_code, reference: paystackReference, ebook: publicEbook(ebook), payment: { currency: 'NGN', amount: conversion.ngn, usdAmount: conversion.usd, exchangeRate: conversion.rate } });
  } catch (error) { res.status(500).json({ message: error.message }); }
});


router.post('/ebooks/:id/wallet-checkout', protect, async (req, res) => {
  try {
    const ebook = await Ebook.findOne({ _id: req.params.id, published: true });
    if (!ebook) return res.status(404).json({ message: 'E-book not found.' });
    const priceUsd = Number(ebook.priceUsd || ebook.price || 0);
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) return res.status(400).json({ message: 'This e-book does not require payment.' });

    const already = await EbookPurchase.findOne({ user: req.user._id, ebook: ebook._id, status: 'paid' });
    if (already) return res.json({ alreadyOwned: true, message: 'You already own this e-book.' });

    const wallet = await Wallet.findOneAndUpdate(
      { user: req.user._id, usdBalance: { $gte: priceUsd } },
      { $inc: { usdBalance: -priceUsd } },
      { new: true }
    );
    if (!wallet) return res.status(400).json({ message: 'Insufficient USD wallet balance.' });

    try {
      const paystackReference = `SPWT-WALLET-EBOOK-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const purchase = await EbookPurchase.create({
        user: req.user._id,
        ebook: ebook._id,
        amount: priceUsd,
        currency: 'USD',
        paystackReference,
        status: 'paid',
        paidAt: new Date(),
        metadata: { type: 'ebook', paymentMethod: 'wallet', priceUsd, userId: String(req.user._id) }
      });

      let systemWallet = await SystemWallet.findOne({ name: 'admin_wallet' });
      if (!systemWallet) systemWallet = await SystemWallet.create({ name: 'admin_wallet' });
      systemWallet.adminUsdBalance += priceUsd;
      await systemWallet.save();

      await Transaction.create({
        user: req.user._id,
        type: 'ebook_wallet_payment',
        amount: priceUsd,
        currency: 'USD',
        direction: 'debit',
        wallet: 'user',
        description: `Wallet purchase: ${ebook.title}`,
        meta: { purchaseId: purchase._id, ebookId: ebook._id, paymentMethod: 'wallet' }
      });
      await Transaction.create({
        user: req.user._id,
        type: 'ebook_wallet_payment_received',
        amount: priceUsd,
        currency: 'USD',
        direction: 'credit',
        wallet: 'admin',
        description: `Wallet payment received for e-book: ${ebook.title}`,
        meta: { purchaseId: purchase._id, ebookId: ebook._id, userId: req.user._id }
      });

      return res.status(201).json({ paid: true, message: 'E-book purchased successfully using your wallet balance.', purchaseId: purchase._id, wallet });
    } catch (error) {
      await Wallet.updateOne({ user: req.user._id }, { $inc: { usdBalance: priceUsd } });
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/payments/verify/:reference', async (req, res) => {
  try {
    const purchase = await EbookPurchase.findOne({ paystackReference: req.params.reference });
    if (!purchase) return res.status(404).json({ message: 'E-book purchase not found.' });
    if (purchase.status === 'paid') return res.json({ paid: true, purchaseId: purchase._id, ebookId: purchase.ebook });

    const result = await verifyPaystackTransaction(req.params.reference);
    const data = result.data || {};
    const expectedKobo = Math.round(Number(purchase.amount) * 100);
    if (data.status !== 'success') {
      purchase.status = 'failed';
      await purchase.save();
      return res.status(402).json({ paid: false, message: 'Paystack payment was not successful.' });
    }
    if (Number(data.amount) !== expectedKobo || String(data.currency || '').toUpperCase() !== String(purchase.currency).toUpperCase()) {
      return res.status(400).json({ paid: false, message: 'Payment amount or currency did not match the e-book price.' });
    }

    purchase.status = 'paid';
    purchase.paidAt = new Date();
    purchase.metadata = { ...(purchase.metadata || {}), paystackTransactionId: data.id, channel: data.channel, customerEmail: data.customer?.email || '' };
    await purchase.save();
    res.json({ paid: true, purchaseId: purchase._id, ebookId: purchase.ebook, message: 'Payment verified. Your e-book is now available in your dashboard.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/purchases', protect, async (req, res) => {
  try {
    const purchases = await EbookPurchase.find({ user: req.user._id, status: 'paid' }).populate('ebook', 'title description category price currency pageCount fileName fileSize coverUrl').sort({ paidAt: -1 });
    res.json({ purchases });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/ebooks/:id/free-download', protect, async (req, res) => {
  try {
    const ebook = await Ebook.findOne({ _id: req.params.id, published: true }).select('+fileData title fileName mimeType price');
    if (!ebook) return res.status(404).json({ message: 'Product not found.' });
    if (Number(ebook.price || 0) > 0) return res.status(402).json({ message: 'This product requires payment before download.' });
    if (!ebook.fileData?.length) return res.status(404).json({ message: 'Free product file is unavailable.' });
    res.setHeader('Content-Type', ebook.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${String(ebook.fileName || 'SP-WorldTech-Product').replace(/"/g, '')}"`);
    res.setHeader('Content-Length', ebook.fileData.length);
    res.send(ebook.fileData);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/download/:purchaseId', protect, async (req, res) => {
  try {
    const purchase = await EbookPurchase.findOne({ _id: req.params.purchaseId, user: req.user._id, status: 'paid' }).populate({ path: 'ebook', select: '+fileData title fileName mimeType' });
    if (!purchase?.ebook?.fileData) return res.status(404).json({ message: 'Paid e-book file not found.' });
    res.setHeader('Content-Type', purchase.ebook.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${String(purchase.ebook.fileName || 'ebook').replace(/"/g, '')}"`);
    res.setHeader('Content-Length', purchase.ebook.fileData.length);
    res.send(purchase.ebook.fileData);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/admin/ebooks', protect, requireAdmin, async (_req, res) => {
  try {
    const ebooks = await Ebook.find().sort({ createdAt: -1 });
    res.json({ ebooks: ebooks.map(publicEbook) });
  } catch (error) { res.status(500).json({ message: 'Could not load products. Please try again.' }); }
});

router.post('/admin/ebooks', protect, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, productType = 'ebook', price, oldPrice = 0, pageCount = 0, whatsappNumber = '', fileName, mimeType, fileBase64, coverUrl = '', coverFileName = '', coverMimeType = '', coverBase64 = '', published = true } = req.body || {};
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle || !fileName || !mimeType || !fileBase64) return res.status(400).json({ message: 'Product title and downloadable product file are required.' });
    if (cleanTitle.length > 180) return res.status(400).json({ message: 'Product titles must be 180 characters or fewer.' });
    const allowed = ['application/zip', 'application/x-zip-compressed', 'application/pdf', 'application/epub+zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/octet-stream', 'application/vnd.oasis.opendocument.text'];
    const normalizedType = String(productType || 'ebook').toLowerCase();
    if (!['ebook', 'download', 'logo', 'template', 'software', 'other'].includes(normalizedType)) return res.status(400).json({ message: 'Choose a valid product type.' });
    if (!allowed.includes(String(mimeType))) return res.status(400).json({ message: 'Supported files: ZIP, PDF, EPUB, DOC/DOCX, TXT, ODT, PNG, JPG, WEBP, GIF or SVG.' });
    const numericFields = { price: price ?? 0, oldPrice: oldPrice ?? 0, pageCount: pageCount ?? 0 };
    for (const [field, raw] of Object.entries(numericFields)) {
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) return res.status(400).json({ message: `Enter a valid non-negative ${field === 'pageCount' ? 'page count' : field === 'oldPrice' ? 'old price' : 'price'}.` });
    }
    const cleanBase64 = String(fileBase64).replace(/^data:[^;]+;base64,/, '');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64) || cleanBase64.length % 4 === 1) return res.status(400).json({ message: 'The uploaded product file could not be read. Please choose the file again.' });
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (!buffer.length) return res.status(400).json({ message: 'The uploaded product file is empty.' });
    if (buffer.length > MAX_FILE_BYTES) return res.status(413).json({ message: 'Product files must be 15 MB or smaller.' });
    if (!signatureMatches(mimeType, buffer)) return res.status(400).json({ message: 'The uploaded file content does not match its declared type. Choose a valid file.' });
    let coverBuffer = null;
    const allowedCoverTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (coverBase64) {
      if (!allowedCoverTypes.includes(String(coverMimeType).toLowerCase())) return res.status(400).json({ message: 'Product covers must be PNG, JPG, WEBP or GIF images.' });
      const cleanCoverBase64 = String(coverBase64).replace(/^data:[^;]+;base64,/, '');
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanCoverBase64) || cleanCoverBase64.length % 4 === 1) return res.status(400).json({ message: 'The product cover could not be read. Please choose the image again.' });
      coverBuffer = Buffer.from(cleanCoverBase64, 'base64');
      if (!coverBuffer.length) return res.status(400).json({ message: 'The product cover is empty.' });
      if (coverBuffer.length > MAX_COVER_BYTES) return res.status(413).json({ message: 'Product covers must be 3 MB or smaller.' });
      if (!signatureMatches(coverMimeType, coverBuffer)) return res.status(400).json({ message: 'The cover image content does not match its declared type. Choose a valid image.' });
    }
    if (!coverBuffer && !validCoverUrl(coverUrl)) return res.status(400).json({ message: 'Cover URL must be an https:// link or a site asset path.' });
    let slug = slugify(cleanTitle);
    if (await Ebook.findOne({ slug })) slug = `${slug}-${Date.now().toString().slice(-6)}`;
    const safeFileName = String(fileName).split(/[\\/]/).pop().replace(/[\r\n\"\x00-\x1f]/g, '_').trim().slice(0, 180) || 'download';
    const isPublished = published === false || String(published).toLowerCase() === 'false' ? false : true;
    const ebook = await Ebook.create({ title: cleanTitle, slug, description: String(description || '').trim(), category: String(category || 'Digital Product').trim().slice(0, 100), productType: normalizedType, whatsappNumber: String(whatsappNumber || '').trim().slice(0, 40), price: Number(price ?? 0), oldPrice: Number(oldPrice ?? 0), currency: 'USD', pageCount: Number(pageCount ?? 0), fileName: safeFileName, mimeType: String(mimeType), fileSize: buffer.length, fileData: buffer, coverUrl: coverBuffer ? `/api/marketplace/ebooks/COVER_ID/cover` : String(coverUrl || '').trim(), coverMimeType: coverBuffer ? String(coverMimeType) : '', coverData: coverBuffer || undefined, published: isPublished, createdBy: req.user._id });
    if (coverBuffer) { ebook.coverUrl = `/api/marketplace/ebooks/${ebook._id}/cover`; await ebook.save(); }
    await JobNotification.create({ role: 'admin', title: 'Marketplace product uploaded', message: `${ebook.title} was uploaded by ${req.user.email || req.user.username || 'an administrator'} and is ${ebook.published ? 'published' : 'hidden'}.` }).catch((error) => console.error('Could not save product notification:', error.message));
    void sendAdminNotification('New SP WorldTech marketplace product', `A product was uploaded to SP WorldTech.

Title: ${ebook.title}
Type: ${ebook.productType}
Category: ${ebook.category}
Price: $${Number(ebook.price || 0).toFixed(2)} USD
Status: ${ebook.published ? 'Published' : 'Saved as hidden'}
Uploaded by: ${req.user.email || req.user.username || req.user._id}`);
    res.status(201).json({ message: 'Product uploaded successfully.', ebook: publicEbook(ebook) });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/admin/ebooks/:id/download', protect, requireAdmin, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id).select('+fileData title fileName mimeType');
    if (!ebook) return res.status(404).json({ message: 'Product not found.' });
    if (!ebook.fileData?.length) return res.status(404).json({ message: 'The stored product file is unavailable.' });
    const filename = String(ebook.fileName || `${ebook.title || 'SP-WorldTech-Product'}`).replace(/[\r\n"\\]/g, '_');
    res.setHeader('Content-Type', ebook.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', ebook.fileData.length);
    return res.send(ebook.fileData);
  } catch (error) { return res.status(500).json({ message: 'Could not download the product file.' }); }
});

router.patch('/admin/ebooks/:id', protect, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Product not found.' });
    const ebook = await Ebook.findById(req.params.id);
    if (!ebook) return res.status(404).json({ message: 'Product not found.' });
    const body = req.body || {};
    const has = (field) => Object.prototype.hasOwnProperty.call(body, field);

    if (has('title')) {
      const title = String(body.title || '').trim();
      if (!title) return res.status(400).json({ message: 'Product title is required.' });
      if (title.length > 180) return res.status(400).json({ message: 'Product titles must be 180 characters or fewer.' });
      ebook.title = title;
    }
    if (has('description')) ebook.description = String(body.description ?? '').trim();
    if (has('category')) ebook.category = String(body.category || 'Digital Product').trim().slice(0, 100);
    if (has('whatsappNumber')) ebook.whatsappNumber = String(body.whatsappNumber ?? '').trim().slice(0, 40);
    if (has('productType')) {
      const value = String(body.productType || 'other').toLowerCase();
      if (!PRODUCT_TYPES.includes(value)) return res.status(400).json({ message: 'Choose a valid product type.' });
      ebook.productType = value;
    }
    for (const [field, label] of [['price', 'price'], ['oldPrice', 'old price'], ['pageCount', 'page count']]) {
      if (!has(field)) continue;
      const value = Number(body[field] === '' || body[field] === null ? 0 : body[field]);
      if (!Number.isFinite(value) || value < 0) return res.status(400).json({ message: `Enter a valid non-negative ${label}.` });
      ebook[field] = value;
    }
    if (has('published')) {
      const value = parseBoolean(body.published, null);
      if (value === null) return res.status(400).json({ message: 'Published must be true or false.' });
      ebook.published = value;
    }

    // Optional replacement of the downloadable file.
    if (body.fileBase64) {
      const mimeType = String(body.mimeType || '');
      if (!ALLOWED_FILE_TYPES.includes(mimeType)) return res.status(400).json({ message: 'Supported files: ZIP, PDF, EPUB, DOC/DOCX, TXT, ODT, PNG, JPG, WEBP, GIF or SVG.' });
      const buffer = decodeBase64(body.fileBase64);
      if (!buffer) return res.status(400).json({ message: 'The uploaded product file could not be read. Please choose the file again.' });
      if (!buffer.length) return res.status(400).json({ message: 'The uploaded product file is empty.' });
      if (buffer.length > MAX_FILE_BYTES) return res.status(413).json({ message: 'Product files must be 15 MB or smaller.' });
      if (!signatureMatches(mimeType, buffer)) return res.status(400).json({ message: 'The uploaded file content does not match its declared type. Choose a valid file.' });
      ebook.fileData = buffer;
      ebook.fileSize = buffer.length;
      ebook.mimeType = mimeType;
      ebook.fileName = String(body.fileName || ebook.fileName).split(/[\\/]/).pop().replace(/[\r\n"\x00-\x1f]/g, '_').trim().slice(0, 180) || 'download';
    }

    // Optional replacement / removal of the cover image.
    if (body.coverBase64) {
      const coverMimeType = String(body.coverMimeType || '').toLowerCase();
      if (!ALLOWED_COVER_TYPES.includes(coverMimeType)) return res.status(400).json({ message: 'Product covers must be PNG, JPG, WEBP or GIF images.' });
      const coverBuffer = decodeBase64(body.coverBase64);
      if (!coverBuffer || !coverBuffer.length) return res.status(400).json({ message: 'The product cover could not be read. Please choose the image again.' });
      if (coverBuffer.length > MAX_COVER_BYTES) return res.status(413).json({ message: 'Product covers must be 3 MB or smaller.' });
      if (!signatureMatches(coverMimeType, coverBuffer)) return res.status(400).json({ message: 'The cover image content does not match its declared type. Choose a valid image.' });
      ebook.coverData = coverBuffer;
      ebook.coverMimeType = coverMimeType;
      ebook.coverUrl = `/api/marketplace/ebooks/${ebook._id}/cover`;
    } else if (parseBoolean(body.removeCover, false)) {
      ebook.coverData = undefined;
      ebook.coverMimeType = '';
      ebook.coverUrl = '';
    } else if (has('coverUrl')) {
      if (!validCoverUrl(body.coverUrl)) return res.status(400).json({ message: 'Cover URL must be an https:// link or a site asset path.' });
      ebook.coverUrl = String(body.coverUrl || '').trim();
    }

    await ebook.save();
    res.json({ message: ebook.published ? 'Product updated and published live.' : 'Product updated and hidden from the public marketplace.', ebook: publicEbook(ebook) });
  } catch (error) {
    console.error('Product update failed:', error.message);
    res.status(500).json({ message: 'Could not update the product. Please try again.' });
  }
});

router.delete('/admin/ebooks/:id', protect, requireAdminOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Product not found.' });
    const ebook = await Ebook.findById(req.params.id).select('title');
    if (!ebook) return res.status(404).json({ message: 'Product not found.' });
    const paidPurchases = await EbookPurchase.countDocuments({ ebook: ebook._id, status: 'paid' });
    if (paidPurchases > 0) {
      return res.status(409).json({ message: `${ebook.title} has ${paidPurchases} paid purchase(s), so it cannot be deleted. Hide it instead; buyers keep their downloads.` });
    }
    await Ebook.deleteOne({ _id: ebook._id });
    await EbookPurchase.deleteMany({ ebook: ebook._id, status: { $ne: 'paid' } });
    res.json({ message: 'Product deleted.' });
  } catch (error) {
    console.error('Product delete failed:', error.message);
    res.status(500).json({ message: 'Could not delete the product. Please try again.' });
  }
});

module.exports = router;
