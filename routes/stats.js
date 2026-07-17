const router = require('express').Router();
const { saveStats, getStats, startStatsSession } = require('../controllers/statsController');
const auth = require('../middleware/auth');

// Custom lightweight in-memory rate limiter
const ipLimits = new Map();
const rateLimiter = (maxRequests, windowMs) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!ipLimits.has(ip)) {
      ipLimits.set(ip, []);
    }

    const timestamps = ipLimits.get(ip).filter(time => now - time < windowMs);
    timestamps.push(now);
    ipLimits.set(ip, timestamps);

    if (timestamps.length > maxRequests) {
      return res.status(429).json({ message: 'Rate limit exceeded. Please try again later.' });
    }
    next();
  };
};

router.post('/start', auth, rateLimiter(30, 60000), startStatsSession); // max 30 sessions started per minute
router.post('/save', auth, rateLimiter(20, 60000), saveStats); // max 20 saves per minute
router.get('/', auth, getStats);

module.exports = router;
