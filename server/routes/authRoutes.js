const express = require("express");
const {
  handleSignup,
  handleLogin,
  handleLogout,
  handleGetMe,
} = require("../controllers/authControllers");
const handleAuth = require("../middlewares/authMiddleware");
const { authLimiter } = require("../middlewares/rateLimiters");

const router = express.Router();

router.post("/signup", authLimiter, handleSignup);
router.post("/login", authLimiter, handleLogin);
router.post("/logout", handleLogout);
router.get("/me", handleAuth, handleGetMe);

module.exports = router;
