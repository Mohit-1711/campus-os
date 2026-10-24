const express = require("express");
const handleAuth = require("../middlewares/authMiddleware");
const verifyFolderOwnership = require("../middlewares/verifyFolderOwnership");
const upload = require("../middlewares/uploadMiddleware");
const { uploadFile } = require("../controllers/fileControllers");

const router = express.Router();

router.post(
  "/:folderId/files",
  verifyFolderOwnership,
  upload.single("file"),
  uploadFile,
);

module.exports = { router };
