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

// Admin Google login/signup follows the same Google Identity flow as the Staff page.
// Google must still verify the ID token, client audience, issuer, and verified email.
// A new Google identity can create an owner account, as explicitly requested.
const googleAdminAuth = async (req, res) => {
  try {
    const credential = String(req.body?.credential || '').trim();
    const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
    if (!credential || !clientId) {
      return res.status(503).json({ message: 'Google authentication is not configured. Set GOOGLE_CLIENT_ID in the active backend environment.' });
    }
    if (!requireJwtSecret(res)) return;

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const profile = await response.json().catch(() => ({}));
    const audienceValid = Array.isArray(profile.aud) ? profile.aud.includes(clientId) : String(profile.aud || '') === clientId;
    const emailVerified = profile.email_verified === true || profile.email_verified === 'true';
    const issuerValid = profile.iss === 'https://accounts.google.com' || profile.iss === 'accounts.google.com';
    if (!response.ok || !audienceValid || !issuerValid || !emailVerified || !profile.sub || !profile.email) {
      return res.status(401).json({ message: 'Google could not verify this sign-in. Check GOOGLE_CLIENT_ID and authorized origins, then try again.' });
    }

    const email = String(profile.email).trim().toLowerCase();
    let admin = await User.findOne({ $or: [{ googleId: profile.sub }, { email }] });
    if (admin && !['admin', 'owner'].includes(String(admin.role || '').toLowerCase())) {
      return res.status(409).json({ message: 'This Google email is already registered with a different role. Use a separate Google account for Admin.' });
    }

    if (!admin) {
      const baseUsername = String(process.env.ADMIN_USERNAME || email.split('@')[0]).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
      let username = baseUsername || `admin${Date.now()}`;
      let suffix = 1;
      while (await User.findOne({ username })) username = `${baseUsername || 'admin'}${suffix++}`;
      admin = await User.create({
        fullName: String(profile.name || 'SP WorldTech Administrator').trim(),
        username,
        email,
        password: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12),
        role: 'owner',
        accountType: 'general_user',
        googleId: profile.sub
      });
    } else {
      let changed = false;
      if (!admin.googleId) { admin.googleId = profile.sub; changed = true; }
      if (admin.role !== 'owner') { admin.role = 'owner'; changed = true; }
      if (profile.name && !admin.fullName) { admin.fullName = String(profile.name).trim(); changed = true; }
      if (changed) await admin.save();
    }

    const token = jwt.sign({ id: admin._id.toString(), role: admin.role, adminPanel: true }, process.env.JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, user: pendingAdminPayload(admin), google: true, message: 'Google authentication successful. Opening dashboard.' });
  } catch (error) {
    console.error('Admin Google sign-in error:', error.message);
    return res.status(500).json({ message: 'Admin Google sign-in failed.' });
  }
};

router.post('/google', googleAdminAuth);
router.post('/signup', googleAdminAuth);

module.exports = router;
