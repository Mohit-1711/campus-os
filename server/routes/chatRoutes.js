const express = require("express");
const { createChat, listChats } = require("../controllers/chatController");

const router = express.Router();

router.post("/", createChat);
router.get("/", listChats);

module.exports = { router };
