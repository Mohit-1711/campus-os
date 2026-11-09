const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { env } = require("../config/env");
const { httpError } = require("../utils/httpError");
const { requireText } = require("../utils/validate");

const SESSION_MS = 24 * 60 * 60 * 1000; // keep the cookie and the JWT in sync

const cookieOptions = {
  httpOnly: true,
  secure: env.isProd || env.cookieSameSite === "none",
  sameSite: env.cookieSameSite,
  path: "/",
};

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const publicUser = (user) => ({ _id: user._id, name: user.name, email: user.email });

async function handleSignup(req, res) {
  const { name, email, password } = req.body || {};

  const cleanName = requireText(name, { label: "Name", max: 100 });
  const normalizedEmail = normalizeEmail(email);

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw httpError(400, "Please provide a valid email address.");
  }

  if (typeof password !== "string" || password.length < 6) {
    throw httpError(400, "Password must be at least 6 characters long.");
  }

  if (password.length > 72) {
    // bcrypt silently ignores everything after 72 bytes.
    throw httpError(400, "Password cannot be longer than 72 characters.");
  }

  if (await User.exists({ email: normalizedEmail })) {
    throw httpError(409, "Email already registered");
  }

  await User.create({
    name: cleanName,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 10),
  });

  res.status(201).json({ message: "User registered successfully" });
}

async function handleLogin(req, res) {
  const { email, password } = req.body || {};
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw httpError(400, "Please enter your email address.");
  }

  if (typeof password !== "string" || !password) {
    throw httpError(400, "Please enter your password.");
  }

  const user = await User.findOne({ email: normalizedEmail });
  const passwordMatches = user && (await bcrypt.compare(password, user.password));

  // Same message for both cases so attackers can't tell which emails exist.
  if (!passwordMatches) {
    throw httpError(401, "Invalid email or password");
  }

  const token = jwt.sign({ userId: user._id }, env.jwtSecret, {
    expiresIn: SESSION_MS / 1000,
  });

  res.cookie("token", token, { ...cookieOptions, maxAge: SESSION_MS });

  res.status(200).json({ message: "Logged in successfully", user: publicUser(user) });
}

function handleLogout(req, res) {
  res.clearCookie("token", cookieOptions);
  res.status(200).json({ message: "Logged out successfully" });
}

async function handleGetMe(req, res) {
  const user = await User.findById(req.user.userId);

  if (!user) {
    // The account was removed while the cookie was still valid.
    res.clearCookie("token", cookieOptions);
    throw httpError(401, "Account not found. Please log in again.");
  }

  res.status(200).json({ message: "User fetched successfully", user: publicUser(user) });
}

module.exports = { handleSignup, handleLogin, handleLogout, handleGetMe };
