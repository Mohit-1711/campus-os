const express = require("express");
const {
  handleCreateFolder,
  handleGetFolders,
  handleRenameFolder,
  handleDeleteFolder,
} = require("../controllers/folderControllers");
const {
  uploadFile,
  listFilesInFolder,
  renameFile,
  deleteFile,
} = require("../controllers/fileControllers");
const verifyFolderOwnership = require("../middlewares/verifyFolderOwnership");
const { uploadDocument } = require("../middlewares/upload");

const router = express.Router();

// Folders
router.get("/", handleGetFolders);
router.post("/", handleCreateFolder);
router.patch("/:folderId", verifyFolderOwnership, handleRenameFolder);
router.delete("/:folderId", verifyFolderOwnership, handleDeleteFolder);

// Files inside a folder
router.get("/:folderId/files", verifyFolderOwnership, listFilesInFolder);
router.post("/:folderId/files", verifyFolderOwnership, uploadDocument.single("file"), uploadFile);
router.patch("/:folderId/files/:fileId", verifyFolderOwnership, renameFile);
router.delete("/:folderId/files/:fileId", verifyFolderOwnership, deleteFile);

module.exports = router;
