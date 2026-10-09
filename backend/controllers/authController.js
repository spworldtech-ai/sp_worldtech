const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { normalizeRole } = require('../middleware/auth');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}


function pendingUserPayload(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    username: user.username || null,
    email: user.email,
    phone: user.phone || '',
    role: user.role
  };
}

async function ensureWallet(userId) {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) wallet = await Wallet.create({ user: userId });
  return wallet;
}

function authPayload(user) {
  return {
    token: signToken(user._id),
    user: {
      id: user._id,
      fullName: user.fullName,
      username: user.username || null,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      operationsTokenId: user.operationsTokenId || null
    }
  };
}

function validatePassword(password) { return String(password || '').length >= 8; }
function validatePin(pin) { return /^\d{4,8}$/.test(String(pin || '').trim()); }
function cleanUsername(username) { return String(username || '').toLowerCase().trim().replace(/[^a-z0-9._-]/g, ''); }
function cleanEmail(email) { return String(email || '').toLowerCase().trim(); }

async function createUserAccount(req, res) {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const email = cleanEmail(req.body.email);
    const username = cleanUsername(req.body.username || email.split('@')[0]);
    const phone = String(req.body.phone || '').trim();
    const requestedAccountType = String(req.body.accountType || 'general_user').trim();
    const allowedAccountTypes = ['general_user', 'job_worker', 'academy_student', 'banking_client'];
    const accountType = allowedAccountTypes.includes(requestedAccountType) ? requestedAccountType : 'general_user';
    const password = String(req.body.password || '');

    if (!fullName || fullName.length < 2) return res.status(400).json({ message: 'Enter your full name.' });
    if (!email || !email.includes('@')) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!username || username.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    if (!validatePassword(password)) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    // Email is the real account identifier for public registration. The username is
    // generated from the email when the public form does not provide one, so a
    // previously-used local-part (for example `john` from john@gmail.com) must not
    // prevent a completely new email address from registering.
    const emailExisting = await User.findOne({ email }).select('_id');
    if (emailExisting) return res.status(409).json({ message: 'This email is already registered. Please sign in instead.' });

    const suppliedUsername = Object.prototype.hasOwnProperty.call(req.body, 'username') && String(req.body.username || '').trim();
    let finalUsername = username;
    if (!suppliedUsername) {
      const base = username || 'user';
      let suffix = 1;
      while (await User.exists({ username: finalUsername })) {
        finalUsername = `${base}${suffix++}`;
      }
    } else {
      const usernameExisting = await User.findOne({ username: finalUsername }).select('_id');
      if (usernameExisting) return res.status(409).json({ message: 'This username is already in use. Please choose another username.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    let operationsTokenId = await uniqueOperationsTokenId('user');
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        user = await User.create({ fullName, username: finalUsername, email, phone, accountType, password: passwordHash, operationsTokenId, role: 'user' });
        break;
      } catch (createError) {
        if (createError?.code !== 11000) throw createError;
        const keys = Object.keys(createError.keyPattern || createError.keyValue || {});
        if (keys.includes('email')) return res.status(409).json({ message: 'This email is already registered. Please sign in instead.' });
        if (keys.includes('username')) {
          finalUsername = `${username || 'user'}${Date.now().toString().slice(-6)}${attempt || ''}`;
          continue;
        }
        if (keys.includes('operationsTokenId')) {
          operationsTokenId = await uniqueOperationsTokenId('user');
          continue;
        }
        throw createError;
      }
    }
    if (!user) return res.status(500).json({ message: 'Unable to create your account right now. Please try again shortly.' });
    await ensureWallet(user._id);
    res.status(201).json({ ...authPayload(user), message: 'Account created. Opening your dashboard.' });
  } catch (error) {
    if (error?.code === 11000) {
      const keys = Object.keys(error.keyPattern || error.keyValue || {});
      if (keys.includes('email')) return res.status(409).json({ message: 'This email is already registered. Please sign in instead.' });
      if (keys.includes('username')) return res.status(409).json({ message: 'This username is already in use. Please choose another username.' });
      return res.status(500).json({ message: 'Unable to create your account right now. Please try again shortly.' });
    }
    console.error('User registration error:', error);
    res.status(500).json({ message: 'Unable to create your account right now. Please try again shortly.' });
  }
}

exports.register = createUserAccount;
exports.userSignup = createUserAccount;

exports.userPasswordLogin = async (req, res) => {
  try {
    const identifier = String(req.body.identifier || req.body.username || req.body.email || '').toLowerCase().trim();
    const password = String(req.body.password || '');
    if (!identifier || !password) return res.status(400).json({ message: 'Enter username/email and password.' });
    const user = await User.findOne({ role: 'user', $or: [{ email: identifier }, { username: identifier }] }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid user credentials.' });
    const valid = await bcrypt.compare(password, user.password || '');
    if (!valid) return res.status(400).json({ message: 'Invalid user credentials.' });
    await ensureWallet(user._id);
    res.json({ ...authPayload(user), message: 'Login successful. Opening your dashboard.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};


// Backward compatible one-step user login: password + pin required if used by old forms.
exports.login = async (req, res) => {
  try {
    const identifier = String(req.body.identifier || req.body.username || req.body.email || '').toLowerCase().trim();
    const password = String(req.body.password || '');
    const user = await User.findOne({ role: 'user', $or: [{ email: identifier }, { username: identifier }] }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid user credentials' });
    const valid = await bcrypt.compare(password, user.password || '');
    if (!valid) return res.status(400).json({ message: 'Invalid user credentials' });
    await ensureWallet(user._id);
    res.json({ ...authPayload(user), message: 'Login successful.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.staffSignup = async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const email = cleanEmail(req.body.email);
    const username = cleanUsername(req.body.username || email.split('@')[0]);
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');
    if (!fullName || fullName.length < 2) return res.status(400).json({ message: 'Enter your full name.' });
    if (!email || !email.includes('@')) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!username || username.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    if (!validatePassword(password)) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await User.findOne({ $or: [{ email }, { username }] })) return res.status(400).json({ message: 'Email or username already exists.' });
    const user = await User.create({ fullName, username, email, phone, password: await bcrypt.hash(password, 10), role: 'staff' });
    res.status(201).json({ ...authPayload(user), message: 'Staff account created successfully.' });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Email or username already exists.' });
    res.status(500).json({ message: error.message });
  }
};

exports.staffLogin = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const requestedRole = normalizeRole(role || 'staff');
    if (!['staff', 'admin', 'owner'].includes(requestedRole)) return res.status(400).json({ message: 'Choose Staff, Admin, or Owner / Super Admin.' });
    const normalizedEmail = String(email || '').toLowerCase().trim();
    const roleQuery = requestedRole === 'staff' ? ['staff', 'social_worker'] : [requestedRole];
    const user = await User.findOne({ email: normalizedEmail, role: { $in: roleQuery } }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid operations credentials' });
    const valid = await bcrypt.compare(String(password || ''), user.password || '');
    if (!valid) return res.status(400).json({ message: 'Invalid operations credentials' });
    if (user.role === 'social_worker') { user.role = 'staff'; await user.save(); }
    res.json({ ...authPayload(user), message: 'Login successful. Opening your dashboard.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

function normalizePinAccessRole(role) {
  const normalized = normalizeRole(String(role || '').toLowerCase().trim());
  if (!['user', 'staff', 'admin', 'owner'].includes(normalized)) return null;
  return normalized;
}

function isProtectedOperationsRole(role) { return ['staff', 'admin', 'owner'].includes(role); }
function makeOperationsTokenId(role) { const prefix = role === 'owner' ? 'OWNER' : role.toUpperCase(); return `SP-${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`; }
async function uniqueOperationsTokenId(role) { for (let attempt = 0; attempt < 8; attempt += 1) { const tokenId = makeOperationsTokenId(role); const existing = await User.findOne({ operationsTokenId: tokenId }); if (!existing) return tokenId; } throw new Error('Unable to generate a unique Token ID. Try again.'); }
function requireSetupCode(req, role) { const setupCode = process.env.OPERATIONS_SETUP_CODE; if (!setupCode) return true; const provided = String(req.body.setupCode || '').trim(); return provided === String(setupCode).trim(); }

exports.createOperationsPin = async (req, res) => {
  try {
    const role = normalizePinAccessRole(req.body.role);
    const fullName = String(req.body.fullName || '').trim();
    const pin = String(req.body.pin || '').trim();

    if (!role) return res.status(400).json({ message: 'Choose User, Staff, Admin, or Owner / Super Admin.' });
    if (!fullName || fullName.length < 2) return res.status(400).json({ message: 'Enter the access holder full name.' });
    if (!validatePin(pin)) return res.status(400).json({ message: 'PIN must be 4 to 8 digits.' });
    if (isProtectedOperationsRole(role) && !requireSetupCode(req, role)) return res.status(403).json({ message: 'Invalid operations setup code.' });

    const tokenId = await uniqueOperationsTokenId(role);
    const pinHash = await bcrypt.hash(pin, 10);
    const email = `${tokenId.toLowerCase()}@operations.spworldtech.local`;
    const user = await User.create({
      fullName,
      username: tokenId.toLowerCase(),
      email,
      password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
      operationsPinHash: pinHash,
      operationsTokenId: tokenId,
      role
    });

    if (role === 'user') await ensureWallet(user._id);

    const payload = authPayload(user);
    res.status(201).json({
      ...payload,
      tokenId,
      message: role === 'user' ? 'User PIN created. Save the bold Token ID and PIN for future login.' : 'Operations PIN created. Save the bold Token ID and PIN for future login.'
    });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Token ID already exists. Try again.' });
    res.status(500).json({ message: error.message });
  }
};

exports.operationsPinLogin = async (req, res) => {
  try {
    const role = normalizePinAccessRole(req.body.role);
    const tokenId = String(req.body.tokenId || '').trim().toUpperCase();
    const pin = String(req.body.pin || '').trim();

    if (!role) return res.status(400).json({ message: 'Choose User, Staff, Admin, or Owner / Super Admin.' });
    if (!tokenId || !validatePin(pin)) return res.status(400).json({ message: 'Enter Token ID and 4 to 8 digit PIN.' });

    const user = await User.findOne({ operationsTokenId: tokenId, role }).select('+operationsPinHash');
    if (!user || !user.operationsPinHash) return res.status(400).json({ message: 'Invalid Token ID or PIN.' });

    const valid = await bcrypt.compare(pin, user.operationsPinHash);
    if (!valid) return res.status(400).json({ message: 'Invalid Token ID or PIN.' });
    if (role === 'user') await ensureWallet(user._id);

    res.json({ ...authPayload(user), tokenId, message: role === 'user' ? 'User calculator access granted.' : 'Operations calculator access granted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.googleLogin = async (req, res) => {
  try {
    const credential = String(req.body.credential || '').trim();
    const requestedRole = normalizeRole(String(req.body.role || 'user').toLowerCase().trim());
    const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
    if (!credential) return res.status(400).json({ message: 'Google credential is required.' });
    if (!clientId) return res.status(503).json({ message: 'Google Login is not configured yet. Add GOOGLE_CLIENT_ID in Vercel Environment Variables.' });
    if (!['user', 'staff'].includes(requestedRole)) return res.status(403).json({ message: 'This Google sign-in route is only available to users and staff.' });

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const profile = await response.json().catch(() => ({}));
    const audienceValid = Array.isArray(profile.aud) ? profile.aud.includes(clientId) : String(profile.aud || '') === clientId;
    const emailVerified = profile.email_verified === true || profile.email_verified === 'true';
    const issuerValid = profile.iss === 'https://accounts.google.com' || profile.iss === 'accounts.google.com';
    if (!response.ok || !audienceValid || !issuerValid || !emailVerified || !profile.sub || !profile.email) {
      console.error('Google credential rejected:', { responseOk: response.ok, audienceValid, issuerValid, emailVerified, hasSubject: Boolean(profile.sub), hasEmail: Boolean(profile.email) });
      return res.status(401).json({ message: 'Google account verification failed. Check the Google Client ID, authorized domain, and Google account, then try again.' });
    }

    const email = cleanEmail(profile.email);
    let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email }] }).select('+accessPinHash');

    if (user && requestedRole === 'staff' && !['staff'].includes(normalizeRole(user.role))) {
      return res.status(403).json({ message: 'This Google account is already registered as a user. Use a separate staff account.' });
    }
    if (user && requestedRole === 'user' && normalizeRole(user.role) !== 'user') {
      return res.status(403).json({ message: 'This Google account belongs to a staff or administration account.' });
    }

    if (!user) {
      const base = cleanUsername(email.split('@')[0]) || (requestedRole === 'staff' ? 'staff' : 'user');
      let username = base;
      let suffix = 1;
      while (await User.findOne({ username })) username = `${base}${suffix++}`;
      user = await User.create({
        fullName: String(profile.name || email.split('@')[0]).trim(),
        username, email, phone: '',
        accountType: 'general_user',
        password: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12),
        accessPinHash: null,
        operationsTokenId: await uniqueOperationsTokenId(requestedRole),
        role: requestedRole,
        googleId: profile.sub
      });
      if (requestedRole === 'user') await ensureWallet(user._id);
    } else {
      let changed = false;
      if (!user.googleId) { user.googleId = profile.sub; changed = true; }
      if (profile.name && !user.fullName) { user.fullName = profile.name; changed = true; }
      if (changed) await user.save();
      if (requestedRole === 'user') await ensureWallet(user._id);
    }

    return res.json({ ...authPayload(user), google: true, message: 'Google authentication successful. Opening your dashboard.' });
  } catch (error) {
    console.error('Google login error:', error.message);
    res.status(500).json({ message: 'Google sign-in failed.' });
  }
};

