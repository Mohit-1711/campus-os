const cloudinary = require("../config/cloudinary");
const File = require("../models/fileModel");
const Chat = require("../models/chatModel");
const DocumentChunk = require("../models/documentChunkModel");
const { httpError } = require("../utils/httpError");

/** The shape of a file sent to the client (no storage internals). */
function serializeFile(file) {
  return {
    _id: file._id,
    folder: file.folder,
    name: file.name,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    cloudinaryUrl: file.cloudinaryUrl,
    source: file.source,
    processingStatus: file.processingStatus,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

async function destroyAsset(file) {
  const result = await cloudinary.uploader.destroy(file.cloudinaryPublicId, {
    resource_type: file.cloudinaryResourceType,
  });

  // "not found" is fine: the asset is already gone.
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary did not confirm deletion (${result.result})`);
  }
}

/**
 * Permanently delete files: the Cloudinary asset, the AI chunks, the references
 * from any chats, and the database record.
 *
 * Database records are only removed for files whose asset was really deleted, so
 * a storage outage can never leave invisible orphaned assets behind. If any
 * asset failed, a 502 is thrown after the successful ones were cleaned up.
 */
async function deleteFiles(files) {
  const deletedIds = [];
  let failures = 0;

  for (const file of files) {
    try {
      await destroyAsset(file);
      deletedIds.push(file._id);
    } catch (error) {
      failures += 1;
      console.error(`Could not delete asset for file ${file._id}:`, error.message);
    }
  }

  if (deletedIds.length > 0) {
    await Promise.all([
      DocumentChunk.deleteMany({ file: { $in: deletedIds } }),
      Chat.updateMany({ files: { $in: deletedIds } }, { $pull: { files: { $in: deletedIds } } }),
      File.deleteMany({ _id: { $in: deletedIds } }),
    ]);
  }

  if (failures > 0) {
    throw httpError(
      502,
      `Could not delete ${failures} file${failures > 1 ? "s" : ""} from storage. Please try again.`,
    );
  }
}

module.exports = { serializeFile, deleteFiles, destroyAsset };
