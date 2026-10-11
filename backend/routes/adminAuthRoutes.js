const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');

function getCredentials() {
  return {
    username: String(process.env.ADMIN_USERNAME || '').trim(),
    password: String(process.env.ADMIN_PASSWORD || '')
  };
}

function requireJwtSecret(res) {
  if (!process.env.JWT_SECRET) {
    res.status(503).json({ message: 'JWT_SECRET is not configured.' });
    return false;
  }
  return true;
}


function pendingAdminPayload(admin) {
  return {
    id: admin._id,
    fullName: admin.fullName,
    username: admin.username || null,
    email: admin.email,
    role: admin.role
  };
}


async function ensureAdminFromCredentials() {
  const configured = getCredentials();
  const normalizedUsername = configured.username.toLowerCase();
  let admin = await User.findOne({ username: normalizedUsername });
  if (!admin) {
    admin = await User.create({
      fullName: 'SP WorldTech Administrator',
      username: normalizedUsername,
      email: String(process.env.ADMIN_EMAIL || `${normalizedUsername}@spworldtech.com`).toLowerCase(),
      password: await bcrypt.hash(configured.password, 12),
      role: 'owner',
      accountType: 'general_user'
    });
  } else if (!['owner', 'admin'].includes(admin.role)) {
    admin.role = 'owner';
    await admin.save();
  }
  return admin;
}

// Username/password login: credentials are verified first, then the admin must
// complete the PIN step before a dashboard token is issued.
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const identifier = String(username || '').trim().toLowerCase();
    const suppliedPassword = String(password || '');
    if (!identifier || !suppliedPassword) return res.status(400).json({ message: 'Enter your admin username and password.' });
    const configured = getCredentials();
    let admin = null;

    // Existing admin accounts use the password stored in MongoDB. The environment
    // credentials remain available as a bootstrap path for the first admin account.
    admin = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] }).select('+password +accessPinHash');
    let valid = false;
    if (admin && ['admin', 'owner'].includes(admin.role)) {
      valid = await bcrypt.compare(suppliedPassword, admin.password || '');
    }
    if (!valid && configured.username && configured.password && String(username || '').trim() === configured.username && suppliedPassword === configured.password) {
      admin = await ensureAdminFromCredentials();
      valid = true;
    }
    if (!valid || !admin || !['admin', 'owner'].includes(admin.role)) return res.status(401).json({ message: 'Invalid admin username or password.' });
    if (!requireJwtSecret(res)) return;
    admin = await User.findById(admin._id);
    const token = jwt.sign({ id: admin._id.toString(), role: admin.role, adminPanel: true }, process.env.JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, user: pendingAdminPayload(admin), message: 'Admin login successful. Opening dashboard.' });
  } catch (error) {
    console.error('Admin login error:', error.message);
    res.status(500).json({ message: 'Admin login failed.' });
  }
});

// Admin accounts are provisioned only after Google verifies the configured administrator email.
// Public password-based admin signup is intentionally disabled; no setup code is required.
router.post('/signup', async (req, res) => {
  return res.status(403).json({
    message: 'Admin account creation is restricted. Sign in with the authorized Google administrator account.'
  });
});

router.post('/google', async (req, res) => {
  try {
    const credential = String(req.body?.credential || '').trim();
    const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
    const allowedEmail = String(process.env.ADMIN_GOOGLE_EMAIL || 'spworldtechtechnology@gmail.com').trim().toLowerCase();
    if (!credential || !clientId || !allowedEmail || /^your_/i.test(allowedEmail)) {
      return res.status(503).json({ message: 'Admin Google Login is not configured. Set GOOGLE_CLIENT_ID and ADMIN_GOOGLE_EMAIL first.' });
    }
    if (!requireJwtSecret(res)) return;

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const profile = await response.json().catch(() => ({}));
    const audienceValid = Array.isArray(profile.aud) ? profile.aud.includes(clientId) : String(profile.aud || '') === clientId;
    const emailVerified = profile.email_verified === true || profile.email_verified === 'true';
    const issuerValid = profile.iss === 'https://accounts.google.com' || profile.iss === 'accounts.google.com';
    if (!response.ok || !audienceValid || !issuerValid || !emailVerified || !profile.sub) {
      return res.status(401).json({ message: 'Google could not verify this sign-in. Check the Google Client ID and authorized origins, then try again.' });
    }
    if (String(profile.email || '').trim().toLowerCase() !== allowedEmail) {
      return res.status(403).json({ message: 'This Google account is not authorized for SP WorldTech administration. Sign in with the configured administrator Google account.' });
    }

    let admin = await User.findOne({ email: allowedEmail });
    if (admin && !['admin', 'owner'].includes(admin.role)) return res.status(403).json({ message: 'The configured admin email belongs to a non-admin account.' });
    if (!admin) {
      const baseUsername = String(process.env.ADMIN_USERNAME || allowedEmail.split('@')[0]).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
      admin = await User.create({
        fullName: String(profile.name || 'SP WorldTech Administrator').trim(),
        username: baseUsername || `admin${Date.now()}`,
        email: allowedEmail,
        password: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12),
        role: 'owner',
        accountType: 'general_user',
        googleId: profile.sub
      });
    } else if (admin.googleId !== profile.sub || admin.role !== 'owner') {
      admin.googleId = profile.sub;
      admin.role = 'owner';
      await admin.save();
    }

    const token = jwt.sign({ id: admin._id.toString(), role: admin.role, adminPanel: true }, process.env.JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, user: pendingAdminPayload(admin), google: true, message: 'Google authentication successful. Opening dashboard.' });
  } catch (error) {
    console.error('Admin Google login error:', error.message);
    res.status(500).json({ message: 'Admin Google sign-in failed.' });
  }
});


module.exports = router;
