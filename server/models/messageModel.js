const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

messageSchema.index({ chat: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
