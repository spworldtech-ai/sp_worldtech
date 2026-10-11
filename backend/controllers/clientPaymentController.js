const ClientPayment = require('../models/ClientPayment');
const Wallet = require('../models/Wallet');
const SystemWallet = require('../models/SystemWallet');
const Transaction = require('../models/Transaction');
const { initializePaystackPayment } = require('../services/paystackService');
const { convertUsdToNgn } = require('../services/fxService');

async function ensureSystemWallet() {
  let wallet = await SystemWallet.findOne({ name: 'admin_wallet' });
  if (!wallet) wallet = await SystemWallet.create({ name: 'admin_wallet' });
  return wallet;
}

function makeReference() {
  return `SPWT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

exports.createClientPayment = async (req, res) => {
  try {
    const { clientName, clientEmail, projectTitle, paymentType = 'advance', amount, currency = process.env.CLIENT_PAYMENT_CURRENCY || 'NGN', notes } = req.body;
    if (!clientName || !projectTitle || !amount) return res.status(400).json({ message: 'Provide client name, project title, and amount.' });
    const paystackReference = makeReference();
    const payment = await ClientPayment.create({ clientName, clientEmail, projectTitle, paymentType, amount: Number(amount), currency, notes, paystackReference, status: 'pending' });
    const checkout = await initializePaystackPayment({
      email: clientEmail || process.env.ADMIN_PAYMENT_EMAIL || 'support@spworldtech.com',
      amount: Number(amount),
      currency,
      reference: paystackReference,
      callbackUrl: process.env.PAYSTACK_CALLBACK_URL,
      metadata: { paymentId: String(payment._id), clientName, projectTitle, paymentType }
    });
    if (checkout.attempted && checkout.data?.authorization_url) {
      payment.status = 'checkout_created';
      await payment.save();
    }
    res.status(201).json({
      message: checkout.attempted ? 'Secure checkout created for client payment.' : checkout.message,
      payment,
      checkoutUrl: checkout.data?.authorization_url || '',
      accessCode: checkout.data?.access_code || ''
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markClientPaymentSettled = async (req, res) => {
  try {
    const payment = await ClientPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    const fee = Number(req.body.paystackFee || payment.paystackFee || 0);
    const settled = Math.max(0, Number(req.body.settledAmount || payment.amount || 0) - fee);
    payment.status = 'settled';
    payment.paystackFee = fee;
    payment.settledAmount = settled;
    payment.paystackReference = req.body.paystackReference || payment.paystackReference;
    await payment.save();
    const wallet = await ensureSystemWallet();
    if (payment.currency === 'NGN') wallet.adminNgnBalance += settled;
    else wallet.adminUsdBalance += settled;
    await wallet.save();
    await Transaction.create({ type: 'client_paystack_settlement', amount: settled, currency: payment.currency, wallet: 'admin', description: `Client payment settled for ${payment.projectTitle}`, meta: { paymentId: payment._id, paystackFee: fee, paymentType: payment.paymentType } });
    res.json({ message: 'Client payment settled to admin system wallet after processing charges.', payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listClientPayments = async (_req, res) => {
  const payments = await ClientPayment.find().sort({ createdAt: -1 }).limit(100);
  res.json({ payments });
};


exports.createAuthenticatedClientPayment = async (req, res) => {
  try {
    const { projectTitle, paymentType = 'advance', amount, currency = 'USD', notes } = req.body || {};
    const value = Number(amount || 0);
    if (!projectTitle || !value || value <= 0) return res.status(400).json({ message: 'Project/service and a valid USD payment amount are required.' });
    const normalizedCurrency = String(currency).toUpperCase() === 'USD' ? 'USD' : 'NGN';
    const conversion = normalizedCurrency === 'USD' ? await convertUsdToNgn(value) : { usd: null, rate: null, ngn: Math.round(value) };
    const paystackAmount = conversion.ngn;
    const paystackReference = makeReference();
    const payment = await ClientPayment.create({
      clientName: req.user.fullName,
      clientEmail: req.user.email,
      projectTitle: String(projectTitle).trim(),
      paymentType,
      amount: paystackAmount,
      currency: 'NGN',
      notes,
      paystackReference,
      status: 'pending',
      metadata: { displayCurrency: normalizedCurrency, displayAmount: value, exchangeRateUsdToNgn: conversion.rate, payableNgn: paystackAmount }
    });
    const site = String(process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://spworldtech.com').replace(/\/$/, '');
    const callbackUrl = process.env.PAYSTACK_SERVICE_CALLBACK_URL || `${site}/dashboard.html`;
    const checkout = await initializePaystackPayment({ email: req.user.email, amount: paystackAmount, currency: 'NGN', reference: paystackReference, callbackUrl, metadata: { type: 'service_payment', paymentId: String(payment._id), userId: String(req.user._id), projectTitle: payment.projectTitle, paymentType, displayAmountUsd: normalizedCurrency === 'USD' ? value : null, exchangeRateUsdToNgn: conversion.rate } });
    if (!checkout.attempted || !checkout.data?.authorization_url) return res.status(503).json({ message: checkout.message || 'Paystack checkout is not configured.' });
    payment.status = 'checkout_created';
    await payment.save();
    res.status(201).json({ checkoutUrl: checkout.data.authorization_url, accessCode: checkout.data.access_code, reference: paystackReference, paymentId: payment._id, payment: { displayCurrency: normalizedCurrency, displayAmount: value, currency: 'NGN', amount: paystackAmount, exchangeRate: conversion.rate } });
  } catch (error) { res.status(500).json({ message: error.message }); }
};


exports.createWalletClientPayment = async (req, res) => {
  try {
    const { projectTitle, paymentType = 'advance', amount, currency = 'USD', notes } = req.body || {};
    const value = Number(amount || 0);
    const normalizedCurrency = String(currency || 'USD').toUpperCase();
    if (!projectTitle || !Number.isFinite(value) || value <= 0) return res.status(400).json({ message: 'Project/service and a valid payment amount are required.' });
    if (!['USD', 'NGN'].includes(normalizedCurrency)) return res.status(400).json({ message: 'Wallet payments support USD or NGN.' });

    const field = normalizedCurrency === 'USD' ? 'usdBalance' : 'ngnBalance';
    const wallet = await Wallet.findOneAndUpdate(
      { user: req.user._id, [field]: { $gte: value } },
      { $inc: { [field]: -value } },
      { new: true }
    );
    if (!wallet) return res.status(400).json({ message: `Insufficient ${normalizedCurrency} wallet balance.` });

    try {
      const payment = await ClientPayment.create({
        clientName: req.user.fullName,
        clientEmail: req.user.email,
        projectTitle: String(projectTitle).trim(),
        paymentType,
        amount: value,
        currency: normalizedCurrency,
        paystackReference: makeReference(),
        status: 'settled',
        settledAmount: value,
        notes: `${String(notes || '').trim()} ${String(notes || '').trim() ? '' : ''}Paid from SP WorldTech wallet.`.trim(),
        metadata: { paymentMethod: 'wallet', userId: String(req.user._id) }
      });

      const systemWallet = await ensureSystemWallet();
      if (normalizedCurrency === 'USD') systemWallet.adminUsdBalance += value;
      else systemWallet.adminNgnBalance += value;
      await systemWallet.save();

      await Transaction.create({
        user: req.user._id,
        type: 'client_wallet_payment',
        amount: value,
        currency: normalizedCurrency,
        direction: 'debit',
        wallet: 'user',
        description: `Wallet payment for ${String(projectTitle).trim()}`,
        meta: { paymentId: payment._id, paymentMethod: 'wallet', paymentType }
      });
      await Transaction.create({
        user: req.user._id,
        type: 'client_wallet_payment_received',
        amount: value,
        currency: normalizedCurrency,
        direction: 'credit',
        wallet: 'admin',
        description: `Wallet payment received for ${String(projectTitle).trim()}`,
        meta: { paymentId: payment._id, userId: req.user._id, paymentMethod: 'wallet', paymentType }
      });

      return res.status(201).json({ paid: true, message: 'Payment completed from your wallet balance.', payment, wallet });
    } catch (error) {
      await Wallet.updateOne({ user: req.user._id }, { $inc: { [field]: value } });
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyAuthenticatedClientPayment = async (req, res) => {
  try {
    const reference = String(req.params.reference || '').trim();
    const payment = await ClientPayment.findOne({ paystackReference: reference, clientEmail: req.user.email });
    if (!payment) return res.status(404).json({ message: 'Payment not found for this account.' });
    if (payment.status === 'settled') return res.json({ paid: true, message: 'Payment already verified.', payment });

    const { verifyPaystackTransaction } = require('../services/paystackService');
    const result = await verifyPaystackTransaction(reference);
    const data = result.data || {};
    if (data.status !== 'success') return res.status(402).json({ paid: false, message: 'Payment was not successful.' });
    if (Number(data.amount) !== Math.round(Number(payment.amount) * 100) || String(data.currency || '').toUpperCase() !== String(payment.currency).toUpperCase()) {
      return res.status(400).json({ paid: false, message: 'Payment amount or currency did not match the agreed payment.' });
    }

    payment.status = 'settled';
    payment.settledAmount = Number(payment.amount);
    payment.paystackReference = reference;
    payment.notes = `${payment.notes ? payment.notes + ' ' : ''}Verified by Paystack.`.trim();
    await payment.save();

    const wallet = await ensureSystemWallet();
    if (payment.currency === 'NGN') wallet.adminNgnBalance += Number(payment.amount); else wallet.adminUsdBalance += Number(payment.amount);
    await wallet.save();
    await Transaction.create({ type: 'client_paystack_payment_verified', amount: Number(payment.amount), currency: payment.currency, wallet: 'admin', description: `Verified service payment: ${payment.projectTitle}`, meta: { paymentId: payment._id, paystackReference: reference, userId: req.user._id, transactionId: data.id } });
    res.json({ paid: true, message: 'Payment verified successfully.', payment });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
