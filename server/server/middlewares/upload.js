const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const { httpError } = require("../utils/httpError");

// Temp files live in the OS temp dir so the repo (and read-only hosts) stay clean.
const uploadDir = path.join(os.tmpdir(), "campus-os-uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/png",
  "image/jpeg",
];

function createUploader({ allowedMimeTypes, rejectMessage }) {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) =>
        cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
    }),

    fileFilter: (req, file, cb) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(httpError(415, rejectMessage));
      }

      // Browsers send non-ASCII names as UTF-8 but multer decodes them as latin1.
      file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
      cb(null, true);
    },

    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  });
}

// Resources: any common study document.
const uploadDocument = createUploader({
  allowedMimeTypes: DOCUMENT_MIME_TYPES,
  rejectMessage: "This file type is not supported. Upload a PDF, Word, PowerPoint, Excel, text or image file.",
});

// AI assistant: PDF only (text is extracted from it).
const uploadPdf = createUploader({
  allowedMimeTypes: ["application/pdf"],
  rejectMessage: "The AI Assistant currently supports PDF files only.",
});

module.exports = { uploadDocument, uploadPdf };
