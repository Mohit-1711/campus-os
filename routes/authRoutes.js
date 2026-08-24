const express = require("express");
const { handleSignup, handleLogin } = require("../controllers/authControllers");
const handleAuth = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.get("/me", handleAuth, (req, res) => {
  return res.json({
    message: "User authorized",
    user: req.user,
  });
});

module.exports = { router };
