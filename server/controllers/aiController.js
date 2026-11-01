const fs = require("fs/promises");
const cloudinary = require("../config/cloudinary");
const File = require("../models/fileModel");
const Folder = require("../models/folderModel");
const DocumentChunk = require("../models/documentChunkModel");
const { processPdf } = require("../utils/documentProcessor");

async function uploadAiDocument(req, res, next) {
  let cloudinaryResult = null;
  let savedFile = null;
  let savedFolder = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a PDF file to upload.",
      });
    }

    // Read the temporary file and extract its text before uploading.
    const buffer = await fs.readFile(req.file.path);
    const { numPages, chunks } = await processPdf(buffer);

    // Find the user's dedicated AI Uploads folder or create it.
    savedFolder = await Folder.findOne({
      user: req.user.userId,
      name: "AI Uploads",
    });

    if (!savedFolder) {
      savedFolder = await Folder.create({
        user: req.user.userId,
        name: "AI Uploads",
      });
    }

    // Store the original PDF in Cloudinary.
    cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw",
      folder: "campus-os/ai-uploads",
    });

    // Create the file record as pending until all chunks are saved.
    savedFile = await File.create({
      user: req.user.userId,
      folder: savedFolder._id,
      name: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      cloudinaryResourceType: cloudinaryResult.resource_type,
      source: "ai_upload",
      processingStatus: "pending",
    });

    // Persist extracted text chunks for future retrieval.
    const chunkDocuments = chunks.map((content, index) => ({
      user: req.user.userId,
      folder: savedFolder._id,
      file: savedFile._id,
      content,
      chunkIndex: index,
    }));

    await DocumentChunk.insertMany(chunkDocuments);

    // Mark the document ready only after chunk persistence succeeds.
    savedFile.processingStatus = "ready";
    await savedFile.save();

    return res.status(201).json({
      message: "Document uploaded and processed successfully.",
      file: {
        _id: savedFile._id,
        name: savedFile.name,
        originalName: savedFile.originalName,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
        folder: savedFile.folder,
        source: savedFile.source,
        processingStatus: savedFile.processingStatus,
        createdAt: savedFile.createdAt,
      },
      processing: {
        numPages,
        totalChunks: chunks.length,
      },
    });
  } catch (error) {
    // Best-effort rollback of resources created during this request.
    if (savedFile) {
      try {
        await DocumentChunk.deleteMany({ file: savedFile._id });
        await File.deleteOne({ _id: savedFile._id });
      } catch (cleanupError) {
        console.error("Database rollback failed:", cleanupError.message);
      }
    }

    if (cloudinaryResult?.public_id) {
      try {
        const result = await cloudinary.uploader.destroy(
          cloudinaryResult.public_id,
          { resource_type: cloudinaryResult.resource_type },
        );

        if (result.result !== "ok" && result.result !== "not found") {
          console.error("Cloudinary rollback could not be confirmed:", result);
        }
      } catch (cleanupError) {
        console.error("Cloudinary rollback failed:", cleanupError.message);
      }
    }

    next(error);
  } finally {
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") {
          console.error("Temporary file cleanup failed:", cleanupError.message);
        }
      }
    }
  }
}

module.exports = { uploadAiDocument };
