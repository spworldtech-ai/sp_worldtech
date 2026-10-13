const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
<<<<<<< HEAD
const crypto = require('crypto');
const User = require('../models/User');

const DEFAULT_ADMIN_EMAIL = 'spworldtechtechnology@gmail.com';
const cleanEmail = value => String(value || '').trim().toLowerCase();
const cleanUsername = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30);

function allowedAdminEmails() {
  const configured = [process.env.ADMIN_GOOGLE_EMAIL, process.env.ADMIN_NOTIFICATION_EMAIL]
    .map(cleanEmail).filter(value => value && value.includes('@'));
  if (!configured.length) configured.push(DEFAULT_ADMIN_EMAIL);
  return [...new Set(configured)];
}
function isAllowedAdminEmail(email) { return allowedAdminEmails().includes(cleanEmail(email)); }
function requireSecurityConfig(res) {
  if (!process.env.JWT_SECRET) { res.status(503).json({ message: 'Admin authentication is not configured: JWT_SECRET is missing.' }); return false; }
  return true;
}
function makeToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role, adminPanel: true }, process.env.JWT_SECRET, { expiresIn: '12h' });
}
function payload(user, message) {
  return { token: makeToken(user), user: { id: user._id, fullName: user.fullName, username: user.username || null, email: user.email, role: user.role }, message };
}
async function uniqueUsername(value) {
  const base = cleanUsername(value) || `admin${crypto.randomBytes(3).toString('hex')}`;
  let candidate = base, suffix = 1;
  while (await User.exists({ username: candidate })) candidate = `${base.slice(0, 24)}${suffix++}`;
  return candidate;
}
async function findOrPromoteAdmin({ email, fullName, googleId, password }) {
  const normalizedEmail = cleanEmail(email);
  let user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    const username = await uniqueUsername(normalizedEmail.split('@')[0]);
    user = await User.create({
      fullName: String(fullName || 'SP WorldTech Administrator').trim(),
      username,
      email: normalizedEmail,
      password: password || await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
      role: 'owner',
      accountType: 'general_user',
      ...(googleId ? { googleId } : {})
    });
    return user;
  }
  // Only the configured admin email(s) can be promoted. This repairs the case
  // where the approved administrator previously signed up as a normal user.
  if (!['owner', 'admin'].includes(String(user.role || '').toLowerCase())) user.role = 'owner';
  if (googleId && user.googleId !== googleId) user.googleId = googleId;
  if (password) user.password = password;
  if (fullName && (!user.fullName || user.fullName === '')) user.fullName = String(fullName).trim();
  await user.save();
  return user;
}

router.post('/login', async (req, res) => {
  try {
    const email = cleanEmail(req.body?.email || req.body?.username);
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ message: 'Enter your administrator email and password.' });
    if (!isAllowedAdminEmail(email)) return res.status(403).json({ message: 'This email is not configured for SP WorldTech administrator access.' });
    if (!requireSecurityConfig(res)) return;
    const user = await User.findOne({ email, role: { $in: ['admin', 'owner'] } }).select('+password');
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid administrator email or password. Use Admin Signup first if this is your first login.' });
    }
    return res.json(payload(user, 'Admin login successful. Opening dashboard.'));
  } catch (error) {
    console.error('Admin login error:', error.message);
    return res.status(500).json({ message: 'Admin login failed. Please try again.' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const fullName = String(req.body?.fullName || '').trim();
    const email = cleanEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (fullName.length < 2) return res.status(400).json({ message: 'Enter your full name.' });
    if (!email.includes('@')) return res.status(400).json({ message: 'Enter a valid administrator email.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (!isAllowedAdminEmail(email)) return res.status(403).json({ message: `Admin signup is restricted to the configured administrator email: ${allowedAdminEmails()[0]}.` });
    if (!requireSecurityConfig(res)) return;
    const existing = await User.findOne({ email }).select('+password');
    if (existing && ['owner', 'admin'].includes(String(existing.role || '').toLowerCase()) && existing.password) {
      return res.status(409).json({ message: 'An admin account already exists for this email. Please use Admin Login or Google sign-in.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await findOrPromoteAdmin({ email, fullName, password: passwordHash });
    return res.status(existing ? 200 : 201).json(payload(user, 'Admin account ready. Opening dashboard.'));
  } catch (error) {
    console.error('Admin signup error:', error.message);
    if (error.code === 11000) return res.status(409).json({ message: 'This email or username is already in use. Try Admin Login.' });
    return res.status(500).json({ message: 'Admin signup failed. Please try again.' });
  }
});

async function googleAdminAuth(req, res) {
  try {
    const credential = String(req.body?.credential || '').trim();
    const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
    if (!credential || !clientId) return res.status(503).json({ message: 'Google authentication is not configured. Set GOOGLE_CLIENT_ID in the active backend environment.' });
    if (!requireSecurityConfig(res)) return;
=======
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

// Admin Google login/signup uses Google Identity, but must be restricted to an
// explicitly configured administrator email allow-list. A valid Google identity
// alone must never grant owner privileges.
const googleAdminAuth = async (req, res) => {
  try {
    const credential = String(req.body?.credential || '').trim();
    const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
    if (!credential || !clientId) {
      return res.status(503).json({ message: 'Google authentication is not configured. Set GOOGLE_CLIENT_ID in the active backend environment.' });
    }
    if (!requireJwtSecret(res)) return;

>>>>>>> origin/main
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const profile = await response.json().catch(() => ({}));
    const audienceValid = Array.isArray(profile.aud) ? profile.aud.includes(clientId) : String(profile.aud || '') === clientId;
    const emailVerified = profile.email_verified === true || profile.email_verified === 'true';
    const issuerValid = profile.iss === 'https://accounts.google.com' || profile.iss === 'accounts.google.com';
    if (!response.ok || !audienceValid || !issuerValid || !emailVerified || !profile.sub || !profile.email) {
<<<<<<< HEAD
      return res.status(401).json({ message: 'Google could not verify this sign-in. Check GOOGLE_CLIENT_ID and its authorized JavaScript origins.' });
    }
    const email = cleanEmail(profile.email);
    if (!isAllowedAdminEmail(email)) {
      return res.status(403).json({ message: `This Google email is not configured for administrator access. Sign in with ${allowedAdminEmails()[0]}.` });
    }
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
    const user = await findOrPromoteAdmin({ email, fullName: profile.name, googleId: profile.sub, password: undefined });
    if (!user.googleId) { user.googleId = profile.sub; await user.save(); }
    return res.json(payload(user, 'Google authentication successful. Opening admin dashboard.'));
  } catch (error) {
    console.error('Admin Google sign-in error:', error.message);
    return res.status(500).json({ message: 'Admin Google sign-in failed. Please try again.' });
  }
}
router.post('/google', googleAdminAuth);
=======
      return res.status(401).json({ message: 'Google could not verify this sign-in. Check GOOGLE_CLIENT_ID and authorized origins, then try again.' });
    }

    const email = String(profile.email).trim().toLowerCase();
    const allowedAdminEmails = [
      process.env.ADMIN_GOOGLE_EMAIL || '',
      process.env.ADMIN_GOOGLE_EMAILS || ''
    ].join(',').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
    if (!allowedAdminEmails.length) {
      return res.status(503).json({ message: 'Google admin sign-in is not enabled: configure ADMIN_GOOGLE_EMAIL or ADMIN_GOOGLE_EMAILS in the backend environment.' });
    }
    if (!allowedAdminEmails.includes(email)) {
      return res.status(403).json({ message: 'This Google account is not authorized for the SP WorldTech admin dashboard. Use the configured administrator account.' });
    }

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

>>>>>>> origin/main
module.exports = router;
