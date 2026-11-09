const rateLimit = require("express-rate-limit");
const { env } = require("../config/env");

const createLimiter = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message },
    skip: () => env.nodeEnv === "test",
  });

// Slows down password guessing on login / signup.
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "Too many attempts. Please try again in a few minutes.",
});

// Every chat message costs a paid AI call, so cap the rate.
const messageLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 20,
  message: "You're sending messages too quickly. Please wait a moment.",
});

module.exports = { authLimiter, messageLimiter };
