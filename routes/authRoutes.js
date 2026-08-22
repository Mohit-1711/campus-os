const express = require("express");
const { handleSignup } = require("../controllers/authControllers");

const router = express.Router();

router.post("/signup", handleSignup);

module.exports = { router };
