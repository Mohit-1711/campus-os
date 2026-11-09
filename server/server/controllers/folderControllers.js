const Folder = require("../models/folderModel");
const File = require("../models/fileModel");
const { deleteFiles } = require("../services/fileService");
const { httpError } = require("../utils/httpError");
const { requireText } = require("../utils/validate");

async function assertNameAvailable(userId, name, ignoreFolderId) {
  const duplicate = await Folder.exists({
    user: userId,
    name,
    ...(ignoreFolderId && { _id: { $ne: ignoreFolderId } }),
  });

  if (duplicate) {
    throw httpError(409, `You already have a folder named "${name}".`);
  }
}

async function handleCreateFolder(req, res) {
  const name = requireText(req.body?.name, { label: "Folder name" });
  await assertNameAvailable(req.user.userId, name);

  const folder = await Folder.create({ name, user: req.user.userId });

  res.status(201).json({ message: "Folder created successfully", folder });
}

async function handleGetFolders(req, res) {
  const folders = await Folder.find({ user: req.user.userId }).sort({ createdAt: -1 }).lean();

  res.status(200).json({ message: "Folders fetched successfully", folders });
}

async function handleRenameFolder(req, res) {
  const name = requireText(req.body?.name, { label: "Folder name" });
  await assertNameAvailable(req.user.userId, name, req.folder._id);

  req.folder.name = name;
  await req.folder.save();

  res.status(200).json({ message: "Folder renamed successfully", folder: req.folder });
}

// Deletes the folder AND everything inside it (files, AI data, chat references).
async function handleDeleteFolder(req, res) {
  const files = await File.find({ folder: req.folder._id, user: req.user.userId });

  await deleteFiles(files);
  await req.folder.deleteOne();

  res.status(200).json({ message: "Folder deleted successfully" });
}

module.exports = {
  handleCreateFolder,
  handleGetFolders,
  handleRenameFolder,
  handleDeleteFolder,
};
