const router = require('express').Router();
const crypto = require('crypto');
const Comment = require('../models/Comment');

const PAGES = [
  'index.html','services.html','businesses.html','projects.html','pricing.html','marketplace.html',
  'academy.html','about.html','contact.html','reviews.html','dashboard.html','admin-dashboard.html','staff.html',
  'auth.html','admin.html','staff-auth.html','pin.html','privacy-policy.html','terms-and-conditions.html'
];

const ROLE_PROFILES = [
  { role: 'Software Development', pages: ['index.html','projects.html','dashboard.html'], messages: [
    'The software development service is presented clearly and feels ready for serious business projects.',
    'The development workflow looks structured and professional from enquiry through delivery.'
  ]},
  { role: 'Web Development', pages: ['services.html','pricing.html','projects.html'], messages: [
    'The web development offering is easy to understand and the service presentation feels professional.',
    'The website solutions are presented with a strong focus on responsive business experiences.'
  ]},
  { role: 'AI & Automation', pages: ['services.html','academy.html','projects.html'], messages: [
    'The AI and automation services are explained in a practical way for modern businesses.',
    'The platform presents AI solutions and automation as useful business tools rather than just trends.'
  ]},
  { role: 'Digital Marketing & Client Relations', pages: ['index.html','services.html','contact.html','businesses.html'], messages: [
    'The digital marketing and client-relations offering makes it easy to understand how enquiries are handled.',
    'The client communication and digital marketing services feel organized and business focused.'
  ]},
  { role: 'Sales & Customer Support', pages: ['contact.html','dashboard.html','reviews.html'], messages: [
    'The customer support and sales journey is clear, with useful paths for enquiries and follow-up.',
    'The platform makes it easy for customers to understand where to go for support and service enquiries.'
  ]},
  { role: 'Project Management', pages: ['projects.html','dashboard.html','contact.html'], messages: [
    'The project workflow looks organized, with a clear focus on requirements, delivery and communication.',
    'The project-management presentation gives a professional impression for business clients.'
  ]},
  { role: 'Technical Support & Infrastructure', pages: ['businesses.html','contact.html','dashboard.html'], messages: [
    'The technical support and infrastructure services are presented clearly for businesses that need dependable assistance.',
    'The technical support offering feels practical and well organized for ongoing digital operations.'
  ]},
  { role: 'UI/UX & Product Design', pages: ['services.html','projects.html','index.html'], messages: [
    'The interface and product presentation feel clean, modern and focused on the customer experience.',
    'The platform demonstrates a strong attention to interface quality and usable digital products.'
  ]},
  { role: 'Technology Education', pages: ['academy.html','dashboard.html'], messages: [
    'The technology education section makes practical learning and project-based development easy to understand.',
    'The Academy gives learners a clear path toward useful software and digital skills.'
  ]},
  { role: 'Marketplace & Digital Products', pages: ['marketplace.html','dashboard.html'], messages: [
    'The marketplace is structured clearly and makes digital products easy to discover and access.',
    'The digital-product experience feels simple, professional and easy for customers to follow.'
  ]}
];

const firstNames = ['Michael','Daniel','James','William','Thomas','Oliver','George','Henry','Edward','Jack','Charles','Alexander','Harry','Benjamin','Samuel','Joseph','David','Matthew','Lucas','Theodore','Arthur','Leo','Oscar','Finn','Ethan','Jacob','Noah','Liam','Mason','Logan'];
const lastNames = ['Miller','Johnson','Williams','Brown','Davis','Wilson','Anderson','Taylor','Thomas','Moore','Martin','Jackson','Thompson','White','Harris','Clark','Lewis','Walker','Hall','Young','Allen','King','Wright','Scott','Green','Baker','Adams','Nelson','Hill','Campbell'];
const places = ['London, United Kingdom','New York, United States','California, United States','Toronto, Canada','Berlin, Germany','Paris, France','Amsterdam, Netherlands','Dublin, Ireland','Zurich, Switzerland','Sydney, Australia','Dubai, UAE','Singapore','Cape Town, South Africa','Stockholm, Sweden','Madrid, Spain','Milan, Italy','Copenhagen, Denmark','Vienna, Austria','Brussels, Belgium','Lisbon, Portugal'];

function profileFor(index, page) {
  const matches = ROLE_PROFILES.filter(profile => profile.pages.includes(page));
  const pool = matches.length ? matches : ROLE_PROFILES;
  return pool[index % pool.length];
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function pageName(value) {
  const clean = String(value || 'index.html').split('?')[0].split('#')[0].replace(/^\//, '');
  return PAGES.includes(clean) ? clean : 'index.html';
}

function hashIp(req) {
  const raw = String(req.headers['x-forwarded-for'] || req.ip || 'anonymous').split(',')[0].trim();
  return crypto.createHash('sha256').update(`${raw}|${process.env.COMMENTS_HASH_SALT || 'spworldtech-comments'}`).digest('hex');
}

async function ensureDailyIllustrativeComments() {
  const key = dayKey();
  const existing = await Comment.countDocuments({ dayKey: key, kind: 'illustrative' });
  if (existing >= 20) return;

  const docs = [];
  for (let i = existing; i < 20; i += 1) {
    const page = PAGES[i % PAGES.length];
    const profile = profileFor(i, page);
    const name = `${firstNames[(i * 7) % firstNames.length]} ${lastNames[(i * 11) % lastNames.length]}`;
    const date = new Date(`${key}T00:00:00.000Z`);
    date.setUTCMinutes(i * 72);
    docs.push({
      page,
      name,
      role: profile.role,
      message: profile.messages[i % profile.messages.length],
      rating: 5,
      location: places[i % places.length],
      kind: 'illustrative',
      dayKey: key,
      slot: i,
      scheduledAt: date,
      approved: true
    });
  }
  try { await Comment.insertMany(docs, { ordered: false }); } catch (_) { /* another serverless instance may have created them */ }
}

router.get('/', async (req, res) => {
  try {
    await ensureDailyIllustrativeComments();
    const page = pageName(req.query.page);
    const now = new Date();
    const comments = await Comment.find({
      page,
      approved: true,
      scheduledAt: { $lte: now }
    }).sort({ scheduledAt: -1, createdAt: -1 }).limit(60).lean();
    res.json({ ok: true, page, comments: comments.map(({ _id, name, message, rating, location, role, kind, scheduledAt, createdAt }) => ({ id: _id, name, message, rating, location, role, kind, scheduledAt, createdAt })) });
  } catch (error) {
    console.error('Comments GET failed:', error.message);
    res.status(500).json({ ok: false, message: 'Comments are temporarily unavailable.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const page = pageName(req.body?.page);
    const name = String(req.body?.name || '').trim().replace(/\s+/g, ' ');
    const message = String(req.body?.message || '').trim();
    const rating = Number(req.body?.rating);
    const location = String(req.body?.location || '').trim().replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 80) return res.status(400).json({ ok: false, message: 'Please enter a valid name.' });
    if (message.length < 3 || message.length > 700) return res.status(400).json({ ok: false, message: 'Comment must be between 3 and 700 characters.' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ ok: false, message: 'Please choose a rating from 1 to 5.' });

    const ipHash = hashIp(req);
    const recent = await Comment.countDocuments({ kind: 'user', ipHash, createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } });
    if (recent >= 5) return res.status(429).json({ ok: false, message: 'You have reached the hourly comment limit. Please try again later.' });

    const comment = await Comment.create({ page, name, message, rating, location: location.slice(0, 100), role: '', kind: 'user', ipHash, userAgent: String(req.headers['user-agent'] || '').slice(0, 300), scheduledAt: new Date(), approved: true });
    res.status(201).json({ ok: true, comment: { id: comment._id, name: comment.name, message: comment.message, rating: comment.rating, location: comment.location, kind: comment.kind, createdAt: comment.createdAt } });
  } catch (error) {
    console.error('Comments POST failed:', error.message);
    res.status(500).json({ ok: false, message: 'Unable to publish your comment right now.' });
  }
});

module.exports = router;
