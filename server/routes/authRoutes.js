const express = require("express");

const {
  handleSignup,
  handleLogin,
  handleGetMe,
  handleLogout,
} = require("../controllers/authControllers");

const handleAuth = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.get("/me", handleAuth, handleGetMe);

module.exports = { router };
