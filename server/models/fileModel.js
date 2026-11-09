const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", required: true },

    // `name` is the editable display name; `originalName` is what was uploaded.
    name: { type: String, required: true, trim: true, maxlength: 150 },
    originalName: { type: String, required: true, trim: true },

    mimeType: { type: String, required: true },
    size: { type: Number, required: true },

    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryResourceType: {
      type: String,
      required: true,
      enum: ["image", "raw", "video"],
    },

    source: {
      type: String,
      enum: ["folder_upload", "ai_upload"],
      default: "folder_upload",
      required: true,
    },

    // not_required: not a PDF | pending: being indexed | ready: usable by the AI | failed: could not be read
    processingStatus: {
      type: String,
      enum: ["not_required", "pending", "ready", "failed"],
      default: "not_required",
      required: true,
    },
  },
  { timestamps: true },
);

fileSchema.index({ user: 1, folder: 1, createdAt: -1 });

module.exports = mongoose.model("File", fileSchema);
