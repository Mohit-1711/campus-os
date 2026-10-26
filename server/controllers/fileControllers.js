const fs = require("fs/promises");
const cloudinary = require("../config/cloudinary");
const File = require("../models/fileModel");
const mongoose = require("mongoose");

async function uploadFile(req, res, next) {
  let cloudinaryPublicId;
  let cloudinaryResourceType;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a file to upload",
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
      folder: "campus-os",
    });

    cloudinaryPublicId = result.public_id;
    cloudinaryResourceType = result.resource_type;

    const savedFile = await File.create({
      user: req.user.userId,
      folder: req.folder._id,
      name: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      cloudinaryUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      cloudinaryResourceType: result.resource_type,
    });

    return res.status(201).json({
      message: "File uploaded successfully",
      file: savedFile,
    });
  } catch (error) {
    if (cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(cloudinaryPublicId, {
          resource_type: cloudinaryResourceType,
        });
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError.message);
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

async function listFiles(req, res, next) {
  try {
    const files = await File.find({
      user: req.user.userId,
      folder: req.folder._id,
    })
      .select(
        "name originalName mimeType size cloudinaryUrl createdAt updatedAt",
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      message: "Files retrieved successfully",
      count: files.length,
      files,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteFile(req, res, next) {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        message: "Invalid file ID",
      });
    }

    const file = await File.findOne({
      _id: fileId,
      folder: req.folder._id,
      user: req.user.userId,
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const result = await cloudinary.uploader.destroy(file.cloudinaryPublicId, {
      resource_type: file.cloudinaryResourceType,
    });

    if (result.result !== "ok" && result.result !== "not found") {
      const error = new Error("Could not confirm Cloudinary deletion");
      error.statusCode = 502;
      return next(error);
    }

    await file.deleteOne();

    return res.status(200).json({
      message: "File deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

async function renameFile(req, res, next) {
  try {
    const { fileId } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        message: "Invalid file ID",
      });
    }

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "File name is required",
      });
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 150) {
      return res.status(400).json({
        message: "File name cannot exceed 150 characters",
      });
    }

    const file = await File.findOne({
      _id: fileId,
      folder: req.folder._id,
      user: req.user.userId,
    });

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    file.name = trimmedName;
    await file.save();

    return res.status(200).json({
      message: "File renamed successfully",
      file: {
        _id: file._id,
        name: file.name,
        originalName: file.originalName,
        updatedAt: file.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadFile, listFiles, deleteFile, renameFile };
