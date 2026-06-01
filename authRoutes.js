const router = require("express").Router();
const authController = require("./authController");
const authorization = require("./authorization");
const rateLimiter = require("./rateLimiter");

// Rate Limit: 10 requests per 15 minutes for auth endpoints
const authLimiter = rateLimiter(15 * 60 * 1000, 10);

// Register
router.post("/register", authLimiter, authController.register);

// Login
router.post("/login", authLimiter, authController.login);

// Verify
router.get("/is-verify", authorization, (req, res) => res.json(true));

// Profile
router.get("/me", authorization, authController.getMe);

// Refresh
router.post("/refresh", authController.refresh);

module.exports = router;