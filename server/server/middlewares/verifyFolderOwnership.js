const Folder = require("../models/folderModel");
const { assertObjectId } = require("../utils/validate");
const { httpError } = require("../utils/httpError");

/** Loads req.folder and guarantees it belongs to the logged-in user. */
async function verifyFolderOwnership(req, res, next) {
  const { folderId } = req.params;
  assertObjectId(folderId, "folder ID");

  const folder = await Folder.findOne({ _id: folderId, user: req.user.userId });

  if (!folder) {
    throw httpError(404, "Folder not found");
  }

  req.folder = folder;
  next();
}

module.exports = verifyFolderOwnership;
