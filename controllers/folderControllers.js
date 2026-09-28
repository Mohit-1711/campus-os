const Folder = require("../models/folderModel");

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

    //this returns an array which is now stored in folders variable
    const folders = await Folder.find({ user: userId });

    return res.status(200).json({
      message: "Folders fetched successfully",
      folders, //if user have no folder it returns [] empty array
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleCreateFolder, handleGetFolder };
