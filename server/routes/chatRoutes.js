const express = require("express");

const {
  createChat,
  listChats,
  getChatMessages,
  sendMessage,
  deleteChat,
} = require("../controllers/chatControllers");

const router = express.Router();

router.post("/", createChat);
router.get("/", listChats);

router.get("/:chatId/messages", getChatMessages);
router.post("/:chatId/messages", sendMessage);
router.delete("/:chatId", deleteChat);

module.exports = { router };
