const mongoose = require("mongoose");

const documentChunkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", required: true },
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    content: { type: String, required: true },
    chunkIndex: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

documentChunkSchema.index({ file: 1, chunkIndex: 1 }, { unique: true });
documentChunkSchema.index({ user: 1, folder: 1, file: 1 });

module.exports = mongoose.model("DocumentChunk", documentChunkSchema);
