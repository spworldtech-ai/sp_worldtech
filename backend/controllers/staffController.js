const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Withdrawal = require('../models/Withdrawal');
const Message = require('../models/Message');
const Wallet = require('../models/Wallet');
const ProductRequest = require('../models/ProductRequest');
const SystemWallet = require('../models/SystemWallet');
const Transaction = require('../models/Transaction');
const ClientContact = require('../models/ClientContact');
const AIMessage = require('../models/AIMessage');
const JobActivityLog = require('../models/JobActivityLog');
const JobNotification = require('../models/JobNotification');
const { ensureJobs } = require('../services/jobService');

async function ensureSystemWallet() {
  let wallet = await SystemWallet.findOne({ name: 'admin_wallet' });
  if (!wallet) wallet = await SystemWallet.create({ name: 'admin_wallet' });
  return wallet;
}

function isAdminRole(role) {
  return ['admin', 'owner'].includes(role);
}

function safeJobForSupport(job) {
  const safe = typeof job.toObject === 'function' ? job.toObject() : { ...job };
  delete safe.fullAmount;
  delete safe.adminAmount;
  delete safe.transactionChargeAmount;
  delete safe.transactionChargePercent;
  return safe;
}

function safeApplicationForSupport(item) {
  const safe = typeof item.toObject === 'function' ? item.toObject() : { ...item };
  delete safe.fullAmount;
  delete safe.adminAmount;
  delete safe.transactionChargeAmount;
  delete safe.transactionChargePercent;
  if (safe.job) safe.job = safeJobForSupport(safe.job);
  return safe;
}

function safeProductRequestForSupport(item) {
  const safe = typeof item.toObject === 'function' ? item.toObject() : { ...item };
  delete safe.feeAmount;
  delete safe.feeCurrency;
  delete safe.providerResponse;
  delete safe.identityNumber;
  return safe;
}

exports.getDashboard = async (req, res) => {
  await ensureJobs();
  const systemWallet = await ensureSystemWallet();

  const [
    users,
    totalJobs,
    jobs,
    applications,
    withdrawals,
    messages,
    walletTotals,
    pendingWithdrawals,
    productRequests,
    transactions,
    clientContacts,
    aiMessages,
    jobActivityLogs,
    jobNotifications
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Job.countDocuments(),
    Job.find().sort({ createdAt: -1 }).limit(20),
    Application.find().populate('user').populate('job').sort({ createdAt: -1 }).limit(20),
    Withdrawal.find().populate('user').sort({ createdAt: -1 }).limit(20),
    Message.find().sort({ createdAt: 1 }).limit(50),
    Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalUsdBalance: { $sum: '$usdBalance' },
          totalNgnBalance: { $sum: '$ngnBalance' },
          totalVisibleEarnings: { $sum: '$visibleEarnings' }
        }
      }
    ]),
    Withdrawal.countDocuments({ status: 'pending' }),
    ProductRequest.find().populate('user').sort({ createdAt: -1 }).limit(20),
    Transaction.find().populate('user').sort({ createdAt: -1 }).limit(20),
    ClientContact.find().populate('application').populate('job').sort({ updatedAt: -1 }).limit(50),
    AIMessage.find().populate('application').populate('job').sort({ createdAt: -1 }).limit(50),
    JobActivityLog.find().populate('user').populate('application').populate('job').sort({ createdAt: -1 }).limit(50),
    JobNotification.find({ role: { $in: ['admin', 'owner'] } }).populate('application').populate('job').sort({ createdAt: -1 }).limit(50)
  ]);

  const walletSummary = walletTotals[0] || {
    totalUsdBalance: 0,
    totalNgnBalance: 0,
    totalVisibleEarnings: 0
  };

  const isAdmin = isAdminRole(req.user.role);
  res.json({
    stats: {
      users,
      jobs: totalJobs,
      applications: applications.length,
      pendingWithdrawals: isAdmin ? pendingWithdrawals : 0,
      productRequests: productRequests.length,
      transactions: isAdmin ? transactions.length : 0
    },
    walletSummary: isAdmin ? walletSummary : undefined,
    systemWallet: isAdmin ? systemWallet : undefined,
    jobs: isAdmin ? jobs : jobs.map(safeJobForSupport),
    applications: isAdmin ? applications : applications.map(safeApplicationForSupport),
    withdrawals: isAdmin ? withdrawals : [],
    productRequests: isAdmin ? productRequests : productRequests.map(safeProductRequestForSupport),
    transactions: isAdmin ? transactions : [],
    messages,
    clientContacts: isAdmin ? clientContacts : [],
    aiMessages: isAdmin ? aiMessages : [],
    jobActivityLogs: isAdmin ? jobActivityLogs : [],
    jobNotifications: isAdmin ? jobNotifications : [],
    role: req.user.role
  });
};


exports.getPlatformSettings = async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ message: 'Owner / Super Admin access only' });
  res.json({
    role: req.user.role,
    integrations: {
      mongodb: Boolean(process.env.MONGODB_URI),
      recruitment: Boolean(process.env.JSEARCH_API_KEY),
      strowallet: Boolean((process.env.STROWALLET_PUBLIC_KEY || process.env.STROWALLET_API_KEY) && process.env.STROWALLET_SECRET_KEY),
      paystack: Boolean(process.env.PAYSTACK_SECRET_KEY && !String(process.env.PAYSTACK_SECRET_KEY).includes('replace')),
      aiMessageGenerator: true
    },
    jobSource: 'SP WorldTech recruitment portal → Jobs page/dashboard → Worker applies',
    rolePolicy: {
      worker: 'Sees only 40% earning amount',
      admin: 'Sees full price, worker 40%, admin 60%',
      staff: 'Support only; no wallet, payment, revenue, or environment access',
      owner: 'Admin permissions plus API/env/platform settings'
    }
  });
};

exports.approveApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('user').populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (!['Under Review', 'under_review', 'Submitted', 'applied'].includes(application.status)) return res.status(400).json({ message: 'Only submitted or under-review applications can be accepted' });

    const userWallet = await Wallet.findOne({ user: application.user._id }) || await Wallet.create({ user: application.user._id });
    const systemWallet = await ensureSystemWallet();

    userWallet.visibleEarnings += application.userVisibleAmount;
    await userWallet.save();

    systemWallet.adminUsdBalance += application.adminAmount + application.transactionChargeAmount;
    systemWallet.jobRevenueUsd += application.adminAmount;
    systemWallet.transactionChargesUsd += application.transactionChargeAmount;
    await systemWallet.save();

    application.status = 'Accepted';
    application.statusHistory.push({ status: 'Accepted', note: 'Admin accepted application and completed internal payout split.', changedBy: req.user._id });
    application.approvedAt = new Date();
    application.paidAt = new Date();
    await application.save();

    await Transaction.insertMany([
      {
        user: application.user._id,
        application: application._id,
        type: 'job_user_payout_40_percent',
        amount: application.userVisibleAmount,
        currency: 'USD',
        wallet: 'user',
        description: `User payout: 40% of ${application.job.title}`,
        meta: { fullAmount: application.fullAmount, userPercent: 40 }
      },
      {
        user: application.user._id,
        application: application._id,
        type: 'admin_job_revenue_60_percent',
        amount: application.adminAmount,
        currency: 'USD',
        wallet: 'admin',
        description: `Admin revenue: 60% of ${application.job.title}`,
        meta: { fullAmount: application.fullAmount, adminPercent: 60 }
      },
      {
        user: application.user._id,
        application: application._id,
        type: 'transaction_charge',
        amount: application.transactionChargeAmount,
        currency: 'USD',
        wallet: 'admin',
        description: `Transaction charge for ${application.job.title}`,
        meta: { chargePercent: application.transactionChargePercent, fullAmount: application.fullAmount }
      }
    ]);

    await JobActivityLog.create({ user: req.user._id, application: application._id, job: application.job._id, action: 'Application Accepted', message: 'Admin accepted the application.' });
    await JobNotification.create({ user: application.user._id, role: 'user', title: 'Application accepted', message: `Your application for ${application.job.title} was accepted.`, application: application._id, job: application.job._id }).catch(() => null);
    res.json({ message: 'Application accepted. User received 40%, admin wallet received 60% plus transaction charge.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    application.status = 'Rejected';
    application.statusHistory.push({ status: 'Rejected', note: 'Admin rejected the application.', changedBy: req.user._id });
    await application.save();
    await JobActivityLog.create({ user: req.user._id, application: application._id, job: application.job, action: 'Application Rejected', message: 'Admin rejected the application.' }).catch(() => null);
    await JobNotification.create({ user: application.user, role: 'user', title: 'Application rejected', message: 'Your application was rejected after SP WorldTech review.', application: application._id, job: application.job }).catch(() => null);
    res.json({ message: 'Application rejected.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.updateApplicationStatus = async (req, res) => {
  try {
    const allowed = ['Submitted', 'Under Review', 'Contacting Client', 'Client Responded', 'Interview', 'Accepted', 'Rejected', 'Closed'];
    const { status, note } = req.body;
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid application status.' });
    const application = await Application.findById(req.params.id).populate('user').populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    application.status = status;
    application.statusHistory.push({ status, note: note || `Status changed to ${status}`, changedBy: req.user._id });
    await application.save();
    await JobActivityLog.create({ user: req.user._id, application: application._id, job: application.job?._id, action: 'Application Status Changed', message: note || `Application status changed to ${status}.` });
    await JobNotification.create({ user: application.user?._id, role: 'user', title: 'Application status updated', message: `Your application for ${application.job?.title || 'a job'} is now: ${status}.`, application: application._id, job: application.job?._id }).catch(() => null);
    res.json({ message: 'Application status updated.', application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id).populate('user');
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    if (withdrawal.status !== 'pending') return res.status(400).json({ message: 'Only pending withdrawals can be approved' });

    withdrawal.status = 'approved';
    await withdrawal.save();

    await Transaction.create({
      user: withdrawal.user._id,
      type: 'user_withdrawal_approved',
      amount: withdrawal.amount,
      currency: 'USD',
      direction: 'debit',
      wallet: 'user',
      description: `Withdrawal approved through ${withdrawal.channel}`,
      meta: { channel: withdrawal.channel }
    });

    res.json({ message: 'Withdrawal approved. Complete the approved bank payout through your secure payout process.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id).populate('user');
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    if (withdrawal.status !== 'pending') return res.status(400).json({ message: 'Only pending withdrawals can be rejected' });

    const userWallet = await Wallet.findOne({ user: withdrawal.user._id }) || await Wallet.create({ user: withdrawal.user._id });
    userWallet.visibleEarnings += Number(withdrawal.amount || 0);
    userWallet.usdBalance = Math.max(0, Number(userWallet.usdBalance || 0) - Number(withdrawal.amount || 0));
    await userWallet.save();

    withdrawal.status = 'rejected';
    await withdrawal.save();

    await Transaction.create({
      user: withdrawal.user._id,
      type: 'user_withdrawal_rejected_refund',
      amount: withdrawal.amount,
      currency: 'USD',
      wallet: 'user',
      description: `Withdrawal rejected and visible earnings restored`,
      meta: { channel: withdrawal.channel }
    });

    res.json({ message: 'Withdrawal rejected and user visible earnings restored.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
