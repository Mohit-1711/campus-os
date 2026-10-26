const mongoose = require("mongoose");

const folderSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const Folder = mongoose.model("Folder", folderSchema);

module.exports = Folder;
