const router = require('express').Router();
const { protect } = require('../middleware/auth');

function integrationStatus() {
  const paystackKey = String(process.env.PAYSTACK_SECRET_KEY || '');
  const recruitmentReady = Boolean(process.env.JOB_API_KEY || process.env.JSEARCH_API_KEY || process.env.RAPIDAPI_KEY);
  const aiReady = Boolean(process.env.AI_PROVIDER_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY);
  const strowalletReady = Boolean((process.env.STROWALLET_PUBLIC_KEY || process.env.STROWALLET_API_KEY) && process.env.STROWALLET_SECRET_KEY);
  return {
    database: { ready: Boolean(process.env.MONGODB_URI), requiredEnv: 'MONGODB_URI' },
    recruitment: { ready: recruitmentReady, requiredEnv: 'Secure recruitment setup' },
    ai: { ready: aiReady, requiredEnv: 'Secure AI setup' },
    strowallet: { ready: strowalletReady, requiredEnv: 'Secure wallet setup' },
    paystack: { ready: Boolean(/^sk_(live|test)_/.test(paystackKey)), requiredEnv: 'Secure payment setup' },
  };
}

const roleProducts = {
  user: [
    { name: 'Job Dashboard', href: '/job-dashboard.html', api: 'recruitment' },
    { name: 'Academy Dashboard', href: '/academy-dashboard.html', api: 'ai' },
    { name: 'Banking', href: '/banking.html', api: 'strowallet' },
  ],
  staff: [
    { name: 'Support Tickets', href: '/staff.html#support', api: 'database' },
    { name: 'Academy Support', href: '/staff.html#academy', api: 'ai' },
    { name: 'Banking Support', href: '/staff.html#banking', api: 'strowallet' }
  ],
  admin: [
    { name: 'Admin Dashboard', href: '/admin.html', api: 'database' },
    { name: 'Job Applications', href: '/admin.html#jobs', api: 'recruitment' },
    { name: 'Banking Operations', href: '/admin.html#banking', api: 'strowallet' }
  ],
  owner: [
    { name: 'Owner Control Center', href: '/admin.html', api: 'database' },
    { name: 'All Integrations', href: '/admin.html#integrations', api: 'all' }
  ]
};

router.get('/bootstrap', protect, (req, res) => {
  const role = req.user.role || 'user';
  res.json({
    brand: 'SP WorldTech — The World 🌎 Web, Applications & Software Solutions',
    user: { id: req.user._id, fullName: req.user.fullName, email: req.user.email, role },
    integrations: integrationStatus(),
    products: roleProducts[role] || roleProducts.user
  });
});

module.exports = router;
