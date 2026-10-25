const express = require("express");
const verifyFolderOwnership = require("../middlewares/verifyFolderOwnership");
const upload = require("../middlewares/uploadMiddleware");
const {
  uploadFile,
  listFiles,
  deleteFile,
} = require("../controllers/fileControllers");

const router = express.Router();

router.post(
  "/:folderId/files",
  verifyFolderOwnership,
  upload.single("file"),
  uploadFile,
);

router.get("/:folderId/files", verifyFolderOwnership, listFiles);

router.delete("/:folderId/files/:fileId", verifyFolderOwnership, deleteFile);

module.exports = { router };
