const express = require("express");
const { uploadPdf } = require("../middlewares/upload");
const { uploadAiDocument, indexExistingDocument } = require("../controllers/aiController");

const router = express.Router();

router.post("/documents", uploadPdf.single("file"), uploadAiDocument);
router.post("/documents/:fileId/index", indexExistingDocument);

module.exports = router;
