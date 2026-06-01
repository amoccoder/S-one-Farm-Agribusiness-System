// Simple in-memory rate limiter
// In production (Phase 10), this should use Redis
const rateLimitMap = new Map();

const rateLimiter = (windowMs, maxRequests) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }

    const timestamps = rateLimitMap.get(ip);
    const windowStart = now - windowMs;

    // Filter out old timestamps
    const recentTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    if (recentTimestamps.length >= maxRequests) {
      return res.status(429).json({ message: "Too many requests, please try again later." });
    }

    recentTimestamps.push(now);
    rateLimitMap.set(ip, recentTimestamps);
    
    next();
  };
};

module.exports = rateLimiter;