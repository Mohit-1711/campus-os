const express = require("express");
const {
  handleCreateFolder,
  handleGetFolder,
  handleRenameFolder,
} = require("../controllers/folderControllers");
const router = express.Router();

router.post("/", handleCreateFolder);
router.get("/", handleGetFolder);
router.patch("/:folderId", handleRenameFolder);
module.exports = { router };
