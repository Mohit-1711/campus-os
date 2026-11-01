const mongoose = require("mongoose");

const fileSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    cloudinaryUrl: {
      type: String,
      required: true,
    },

    cloudinaryPublicId: {
      type: String,
      required: true,
    },
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

    processingStatus: {
      type: String,
      enum: ["not_required", "pending", "ready", "failed"],
      default: "not_required",
      required: true,
    },
  },
  { timestamps: true },
);

const File = mongoose.model("File", fileSchema);

module.exports = File;
