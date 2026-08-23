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

async function handleLogin(req, res) {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Please enter your email address." });
  }
  // I am not validating password since website dont tell the format of password in login time
  if (!password) {
    return res.status(400).json({ error: "Please enter a password" });
  }
  try {
    const userFound = await User.findOne({ email });
    if (!userFound) {
      return res.status(409).json({
        message: "Invalid email or password",
      });
    }
    const validatePassword = await bcrypt.compare(password, userFound.password);
    if (!validatePassword) {
      return res.status(409).json({
        message: "Invalid email or password",
      });
    }
    return res.status(200).json({
      message: "Logged in successfully",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleSignup, handleLogin };
