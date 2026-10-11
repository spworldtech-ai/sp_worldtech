const router = require('express').Router();
const crypto = require('crypto');
const Ebook = require('../models/Ebook');
const EbookPurchase = require('../models/EbookPurchase');
const Wallet = require('../models/Wallet');
const SystemWallet = require('../models/SystemWallet');
const Transaction = require('../models/Transaction');
const { protect, authorize } = require('../middleware/auth');
const { initializePaystackPayment, verifyPaystackTransaction } = require('../services/paystackService');
const { convertUsdToNgn } = require('../services/fxService');

function requireAdmin(req, res, next) {
  if (!['admin', 'owner', 'staff'].includes(req.user?.role)) return res.status(403).json({ message: 'Admin or owner access required.' });
  next();
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
    return res.redirect(ebook.coverUrl || '/assets/logo.jpeg');
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
  const ebooks = await Ebook.find().sort({ createdAt: -1 });
  res.json({ ebooks: ebooks.map(publicEbook) });
});

router.post('/admin/ebooks', protect, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, price, oldPrice = 0, pageCount = 0, whatsappNumber = '', fileName, mimeType, fileBase64, coverUrl = '', coverFileName = '', coverMimeType = '', coverBase64 = '', published = true } = req.body || {};
    if (!title || !fileName || !mimeType || !fileBase64) return res.status(400).json({ message: 'Product title and downloadable product file are required.' });
    const allowed = ['application/zip', 'application/pdf', 'application/epub+zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    if (!allowed.includes(mimeType)) return res.status(400).json({ message: 'Upload a ZIP, PDF, EPUB, DOC, DOCX or TXT product file.' });
    const cleanBase64 = String(fileBase64).replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (!buffer.length) return res.status(400).json({ message: 'The uploaded product file is empty.' });
    if (buffer.length > 15 * 1024 * 1024) return res.status(413).json({ message: 'Product files must be 15 MB or smaller.' });
    let coverBuffer = null;
    if (coverBase64) {
      if (!String(coverMimeType).startsWith('image/')) return res.status(400).json({ message: 'The product cover must be an image file.' });
      coverBuffer = Buffer.from(String(coverBase64).replace(/^data:[^;]+;base64,/, ''), 'base64');
      if (!coverBuffer.length) return res.status(400).json({ message: 'The product cover is empty.' });
      if (coverBuffer.length > 3 * 1024 * 1024) return res.status(413).json({ message: 'Product covers must be 3 MB or smaller.' });
    }
    let slug = slugify(title);
    if (await Ebook.findOne({ slug })) slug = `${slug}-${Date.now().toString().slice(-6)}`;
    const ebook = await Ebook.create({ title: String(title).trim(), slug, description: String(description || '').trim(), category: String(category || 'Digital Product').trim(), whatsappNumber: String(whatsappNumber || '').trim(), price: Math.max(0, Number(price || 0)), oldPrice: Math.max(0, Number(oldPrice || 0)), currency: 'USD', pageCount: Math.max(0, Number(pageCount || 0)), fileName: String(fileName).trim(), mimeType, fileSize: buffer.length, fileData: buffer, coverUrl: coverBuffer ? `/api/marketplace/ebooks/COVER_ID/cover` : String(coverUrl || '').trim(), coverMimeType: coverBuffer ? String(coverMimeType) : '', coverData: coverBuffer || undefined, published: Boolean(published), createdBy: req.user._id });
    if (coverBuffer) { ebook.coverUrl = `/api/marketplace/ebooks/${ebook._id}/cover`; await ebook.save(); }
    res.status(201).json({ message: 'E-book uploaded successfully.', ebook: publicEbook(ebook) });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.patch('/admin/ebooks/:id', protect, requireAdmin, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    if (!ebook) return res.status(404).json({ message: 'E-book not found.' });
    const allowed = ['title', 'description', 'category', 'price', 'oldPrice', 'pageCount', 'whatsappNumber', 'coverUrl', 'published'];
    for (const field of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        if (field === 'price') ebook.price = Math.max(0, Number(req.body[field] || 0));
        else if (field === 'oldPrice') ebook.oldPrice = Math.max(0, Number(req.body[field] || 0));
        else if (field === 'pageCount') ebook.pageCount = Math.max(0, Number(req.body[field] || 0));
        else if (field === 'published') ebook.published = Boolean(req.body[field]);
        else ebook[field] = String(req.body[field] ?? '').trim();
      }
    }
    if (!ebook.title) return res.status(400).json({ message: 'Product title is required.' });
    await ebook.save();
    res.json({ message: ebook.published ? 'Product updated and published live.' : 'Product updated and hidden from the public marketplace.', ebook: publicEbook(ebook) });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete('/admin/ebooks/:id', protect, requireAdmin, async (req, res) => {
  try {
    const ebook = await Ebook.findByIdAndDelete(req.params.id);
    if (!ebook) return res.status(404).json({ message: 'E-book not found.' });
    await EbookPurchase.deleteMany({ ebook: ebook._id });
    res.json({ message: 'E-book removed.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
