const express = require("express");

const aiUpload = require("../middlewares/aiUploadMiddleware");

const {
  uploadAiDocument,
  indexExistingDocument,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/documents", aiUpload.single("file"), uploadAiDocument);

router.post("/documents/:fileId/index", indexExistingDocument);

module.exports = { router };
