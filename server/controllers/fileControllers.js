const fs = require("fs/promises");
const cloudinary = require("../config/cloudinary");
const File = require("../models/fileModel");
const { indexPdf, markIndexingFailed } = require("../services/indexingService");
const {
  deleteFiles,
  destroyAsset,
  serializeFile,
} = require("../services/fileService");
const { removeTempFile } = require("../utils/tempFiles");
const { httpError } = require("../utils/httpError");
const { assertObjectId, requireText } = require("../utils/validate");

async function uploadFile(req, res) {
  if (!req.file) {
    throw httpError(400, "Please select a file to upload.");
  }

  let uploaded = null;

  try {
    uploaded = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
      folder: "campus-os",
    });

    const isPdf = req.file.mimetype === "application/pdf";

    const file = await File.create({
      user: req.user.userId,
      folder: req.folder._id,
      name: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      cloudinaryUrl: uploaded.secure_url,
      cloudinaryPublicId: uploaded.public_id,
      cloudinaryResourceType: uploaded.resource_type,
      processingStatus: isPdf ? "pending" : "not_required",
    });

    // Index PDFs right away from the local copy so they are ready for the AI
    // assistant. A PDF the AI can't read (e.g. a scan) is still a valid upload.
    if (isPdf) {
      try {
        await indexPdf(file, await fs.readFile(req.file.path));
      } catch (error) {
        console.warn(
          `PDF "${file.name}" was uploaded but not indexed: ${error.message}`,
        );
        await markIndexingFailed(file);
      }
    }

    res.status(201).json({
      message: "File uploaded successfully",
      file: serializeFile(file),
    });
  } catch (error) {
    // Don't leave an orphaned asset in Cloudinary if saving failed.
    if (uploaded) {
      await destroyAsset({
        cloudinaryPublicId: uploaded.public_id,
        cloudinaryResourceType: uploaded.resource_type,
      }).catch((cleanupError) =>
        console.error("Cloudinary cleanup failed:", cleanupError.message),
      );
    }

    throw error;
  } finally {
    await removeTempFile(req.file.path);
  }
}

async function listFilesInFolder(req, res) {
  const files = await File.find({
    user: req.user.userId,
    folder: req.folder._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    message: "Files retrieved successfully",
    count: files.length,
    files: files.map(serializeFile),
  });
}

// One request for the whole library (avoids asking for every folder separately).
async function listAllFiles(req, res) {
  const files = await File.find({ user: req.user.userId })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    message: "Files retrieved successfully",
    count: files.length,
    files: files.map(serializeFile),
  });
}

async function findOwnedFile(req) {
  const { fileId } = req.params;
  assertObjectId(fileId, "file ID");

  const file = await File.findOne({
    _id: fileId,
    folder: req.folder._id,
    user: req.user.userId,
  });

  if (!file) {
    throw httpError(404, "File not found");
  }

  return file;
}

async function renameFile(req, res) {
  const file = await findOwnedFile(req);

  file.name = requireText(req.body?.name, { label: "File name", max: 150 });
  await file.save();

  res
    .status(200)
    .json({ message: "File renamed successfully", file: serializeFile(file) });
}

async function deleteFile(req, res) {
  const file = await findOwnedFile(req);

  await deleteFiles([file]);

  res.status(200).json({ message: "File deleted successfully" });
}

module.exports = {
  uploadFile,
  listFilesInFolder,
  listAllFiles,
  renameFile,
  deleteFile,
};
