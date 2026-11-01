const mongoose = require("mongoose");
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

    // Read and process the temporary PDF.
    const buffer = await fs.readFile(req.file.path);
    const { numPages, chunks } = await processPdf(buffer);

    if (!chunks.length) {
      return res.status(422).json({
        message: "No readable content was found in this PDF.",
      });
    }

    // Find or create the user's AI Uploads folder.
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

    // Upload the original PDF to Cloudinary.
    cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw",
      folder: "campus-os/ai-uploads",
    });

    // Save file metadata.
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

    // Prepare and save document chunks.
    const chunkDocuments = chunks.map((content, index) => ({
      user: req.user.userId,
      folder: savedFolder._id,
      file: savedFile._id,
      content,
      chunkIndex: index,
    }));

    await DocumentChunk.insertMany(chunkDocuments);

    // Mark ready only after chunks are saved.
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
    // Roll back database records created by this request.
    if (savedFile) {
      try {
        await DocumentChunk.deleteMany({
          file: savedFile._id,
          user: req.user.userId,
        });

        await File.deleteOne({
          _id: savedFile._id,
          user: req.user.userId,
        });
      } catch (cleanupError) {
        console.error("Database rollback failed:", cleanupError.message);
      }
    }

    // Remove the uploaded Cloudinary asset if necessary.
    if (cloudinaryResult?.public_id) {
      try {
        const result = await cloudinary.uploader.destroy(
          cloudinaryResult.public_id,
          {
            resource_type: cloudinaryResult.resource_type,
          },
        );

        if (result.result !== "ok" && result.result !== "not found") {
          console.error("Cloudinary rollback could not be confirmed:", result);
        }
      } catch (cleanupError) {
        console.error("Cloudinary rollback failed:", cleanupError.message);
      }
    }

    return next(error);
  } finally {
    // Remove temporary upload.
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

async function indexExistingDocument(req, res, next) {
  try {
    const { fileId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.isValidObjectId(fileId)) {
      return res.status(400).json({
        message: "Invalid file ID.",
      });
    }

    // Verify that the file belongs to the authenticated user.
    const file = await File.findOne({
      _id: fileId,
      user: userId,
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found.",
      });
    }

    if (file.mimeType !== "application/pdf") {
      return res.status(415).json({
        message: "Only PDF files can be indexed.",
      });
    }

    if (!file.cloudinaryPublicId || !file.cloudinaryResourceType) {
      return res.status(400).json({
        message: "Cloudinary file information is missing.",
      });
    }

    // Avoid unnecessary re-indexing.
    if (file.processingStatus === "ready") {
      return res.status(200).json({
        message: "This document is already indexed.",
        fileId: file._id,
        processingStatus: file.processingStatus,
      });
    }

    // Mark processing as pending.
    file.processingStatus = "pending";
    await file.save();

    try {
      // Verify the asset's actual Cloudinary delivery configuration.
      const resource = await cloudinary.api.resource(file.cloudinaryPublicId, {
        resource_type: file.cloudinaryResourceType,
        type: "upload",
      });

      console.log("[Cloudinary asset]", {
        publicId: resource.public_id,
        resourceType: resource.resource_type,
        deliveryType: resource.type,
        format: resource.format,
      });

      // Generate a temporary download URL using the verified
      // delivery type. This may still be rejected if the account
      // has additional delivery-access restrictions.
      const downloadUrl = cloudinary.utils.private_download_url(
        file.cloudinaryPublicId,
        "pdf",
        {
          resource_type: file.cloudinaryResourceType,
          type: resource.type,
          expires_at: Math.floor(Date.now() / 1000) + 300,
        },
      );

      // Download the existing PDF.
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Cloudinary download failed: HTTP ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Reuse the existing PDF processing pipeline.
      const { numPages, chunks } = await processPdf(buffer);

      if (!chunks.length) {
        throw new Error("No readable content was found in this PDF.");
      }

      // Prepare chunks before modifying existing database records.
      const chunkDocuments = chunks.map((content, index) => ({
        user: userId,
        folder: file.folder,
        file: file._id,
        content,
        chunkIndex: index,
      }));

      // Remove incomplete chunks from previous failed attempts.
      await DocumentChunk.deleteMany({
        file: file._id,
        user: userId,
      });

      // Save the new chunks.
      await DocumentChunk.insertMany(chunkDocuments, {
        ordered: true,
      });

      // Mark the file ready.
      file.processingStatus = "ready";
      await file.save();

      return res.status(200).json({
        message: "Existing document indexed successfully.",
        fileId: file._id,
        processing: {
          numPages,
          totalChunks: chunks.length,
        },
        processingStatus: file.processingStatus,
      });
    } catch (processingError) {
      // Remove chunks from a failed indexing attempt.
      // This also handles partial insertMany failures.
      try {
        await DocumentChunk.deleteMany({
          file: file._id,
          user: userId,
        });
      } catch (cleanupError) {
        console.error(
          "Failed to clean up document chunks:",
          cleanupError.message,
        );
      }

      file.processingStatus = "failed";

      try {
        await file.save();
      } catch (saveError) {
        console.error(
          "Failed to update document processing status:",
          saveError.message,
        );
      }

      throw processingError;
    }
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  uploadAiDocument,
  indexExistingDocument,
};
