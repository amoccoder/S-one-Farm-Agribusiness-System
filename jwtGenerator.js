const jwt = require("jsonwebtoken");
require("dotenv").config();

function generateAccessToken(user_id) {
  const payload = {
    user: {
      id: user_id
    },
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
}

function generateRefreshToken(user_id) {
  const payload = { user: { id: user_id } };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

module.exports = { generateAccessToken, generateRefreshToken };