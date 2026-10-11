const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const walletRoutes = require('./routes/walletRoutes');
const chatRoutes = require('./routes/chatRoutes');
const staffRoutes = require('./routes/staffRoutes');
const academyRoutes = require('./routes/academyRoutes');
const clientPaymentRoutes = require('./routes/clientPaymentRoutes');
const projectRoutes = require('./routes/projectRoutes');
const bankingRoutes = require('./routes/bankingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const platformRoutes = require('./routes/platformRoutes');
const adminJobApplicationRoutes = require('./routes/adminJobApplications');
const tynaBalanceRoutes = require('./routes/tynaBalanceRoutes');
const spTokenRoutes = require('./routes/spTokenRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminSettingsRoutes = require('./routes/adminSettingsRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const localizationRoutes = require('./routes/localizationRoutes');
const commentRoutes = require('./routes/commentRoutes');
const fxRoutes = require('./routes/fxRoutes');
const { ensureJobs } = require('./services/jobService');

dotenv.config();
const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.BACKEND_PUBLIC_URL,
  process.env.WORLD_NET_HOSTING_URL,
  'https://worldnethosting.com',
  'https://www.worldnethosting.com',
  'https://spworldtech.com',
  'https://www.spworldtech.com',
  'https://spworldtech-frontend.vercel.app'
]
  .flatMap((value) => String(value || '').split(','))
  .map((item) => item.trim().replace(/\/$/, ''))
  .filter(Boolean);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(String(origin).replace(/\/$/, ''))) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
};
const io = new Server(server, { cors: corsOptions });

app.use(cors(corsOptions));
app.use(express.json({ limit: '30mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'SP WorldTech API' }));

// Vercel serverless functions do not execute the local start() block.  Every
// database-backed API request therefore establishes/reuses the cached MongoDB
// connection before reaching its controller. This prevents Mongoose from
// buffering queries for 10 seconds and returning errors such as
// `users.findOne() buffering timed out after 10000ms`.
app.use('/api', async (req, res, next) => {
  const path = String(req.path || '');
  const noDatabasePaths = ['/health', '/public-config', '/integrations/status'];
  if (noDatabasePaths.includes(path)) return next();
  if (!process.env.MONGODB_URI) {
    return res.status(503).json({ ok: false, message: 'Database is not configured on the server.' });
  }
  try {
    await connectDB(process.env.MONGODB_URI);
    return next();
  } catch (error) {
    console.error('API database unavailable:', error.message);
    return res.status(503).json({
      ok: false,
      message: 'The database is temporarily unavailable. Please try again shortly.'
    });
  }
});

app.get('/api/integrations/status', (_req, res) => {
  const paystackKey = String(process.env.PAYSTACK_SECRET_KEY || '');
  res.json({
    database: { configured: Boolean(process.env.MONGODB_URI), ready: mongoose.connection.readyState === 1, requiredEnv: 'MONGODB_URI' },
    recruitment: { ready: Boolean(process.env.JOB_API_KEY || process.env.JSEARCH_API_KEY || process.env.RAPIDAPI_KEY), requiredEnv: 'JOB_API_KEY or JSEARCH_API_KEY' },
    strowallet: { ready: Boolean((process.env.STROWALLET_PUBLIC_KEY || process.env.STROWALLET_API_KEY) && process.env.STROWALLET_SECRET_KEY), requiredEnv: 'STROWALLET_PUBLIC_KEY + STROWALLET_SECRET_KEY' },
    paystack: { ready: Boolean(/^sk_(live|test)_/.test(paystackKey)), requiredEnv: 'PAYSTACK_SECRET_KEY' },
    spToken: { ready: Boolean(/^sk_(live|test)_/.test(paystackKey)), feePercent: Number(process.env.SP_TOKEN_FEE_PERCENT || 3), requiredEnv: 'PAYSTACK_SECRET_KEY' }
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/academy', academyRoutes);
app.use('/api/client-payments', clientPaymentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/admin/job-applications', adminJobApplicationRoutes);
app.use('/api/tyna-balance', tynaBalanceRoutes);
app.use('/api/sp-token', spTokenRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/localization', localizationRoutes);
app.use('/api/fx', fxRoutes);
app.use('/api/comments', commentRoutes);
app.get('/api/public-config', (_req, res) => {
  const configuredGoogleClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  const googleClientId = /your_google_web_client_id|^your_/i.test(configuredGoogleClientId) ? '' : configuredGoogleClientId;
  res.json({
    googleClientId,
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    siteUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://spworldtech.com'
  });
});

// Always return JSON for missing API routes, so the frontend never receives plain text "Not Found".
app.use('/api', (req, res) => {
  res.status(404).json({
    ok: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
    hint: 'Check the frontend API path or backend route registration.'
  });
});

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    name: 'SP WorldTech API',
    message: 'Backend API is running. Use /api/* endpoints.'
  });
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing. Add it in the deployment environment.');
    await connectDB(process.env.MONGODB_URI);
    await ensureJobs();
    server.listen(PORT, '0.0.0.0', () => console.log(`SP WorldTech API running on port ${PORT}`));
  } catch (error) {
    console.error('Server start failed:', error.message);
    process.exit(1);
  }
}

if (process.env.VERCEL) {
  module.exports = app;
} else {
  start();
}
