const Wallet = require('../models/Wallet');
const Withdrawal = require('../models/Withdrawal');
const ProductRequest = require('../models/ProductRequest');
const SystemWallet = require('../models/SystemWallet');
const Transaction = require('../models/Transaction');
const SpTokenVoucher = require('../models/SpTokenVoucher');
const crypto = require('crypto');
const { submitToStrowallet, buildSafeProductRequestPayload } = require('../services/strowalletService');

const PRODUCT_FEES = {
  'Nigeria Virtual Bank Account': { amount: 0, currency: 'NGN', label: 'Free' },
  'USA Virtual Bank Account': { amount: 10, currency: 'USD', label: '$10' },
  'Nigeria Virtual Card': { amount: 1000, currency: 'NGN', label: '₦1,000' },
  'USA Virtual Card': { amount: 5, currency: 'USD', label: '$5' },
  'Naira Physical Card': { amount: 3000, currency: 'NGN', label: '₦3,000' },
  'Airtime Top-up': { amount: 0, currency: 'NGN', label: 'Pay provider amount' },
  'Data Subscription': { amount: 0, currency: 'NGN', label: 'Pay provider amount' },
  'Fund Transfer': { amount: 0, currency: 'NGN', label: 'Provider fee applies' },
  'Bill Payments': { amount: 0, currency: 'NGN', label: 'Provider fee applies' },
  'My Subscription': { amount: 0, currency: 'NGN', label: 'Provider fee applies' },
  'Business Operations': { amount: 0, currency: 'NGN', label: 'Provider fee applies' },
  'My Merchants': { amount: 0, currency: 'NGN', label: 'Provider fee applies' },
  'Virtual Accounts': { amount: 0, currency: 'NGN', label: 'Provider fee applies' },
  'Support Ticket': { amount: 0, currency: 'NGN', label: 'Free support' }
};


async function ensureWallet(userId) {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) wallet = await Wallet.create({ user: userId });
  return wallet;
}


function hashSpToken(code) {
  return crypto.createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex');
}

function makeSpTokenCode(prefix = 'SPW') {
  const raw = crypto.randomBytes(12).toString('hex').toUpperCase();
  return `${prefix}-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}`;
}

function maskSpToken(code = '') {
  return code ? `${code.slice(0, 7)}••••••••${code.slice(-5)}` : '';
}

async function ensureSystemWallet() {
  let wallet = await SystemWallet.findOne({ name: 'admin_wallet' });
  if (!wallet) wallet = await SystemWallet.create({ name: 'admin_wallet' });
  return wallet;
}

async function recordProductFee({ userId, productRequest, fee }) {
  if (!fee || Number(fee.amount || 0) <= 0) return;
  const systemWallet = await ensureSystemWallet();
  if (fee.currency === 'USD') systemWallet.productFeeUsd += Number(fee.amount || 0);
  if (fee.currency === 'NGN') systemWallet.productFeeNgn += Number(fee.amount || 0);
  await systemWallet.save();
  await Transaction.create({
    user: userId,
    productRequest: productRequest._id,
    type: 'strowallet_product_service_fee',
    amount: fee.amount,
    currency: fee.currency,
    wallet: 'admin',
    description: `${productRequest.productType} service fee recorded for admin wallet`,
    meta: { provider: 'strowallet', productType: productRequest.productType }
  });
}

exports.getMyWallet = async (req, res) => {
  const wallet = await ensureWallet(req.user._id);
  const productRequests = await ProductRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
  res.json({ wallet, productRequests });
};

exports.getMyProductRequests = async (req, res) => {
  const productRequests = await ProductRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ productRequests });
};

exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, channel, currency = 'USD' } = req.body;
    const value = Number(amount || 0);
    if (!value || value <= 0) return res.status(400).json({ message: 'Withdrawal amount is required.' });
    const wallet = await ensureWallet(req.user._id);
    if (value > Number(wallet.visibleEarnings || 0)) return res.status(400).json({ message: 'Amount exceeds visible earnings' });

    const withdrawal = await Withdrawal.create({ user: req.user._id, amount: value, channel });

    // SP Token is also generated for withdrawal tracking so the user and admin can verify the payout request.
    const tokenCode = makeSpTokenCode('SPW-WD');
    const spToken = await SpTokenVoucher.create({
      user: req.user._id,
      amount: value,
      currency: String(currency).toUpperCase() === 'NGN' ? 'NGN' : 'USD',
      purpose: 'withdrawal',
      codeHash: hashSpToken(tokenCode),
      codeMasked: maskSpToken(tokenCode),
      status: 'active',
      metadata: { source: 'wallet_withdrawal_request', withdrawalId: withdrawal._id, channel }
    });

    wallet.visibleEarnings -= value;
    wallet.usdBalance += value;
    await wallet.save();

    await Transaction.create({
      user: req.user._id,
      type: 'sp_token_withdrawal_request',
      amount: value,
      currency: spToken.currency,
      direction: 'debit',
      wallet: 'user',
      description: 'SP Token generated for wallet withdrawal request verification',
      meta: { withdrawalId: withdrawal._id, spTokenId: spToken._id, tokenMasked: spToken.codeMasked }
    });

    res.json({
      message: 'Withdrawal request submitted. SP Token withdrawal code generated for verification.',
      spToken: { code: tokenCode, codeMasked: spToken.codeMasked, amount: spToken.amount, currency: spToken.currency, purpose: spToken.purpose, status: spToken.status },
      withdrawal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.productRequest = async (req, res) => {
  try {
    const allowed = [
      'Nigeria Virtual Bank Account',
      'USA Virtual Bank Account',
      'Nigeria Virtual Card',
      'USA Virtual Card',
      'Naira Physical Card',
      'Airtime Top-up',
      'Data Subscription',
      'Fund Transfer',
      'Bill Payments',
      'My Subscription',
      'Business Operations',
      'My Merchants',
      'Virtual Accounts',
      'Support Ticket'
    ];

    const { productType, firstName, lastName, phone, dateOfBirth, country, state, city, address, postalCode, identityType, identityNumber, network, dataPlan, billPhone } = req.body;
    if (!allowed.includes(productType)) return res.status(400).json({ message: 'Invalid product request type' });
    if (!firstName || !lastName || !phone || !country) {
      return res.status(400).json({ message: 'Provide first name, last name, phone, and country' });
    }

    const safePayload = buildSafeProductRequestPayload({
      productType,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      country,
      state,
      city,
      address,
      postalCode,
      identityType,
      identityNumber,
      network,
      dataPlan,
      billPhone
    });

    const fee = PRODUCT_FEES[productType] || { amount: 0, currency: 'NGN', label: 'Free' };

    let product = await ProductRequest.create({
      user: req.user._id,
      ...safePayload,
      feeAmount: fee.amount,
      feeCurrency: fee.currency,
      status: 'pending',
      network,
      dataPlan,
      billPhone
    });

    const providerResult = await submitToStrowallet({
      productType,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      country,
      state,
      city,
      address,
      postalCode,
      identityType,
      identityNumber,
      customerEmail: req.user.email,
      customerName: req.user.fullName,
      network,
      dataPlan,
      billPhone
    });

    product.status = providerResult.status || product.status;
    product.providerReference = providerResult.reference;
    product.providerStatus = providerResult.status;
    product.providerMessage = providerResult.message;
    product.providerResponse = providerResult.response;
    await product.save();

    const wallet = await ensureWallet(req.user._id);
    wallet.productRequests.push({ productType, status: product.status });
    await wallet.save();
    await recordProductFee({ userId: req.user._id, productRequest: product, fee });

    res.status(201).json({
      message: providerResult.attempted
        ? `${productType} request submitted for secure provider processing.`
        : `${productType} request saved for admin review.`,
      fee: PRODUCT_FEES[productType],
      productRequest: product
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getStrowalletModules = async (_req, res) => {
  res.json({ modules: [
    { name: 'Dashboard', icon: '📊', description: 'Provider overview and service status' },
    { name: 'Fund Transfer', icon: '💸', description: 'Bank transfer request workflow' },
    { name: 'Bill Payments', icon: '🧾', description: 'Airtime, data and bill payment workflow' },
    { name: 'Card Issuing', icon: '💳', description: 'Virtual and physical card request workflow' },
    { name: 'My Subscription', icon: '🔁', description: 'Subscription products and renewals' },
    { name: 'Business Operations', icon: '🏢', description: 'Business banking operations' },
    { name: 'My Merchants', icon: '🛒', description: 'Merchant profile and business tools' },
    { name: 'Virtual Accounts', icon: '🏦', description: 'NG/US virtual account creation workflow' },
    { name: 'Support Ticket', icon: '🎧', description: 'Provider support request workflow' }
  ] });
};


exports.strowalletWebhook = async (req, res) => {
  try {
    const reference = req.body?.reference || req.body?.data?.reference || req.body?.id || req.body?.data?.id;
    const status = req.body?.status || req.body?.data?.status || 'provider_update';
    let productRequest = null;
    if (reference) {
      productRequest = await ProductRequest.findOne({ providerReference: reference });
      if (productRequest) {
        productRequest.providerStatus = status;
        productRequest.providerMessage = req.body?.message || req.body?.data?.message || productRequest.providerMessage;
        productRequest.providerResponse = req.body;
        if (['success', 'approved', 'active', 'completed'].includes(String(status).toLowerCase())) productRequest.status = 'approved';
        await productRequest.save();
      }
    }
    res.json({ received: true, productRequestId: productRequest?._id || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
