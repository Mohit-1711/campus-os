const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { httpError } = require("../utils/httpError");

/** Requires a valid session cookie and exposes the user id as req.user.userId. */
function handleAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    throw httpError(401, "Authentication required");
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
  } catch {
    throw httpError(401, "Invalid or expired session. Please log in again.");
  }

  next();
}

module.exports = handleAuth;
