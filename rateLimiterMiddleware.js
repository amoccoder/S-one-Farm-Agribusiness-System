/**
 * Rate Limiter Middleware for Auth Service
 * Uses Redis for distributed rate limiting
 */

const cacheManager = require('./cacheManager');

/**
 * Create a rate limiter middleware
 * @param {object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param {number} options.max - Maximum requests per window (default: 5)
 * @param {string} options.message - Error message (default: 'Too many requests')
 * @param {number} options.statusCode - HTTP status code (default: 429)
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 60000,
    max = 5,
    message = 'Too many requests, please try again later',
    statusCode = 429,
  } = options;

  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    try {
      // Get identifier (IP address or user ID)
      const identifier = req.ip || req.connection.remoteAddress || 'unknown';
      const key = `ratelimit:${identifier}`;

      // Check rate limit
      const allowed = await cacheManager.checkRateLimit(identifier, max, windowSeconds);

      // Add rate limit info to response headers
      const current = await cacheManager.getRateLimitCounter(identifier);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());

      if (!allowed) {
        return res.status(statusCode).json({
          error: message,
          retryAfter: windowSeconds,
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Allow request if rate limiter fails
      next();
    }
  };
}

/**
 * Rate limiter for authentication endpoints
 * Stricter limits for login/register
 */
const authRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Too many authentication attempts, please try again later',
});

/**
 * Rate limiter for general API endpoints
 * More lenient limits
 */
const apiRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
});

/**
 * Rate limiter for password reset
 * Very strict limits
 */
const passwordResetRateLimiter = createRateLimiter({
  windowMs: 3600000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset attempts, please try again later',
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  passwordResetRateLimiter,
};
