const DocumentChunk = require("../models/documentChunkModel");
const { processPdf } = require("../utils/documentProcessor");

/**
 * Extract text from a PDF and store it as searchable chunks for `file`.
 * Marks the file "ready" only after every chunk has been saved.
 */
async function indexPdf(file, buffer) {
  const { numPages, chunks } = await processPdf(buffer);

  await DocumentChunk.deleteMany({ file: file._id });

  await DocumentChunk.insertMany(
    chunks.map((content, chunkIndex) => ({
      user: file.user,
      folder: file.folder,
      file: file._id,
      content,
      chunkIndex,
    })),
  );

  file.processingStatus = "ready";
  await file.save();

  return { numPages, totalChunks: chunks.length };
}

/** Remove any partial chunks and flag the file as unusable by the AI. */
async function markIndexingFailed(file) {
  try {
    await DocumentChunk.deleteMany({ file: file._id });
    file.processingStatus = "failed";
    await file.save();
  } catch (error) {
    console.error("Could not record indexing failure:", error.message);
  }
}

module.exports = { indexPdf, markIndexingFailed };
