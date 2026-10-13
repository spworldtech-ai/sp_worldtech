const router = require('express').Router();
const crypto = require('crypto');
const Project = require('../models/Project');
const User = require('../models/User');
const ClientPayment = require('../models/ClientPayment');
const Wallet = require('../models/Wallet');
const SystemWallet = require('../models/SystemWallet');
const Transaction = require('../models/Transaction');
const { protect, authorize } = require('../middleware/auth');
const { initializePaystackPayment, verifyPaystackTransaction } = require('../services/paystackService');
const { convertUsdToNgn } = require('../services/fxService');

const staffOrAdmin = authorize('admin', 'owner', 'staff');

function ref(prefix = 'SPWT-PROJECT') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function clean(value, max = 5000) {
  return String(value ?? '').trim().slice(0, max);
}

function publicProject(project) {
  const p = project.toObject ? project.toObject() : project;
  return {
    id: p._id,
    title: p.title,
    description: p.description,
    clientName: p.clientName,
    clientEmail: p.clientEmail,
    totalAmount: Number(p.totalAmount || 0),
    currency: p.currency || 'USD',
    paymentOption: p.paymentOption || 'half',
    paidAmount: Number(p.paidAmount || 0),
    remainingAmount: Math.max(0, Number(p.totalAmount || 0) - Number(p.paidAmount || 0)),
    status: p.status,
    assignedTo: p.assignedTo,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    deliveryNotes: p.deliveryNotes || '',
    deliveryUrl: p.deliveryUrl || '',
    deliveryFileName: p.deliveryFileName || '',
    deliveredAt: p.deliveredAt || null,
    hasDeliveryFile: Boolean(p.deliveryFileName)
  };
}

async function systemWallet() {
  let wallet = await SystemWallet.findOne({ name: 'admin_wallet' });
  if (!wallet) wallet = await SystemWallet.create({ name: 'admin_wallet' });
  return wallet;
}

async function applySuccessfulPayment(payment, project, source = 'paystack') {
  if (payment.status !== 'settled') {
    payment.status = 'settled';
    payment.settledAmount = Number(payment.amount || 0);
    await payment.save();
  }

  project.paidAmount = Math.min(Number(project.totalAmount || 0), Number(project.paidAmount || 0) + Number(payment.metadata?.displayAmountUsd || payment.amount || 0));
  if (project.paidAmount >= project.totalAmount) project.status = project.status === 'delivered' || project.status === 'completed' ? project.status : 'in_progress';
  else if (project.status === 'pending_payment') project.status = 'in_progress';
  await project.save();

  const wallet = await systemWallet();
  const amount = Number(payment.amount || 0);
  if (payment.currency === 'NGN') wallet.adminNgnBalance += amount;
  else wallet.adminUsdBalance += amount;
  await wallet.save();

  await Transaction.create({
    user: project.client,
    type: source === 'wallet' ? 'project_wallet_payment_received' : 'project_paystack_payment_verified',
    amount,
    currency: payment.currency,
    direction: 'credit',
    wallet: 'admin',
    description: `Project payment received: ${project.title}`,
    meta: { projectId: project._id, paymentId: payment._id, paymentType: payment.paymentType, source }
  });
  return true;
}

router.get('/me', protect, authorize('user'), async (req, res) => {
  try {
    const projects = await Project.find({ client: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ projects: projects.map(publicProject) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/admin', protect, staffOrAdmin, async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }).lean();
    res.json({ projects: projects.map(publicProject) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, staffOrAdmin, async (req, res) => {
  try {
    const { title, description, clientEmail, totalAmount, paymentOption = 'half', assignedTo } = req.body || {};
    const email = clean(clientEmail, 180).toLowerCase();
    const amount = Number(totalAmount);
    if (!title || !email || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Project title, customer email and a valid total amount are required.' });
    }
    const client = await User.findOne({ email, role: 'user' });
    if (!client) return res.status(404).json({ message: 'Customer account not found for that email.' });
    const assignee = assignedTo && String(assignedTo) !== String(req.user._id)
      ? await User.findOne({ _id: assignedTo, role: { $in: ['staff', 'admin', 'owner'] } })
      : req.user;
    const project = await Project.create({
      title: clean(title, 180),
      description: clean(description),
      client: client._id,
      clientName: client.fullName,
      clientEmail: client.email,
      totalAmount: amount,
      currency: 'USD',
      paymentOption: paymentOption === 'full' ? 'full' : 'half',
      assignedTo: assignee?._id || req.user._id,
      createdBy: req.user._id
    });
    res.status(201).json({ message: 'Project created for the customer.', project: publicProject(project) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id', protect, staffOrAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    const allowedStatuses = ['pending_payment', 'in_progress', 'ready_for_delivery', 'delivered', 'completed'];
    if (req.body?.status && allowedStatuses.includes(String(req.body.status))) project.status = String(req.body.status);
    if (req.body?.title) project.title = clean(req.body.title, 180);
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'description')) project.description = clean(req.body.description);
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'assignedTo')) project.assignedTo = req.body.assignedTo || null;
    await project.save();
    res.json({ message: 'Project updated.', project: publicProject(project) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/pay', protect, authorize('user'), async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, client: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    const remaining = Math.max(0, Number(project.totalAmount) - Number(project.paidAmount));
    if (!remaining) return res.status(400).json({ message: 'This project is already fully paid.' });

    let paymentType = String(req.body?.paymentType || project.paymentOption || 'half').toLowerCase();
    if (!['half', 'full'].includes(paymentType)) paymentType = 'half';
    let displayAmount = paymentType === 'full' ? remaining : Math.min(remaining, Number(project.totalAmount) * 0.5);
    if (paymentType === 'half' && Number(project.paidAmount) > 0 && Number(project.paidAmount) >= Number(project.totalAmount) * 0.5) {
      return res.status(400).json({ message: 'The half-payment milestone has already been paid. Choose full payment for the remaining balance.' });
    }
    displayAmount = Number(displayAmount.toFixed(2));
    if (displayAmount <= 0) return res.status(400).json({ message: 'No payment is currently required.' });

    const conversion = await convertUsdToNgn(displayAmount);
    const paystackReference = ref();
    const payment = await ClientPayment.create({
      clientName: project.clientName,
      clientEmail: project.clientEmail,
      projectTitle: project.title,
      paymentType,
      amount: conversion.ngn,
      currency: 'NGN',
      paystackReference,
      status: 'pending',
      metadata: {
        type: 'project_payment',
        projectId: String(project._id),
        userId: String(req.user._id),
        displayCurrency: 'USD',
        displayAmountUsd: displayAmount,
        exchangeRateUsdToNgn: conversion.rate,
        payableNgn: conversion.ngn
      }
    });

    const site = String(process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://spworldtech.com').replace(/\/$/, '');
    const callbackUrl = process.env.PAYSTACK_PROJECT_CALLBACK_URL || `${site}/dashboard.html#projects`;
    const checkout = await initializePaystackPayment({
      email: req.user.email,
      amount: conversion.ngn,
      currency: 'NGN',
      reference: paystackReference,
      callbackUrl,
      metadata: { type: 'project_payment', projectId: String(project._id), paymentId: String(payment._id), paymentType, displayAmountUsd: displayAmount, exchangeRateUsdToNgn: conversion.rate }
    });
    if (!checkout.attempted || !checkout.data?.authorization_url) {
      await ClientPayment.deleteOne({ _id: payment._id });
      return res.status(503).json({ message: checkout.message || 'Paystack checkout is not configured.' });
    }
    payment.status = 'checkout_created';
    await payment.save();
    res.status(201).json({
      checkoutUrl: checkout.data.authorization_url,
      reference: paystackReference,
      payment: { id: payment._id, displayAmountUsd: displayAmount, payableNgn: conversion.ngn, exchangeRate: conversion.rate, paymentType }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/wallet-pay', protect, authorize('user'), async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, client: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    const remaining = Math.max(0, Number(project.totalAmount) - Number(project.paidAmount));
    if (!remaining) return res.status(400).json({ message: 'This project is already fully paid.' });

    let paymentType = String(req.body?.paymentType || project.paymentOption || 'half').toLowerCase();
    if (!['half', 'full'].includes(paymentType)) paymentType = 'half';
    if (paymentType === 'half' && Number(project.paidAmount) >= Number(project.totalAmount) * 0.5) {
      return res.status(400).json({ message: 'The half-payment milestone has already been paid. Choose full payment.' });
    }
    const amount = Number((paymentType === 'full' ? remaining : Math.min(remaining, Number(project.totalAmount) * 0.5)).toFixed(2));
    const wallet = await Wallet.findOneAndUpdate(
      { user: req.user._id, usdBalance: { $gte: amount } },
      { $inc: { usdBalance: -amount } },
      { new: true }
    );
    if (!wallet) return res.status(400).json({ message: 'Insufficient USD wallet balance.' });

    try {
      const payment = await ClientPayment.create({
        clientName: project.clientName,
        clientEmail: project.clientEmail,
        projectTitle: project.title,
        paymentType,
        amount,
        currency: 'USD',
        paystackReference: ref('SPWT-WALLET-PROJECT'),
        status: 'settled',
        settledAmount: amount,
        metadata: { type: 'project_payment', projectId: String(project._id), userId: String(req.user._id), displayAmountUsd: amount, paymentMethod: 'wallet' }
      });
      await applySuccessfulPayment(payment, project, 'wallet');
      res.status(201).json({ paid: true, message: `Project ${paymentType === 'full' ? 'full' : 'half'} payment completed from your wallet.`, project: publicProject(await Project.findById(project._id)) });
    } catch (error) {
      await Wallet.updateOne({ user: req.user._id }, { $inc: { usdBalance: amount } });
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/payments/verify/:reference', protect, authorize('user'), async (req, res) => {
  try {
    const payment = await ClientPayment.findOne({ paystackReference: req.params.reference, clientEmail: req.user.email });
    if (!payment || payment.metadata?.type !== 'project_payment') return res.status(404).json({ message: 'Project payment not found.' });
    const project = await Project.findOne({ _id: payment.metadata.projectId, client: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (payment.status === 'settled') return res.json({ paid: true, project: publicProject(project), message: 'Project payment already verified.' });

    const result = await verifyPaystackTransaction(req.params.reference);
    const data = result.data || {};
    if (data.status !== 'success') return res.status(402).json({ paid: false, message: 'Payment was not successful.' });
    if (Number(data.amount) !== Math.round(Number(payment.amount) * 100) || String(data.currency || '').toUpperCase() !== String(payment.currency).toUpperCase()) {
      return res.status(400).json({ paid: false, message: 'Payment amount or currency did not match the agreed project payment.' });
    }

    payment.metadata = { ...(payment.metadata || {}), paystackTransactionId: data.id, channel: data.channel, customerEmail: data.customer?.email || '' };
    await applySuccessfulPayment(payment, project, 'paystack');
    res.json({ paid: true, project: publicProject(project), message: 'Project payment verified successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/deliver', protect, staffOrAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    const deliveryNotes = clean(req.body?.deliveryNotes, 10000);
    const deliveryUrl = clean(req.body?.deliveryUrl, 1000);
    const fileName = clean(req.body?.fileName, 200);
    const mimeType = clean(req.body?.mimeType, 200);
    let fileData;
    if (req.body?.fileBase64) {
      const cleanBase64 = String(req.body.fileBase64).replace(/^data:[^;]+;base64,/, '');
      fileData = Buffer.from(cleanBase64, 'base64');
      if (!fileData.length) return res.status(400).json({ message: 'The delivery file is empty.' });
      if (fileData.length > 20 * 1024 * 1024) return res.status(413).json({ message: 'Delivery files must be 20 MB or smaller.' });
    }
    if (!deliveryNotes && !deliveryUrl && !fileData) return res.status(400).json({ message: 'Add delivery notes, a delivery link, or a project file.' });
    project.deliveryNotes = deliveryNotes;
    project.deliveryUrl = deliveryUrl;
    if (fileData) {
      project.deliveryFileData = fileData;
      project.deliveryFileName = fileName || 'SP-WorldTech-Project-Delivery';
      project.deliveryMimeType = mimeType || 'application/octet-stream';
    }
    project.status = 'delivered';
    project.deliveredAt = new Date();
    await project.save();
    res.json({ message: 'Project delivered to the customer.', project: publicProject(project) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/delivery', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).select('+deliveryFileData +deliveryMimeType deliveryFileName client');
    if (!project?.deliveryFileData) return res.status(404).json({ message: 'No project delivery file is available.' });
    const role = String(req.user.role || '').toLowerCase();
    const allowed = String(project.client) === String(req.user._id) || ['admin', 'owner', 'staff'].includes(role);
    if (!allowed) return res.status(403).json({ message: 'Access denied.' });
    res.setHeader('Content-Type', project.deliveryMimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${String(project.deliveryFileName || 'project-delivery').replace(/"/g, '')}"`);
    res.setHeader('Content-Length', project.deliveryFileData.length);
    res.send(project.deliveryFileData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
