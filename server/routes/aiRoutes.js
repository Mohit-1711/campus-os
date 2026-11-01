const express = require("express");
const aiUpload = require("../middlewares/aiUploadMiddleware");
const { uploadAiDocument } = require("../controllers/aiController");

const router = express.Router();

router.post("/documents", aiUpload.single("file"), uploadAiDocument);

module.exports = { router };
