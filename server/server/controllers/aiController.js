const fs = require("fs/promises");
const cloudinary = require("../config/cloudinary");
const File = require("../models/fileModel");
const Folder = require("../models/folderModel");
const { indexPdf, markIndexingFailed } = require("../services/indexingService");
const { destroyAsset, serializeFile } = require("../services/fileService");
const { removeTempFile } = require("../utils/tempFiles");
const { extractPdfText } = require("../utils/documentProcessor");
const { httpError } = require("../utils/httpError");
const { assertObjectId } = require("../utils/validate");

const AI_FOLDER_NAME = "AI Uploads";

async function findOrCreateAiFolder(userId) {
  const existing = await Folder.findOne({ user: userId, name: AI_FOLDER_NAME });
  return existing || Folder.create({ user: userId, name: AI_FOLDER_NAME });
}

/** Upload a PDF straight from the assistant: stored in "AI Uploads" and indexed. */
async function uploadAiDocument(req, res) {
  if (!req.file) {
    throw httpError(400, "Please select a PDF file to upload.");
  }

  let uploaded = null;
  let file = null;

  try {
    const buffer = await fs.readFile(req.file.path);

    // Validate the PDF before spending a Cloudinary upload on it.
    await extractPdfText(buffer);

    const folder = await findOrCreateAiFolder(req.user.userId);

    uploaded = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw",
      folder: "campus-os/ai-uploads",
    });

    file = await File.create({
      user: req.user.userId,
      folder: folder._id,
      name: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      cloudinaryUrl: uploaded.secure_url,
      cloudinaryPublicId: uploaded.public_id,
      cloudinaryResourceType: uploaded.resource_type,
      source: "ai_upload",
      processingStatus: "pending",
    });

    const processing = await indexPdf(file, buffer);

    res.status(201).json({
      message: "Document uploaded and processed successfully.",
      file: serializeFile(file),
      processing,
    });
  } catch (error) {
    // Roll back everything this request created.
    if (file) {
      await markIndexingFailed(file);
      await File.deleteOne({ _id: file._id }).catch(() => {});
    }

    if (uploaded) {
      await destroyAsset({
        cloudinaryPublicId: uploaded.public_id,
        cloudinaryResourceType: uploaded.resource_type,
      }).catch((cleanupError) => console.error("Cloudinary rollback failed:", cleanupError.message));
    }

    throw error;
  } finally {
    await removeTempFile(req.file.path);
  }
}

/**
 * Download a stored PDF from Cloudinary. Different account settings expose files
 * differently, so try a signed URL first and fall back to the public URL.
 */
async function downloadStoredPdf(file) {
  const base = {
    resource_type: file.cloudinaryResourceType,
    type: "upload",
    expires_at: Math.floor(Date.now() / 1000) + 300,
  };

  const candidates = [
    cloudinary.utils.private_download_url(file.cloudinaryPublicId, "pdf", base),
    cloudinary.utils.private_download_url(file.cloudinaryPublicId, "", base),
    file.cloudinaryUrl,
  ];

  let lastStatus = "no response";

  for (const url of candidates) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        lastStatus = `HTTP ${response.status}`;
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.subarray(0, 5).toString() === "%PDF-") return buffer;

      lastStatus = "response was not a PDF";
    } catch (error) {
      lastStatus = error.message;
    }
  }

  throw httpError(
    502,
    `Could not download this PDF from storage (${lastStatus}). If it keeps failing, enable PDF delivery in your Cloudinary security settings, or re-upload the file.`,
  );
}

/** Make an existing PDF (uploaded before indexing existed, or one that failed) usable by the AI. */
async function indexExistingDocument(req, res) {
  const { fileId } = req.params;
  assertObjectId(fileId, "file ID");

  const file = await File.findOne({ _id: fileId, user: req.user.userId });

  if (!file) {
    throw httpError(404, "File not found.");
  }

  if (file.mimeType !== "application/pdf") {
    throw httpError(415, "Only PDF files can be used with the AI Assistant.");
  }

  if (file.processingStatus === "ready") {
    return res.status(200).json({
      message: "This document is already indexed.",
      file: serializeFile(file),
    });
  }

  file.processingStatus = "pending";
  await file.save();

  try {
    const processing = await indexPdf(file, await downloadStoredPdf(file));

    res.status(200).json({
      message: "Document indexed successfully.",
      file: serializeFile(file),
      processing,
    });
  } catch (error) {
    await markIndexingFailed(file);
    throw error;
  }
}

module.exports = { uploadAiDocument, indexExistingDocument };
