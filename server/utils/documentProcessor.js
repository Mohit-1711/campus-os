// Import the parser directly: the package's index.js runs a debug routine
// (reads a bundled test PDF) in some environments.
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
const { httpError } = require("./httpError");

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

/** Extract clean text from a PDF buffer. */
async function extractPdfText(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw httpError(400, "Invalid or empty PDF file.");
  }

  // Don't trust the client-provided MIME type; check the real file signature.
  if (buffer.subarray(0, 5).toString() !== "%PDF-") {
    throw httpError(400, "The uploaded file is not a valid PDF.");
  }

  // pdf-parse bundles a very old pdf.js that misreads some Node Buffers (small
  // files in particular, intermittently). A plain Uint8Array copy is reliable.
  const data = new Uint8Array(buffer.length);
  data.set(buffer);

  let parsed;

  try {
    parsed = await pdfParse(data);
  } catch (error) {
    console.error("PDF extraction failed:", error.message);
    throw httpError(422, "Unable to read this PDF. It may be corrupted or password-protected.");
  }

  const text = parsed.text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Scanned (image-only) PDFs have no text layer and would need OCR.
  if (!text) {
    throw httpError(422, "No readable text was found. Scanned PDFs are not supported yet.");
  }

  return { text, numPages: parsed.numpages };
}

/** Split text into overlapping chunks, preferring to break at spaces. */
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    if (end < text.length) {
      const boundary = text.lastIndexOf(" ", end);
      if (boundary > start + chunkSize * 0.5) end = boundary;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= text.length) break;

    // Step forward but keep some overlap so sentences aren't lost at the seams.
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

async function processPdf(buffer) {
  const { text, numPages } = await extractPdfText(buffer);
  return { numPages, chunks: chunkText(text) };
}

module.exports = { extractPdfText, chunkText, processPdf };
