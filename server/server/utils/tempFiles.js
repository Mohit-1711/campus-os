const fs = require("fs/promises");

/** Best-effort removal of a multer temp file. Never throws. */
async function removeTempFile(filePath) {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Temporary file cleanup failed:", error.message);
    }
  }
}

module.exports = { removeTempFile };
