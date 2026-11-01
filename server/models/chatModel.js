const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      trim: true,
      default: "New Chat",
      maxlength: 150,
    },

    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
    ],
  },
  { timestamps: true },
);

chatSchema.index({ user: 1, updatedAt: -1 });

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
