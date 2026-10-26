const express = require("express");
const {
  handleCreateFolder,
  handleGetFolder,
  handleRenameFolder,
  handleDeleteFolder,
} = require("../controllers/folderControllers");
const router = express.Router();

router.post("/", handleCreateFolder);
router.get("/", handleGetFolder);
router.patch("/:folderId", handleRenameFolder);
router.delete("/:folderId", handleDeleteFolder);
module.exports = { router };
