// Simple in-memory rate limiter for small apps
const rateLimit = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const max = options.max || 30; // max requests per window
  const hits = new Map();

  return (req, res, next) => {
    try {
      const key = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const now = Date.now();
      const entry = hits.get(key) || { count: 0, start: now };

      if (now - entry.start > windowMs) {
        entry.count = 1;
        entry.start = now;
      } else {
        entry.count += 1;
      }

      hits.set(key, entry);

      if (entry.count > max) {
        res.status(429).render('pages/Error', { message: 'Too many requests - try again later' });
        return;
      }

      next();
    } catch (err) {
      next();
    }
  };
};

module.exports = rateLimit;
