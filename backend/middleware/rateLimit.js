// Small dependency-free rate limiter for credential endpoints.
// Note: state is held in memory, so on serverless hosting each instance keeps its own counters.
const buckets = new Map();

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function rateLimit({ windowMs = 15 * 60 * 1000, max = 20, message = 'Too many attempts. Please wait a few minutes and try again.' } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.originalUrl.split('?')[0]}|${clientIp(req)}`;
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return res.status(429).json({ message });
    }
    next();
  };
}

module.exports = { rateLimit };
