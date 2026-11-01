const pdfParse = require("pdf-parse");

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Extract text from a PDF buffer.
 * Validates the PDF signature before parsing.
 */
async function extractPdfText(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw createError("Invalid or empty PDF file.");
  }

  // Do not rely only on the client-provided MIME type.
  const pdfSignature = buffer.subarray(0, 5).toString();

  if (pdfSignature !== "%PDF-") {
    throw createError("The uploaded file is not a valid PDF.");
  }

  let parsedData;

  try {
    parsedData = await pdfParse(buffer);
  } catch (error) {
    console.error("PDF extraction failed:", error.message);
    throw createError(
      "Unable to read this PDF file. It may be corrupted.",
      422,
    );
  }

  const text = parsedData.text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Scanned/image-only PDFs generally need OCR, which is outside our MVP.
  if (!text) {
    throw createError(
      "No readable text was found in this PDF. Scanned PDFs are not supported yet.",
      422,
    );
  }

  return {
    text,
    numPages: parsedData.numpages,
  };
}

/**
 * Split extracted text into overlapping chunks.
 * Attempts to end chunks at word boundaries.
 */
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  if (typeof text !== "string" || !text.trim()) {
    throw createError("Text is required for chunking.");
  }

  if (
    !Number.isInteger(chunkSize) ||
    !Number.isInteger(overlap) ||
    chunkSize <= 0 ||
    overlap < 0 ||
    overlap >= chunkSize
  ) {
    throw createError("Invalid chunk size or overlap configuration.", 500);
  }

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // Avoid cutting a word in half when a suitable boundary exists.
    if (end < text.length) {
      const boundary = text.lastIndexOf(" ", end);

      if (boundary > start + chunkSize * 0.5) {
        end = boundary;
      }
    }

    const chunk = text.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= text.length) {
      break;
    }

    // Move forward while retaining some context from the previous chunk.
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

/**
 * Complete PDF processing pipeline.
 */
async function processPdf(buffer) {
  const { text, numPages } = await extractPdfText(buffer);
  const chunks = chunkText(text);

  return {
    numPages,
    chunks,
  };
}

module.exports = {
  extractPdfText,
  chunkText,
  processPdf,
};
