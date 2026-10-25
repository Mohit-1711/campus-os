const fs = require("fs/promises");
const cloudinary = require("../config/cloudinary");
const File = require("../models/fileModel");

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
      folder: "college-buddy",
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

module.exports = { uploadFile, listFiles };
