const Folder = require("../models/folderModel");
const User = require("../models/userModel");

async function handleCreateFolder(req, res, next) {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        message: "Folder name is required",
      });
    }

    const folder = await Folder.create({
      name,
      user: req.user.userId,
    });

    return res.status(201).json({
      message: "Folder created successfully",
      folder,
    });
  } catch (err) {
    next(err);
  }
}

async function handleGetFolder(req, res, next) {
  try {
    const userId = req.user.userId;
    const folders = await Folder.find({ user: userId });

    return res.status(200).json({
      message: "Folders fetched successfully",
      folders,
    });
  } catch (err) {
    next(err);
  }
}
async function handleRenameFolder(req, res, next) {
  try {
    const userId = req.user.userId;
    const folderId = req.params.folderId;
    const { name } = req.body;

    const folder = await Folder.findOne({
      user: userId,
      _id: folderId,
    });

    if (!folder) {
      return res.status(404).json({
        message: "Folder not found",
      });
    }

    folder.name = name;

    await folder.save();

    return res.status(200).json({
      message: "Folder renamed successfully",
      folder,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { handleCreateFolder, handleGetFolder, handleRenameFolder };
