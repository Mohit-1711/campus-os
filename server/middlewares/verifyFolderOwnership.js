const mongoose = require("mongoose");
const Folder = require("../models/folderModel");

async function verifyFolderOwnership(req, res, next) {
  try {
    const { folderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      return res.status(400).json({
        message: "Invalid folder ID",
      });
    }

    const folder = await Folder.findOne({
      _id: folderId,
      user: req.user.userId,
    });

    if (!folder) {
      return res.status(404).json({
        message: "Folder not found",
      });
    }
    req.folder = folder;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = verifyFolderOwnership;
