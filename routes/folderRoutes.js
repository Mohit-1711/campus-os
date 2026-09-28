const express = require("express");
const {
  handleCreateFolder,
  handleGetFolder,
} = require("../controllers/folderControllers");
const router = express.Router();

router.post("/api/folder", handleCreateFolder);
router.get("/api/folder", handleGetFolder);
module.exports = { router };
