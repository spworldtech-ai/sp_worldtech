const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');

function requireAdmin(req, res, next) {
  if (!['admin', 'owner'].includes(req.user?.role)) return res.status(403).json({ message: 'Admin or owner access required.' });
  next();
}

router.get('/settings', protect, requireAdmin, (_req, res) => {
  const percentage = Number(process.env.TYNA_SPWORLDTECH_PERCENTAGE || 100);
  res.json({
    tynaSpWorldTechPercentage: Math.min(100, Math.max(0, percentage)),
    tynaConfigured: Boolean(process.env.TYNA_VERIFY_URL && process.env.TYNA_TRANSFER_URL && process.env.TYNA_INTERNAL_API_KEY && process.env.SPWORLDTECH_TYNA_TOKEN_ENCRYPTION_SECRET)
  });
});

module.exports = router;
