const User = require("../models/userModel");
const bcrypt = require("bcrypt");

async function handleSignup(req, res, next) {
  const { name, email, password } = req.body;
  if (!name || name.trim().length === 0) {
    return res
      .status(400)
      .json({ error: "Name cannot be empty or just spaces." });
  }
  if (!password || password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long." });
  }
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!email || !emailRegex.test(email)) {
    return res
      .status(400)
      .json({ error: "Please provide a valid email address." });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hashedPassword,
    });
    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleSignup };
