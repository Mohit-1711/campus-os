const mongoose = require("mongoose");
const Chat = require("../models/chatModel");
const File = require("../models/fileModel");

async function createChat(req, res, next) {
  try {
    const { title, files } = req.body;

    // Validate title.
    if (
      title !== undefined &&
      (typeof title !== "string" || !title.trim() || title.trim().length > 150)
    ) {
      return res.status(400).json({
        message: "Title must be between 1 and 150 characters.",
      });
    }

    // Validate selected files.
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        message: "Select at least one document for this chat.",
      });
    }

    if (files.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({
        message: "One or more document IDs are invalid.",
      });
    }

    const uniqueFileIds = [...new Set(files.map(String))];

    if (uniqueFileIds.length !== files.length) {
      return res.status(400).json({
        message: "Duplicate documents are not allowed.",
      });
    }

    // Only allow documents owned by the logged-in user and ready for retrieval.
    const selectedFiles = await File.find({
      _id: { $in: uniqueFileIds },
      user: req.user.userId,
      processingStatus: "ready",
      mimeType: "application/pdf",
    }).select("_id");

    if (selectedFiles.length !== uniqueFileIds.length) {
      return res.status(400).json({
        message: "One or more selected documents are unavailable or not ready.",
      });
    }

    const chat = await Chat.create({
      user: req.user.userId,
      title: title?.trim() || "New Chat",
      files: uniqueFileIds,
    });

    return res.status(201).json({
      message: "Chat created successfully.",
      chat,
    });
  } catch (error) {
    next(error);
  }
}

async function listChats(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({
        message: "Invalid pagination values. Limit must be between 1 and 50.",
      });
    }

    const skip = (page - 1) * limit;

    const [chats, total] = await Promise.all([
      Chat.find({ user: req.user.userId })
        .populate("files", "name originalName source processingStatus")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Chat.countDocuments({ user: req.user.userId }),
    ]);

    return res.status(200).json({
      message: "Chats retrieved successfully.",
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      chats,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { createChat, listChats };
