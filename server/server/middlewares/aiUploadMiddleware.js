const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "..", "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${crypto.randomUUID()}${path
      .extname(file.originalname)
      .toLowerCase()}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      const error = new Error(
        "AI Assistant currently supports PDF files only.",
      );
      error.statusCode = 415;
      return cb(error);
    }

    cb(null, true);
  },

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

module.exports = upload;
