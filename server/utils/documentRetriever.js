const DocumentChunk = require("../models/documentChunkModel");

const MAX_RETRIEVED_CHUNKS = 6;

// Common words carry no signal for matching a question to a passage.
const STOP_WORDS = new Set(
  (
    "the and for are but not you all any can had her was one our out has have been were what when " +
    "where which who whom whose why how does did this that these those with from into about over " +
    "than then them they their there here would could should will shall may might must also just " +
    "like very more most some such only own same too its it's his she him your yours mine me my " +
    "tell give explain describe please document pdf notes"
  ).split(" "),
);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function termFrequencies(words) {
  const counts = new Map();
  for (const word of words) counts.set(word, (counts.get(word) || 0) + 1);
  return counts;
}

/**
 * Keyword retrieval with TF-IDF style weighting: words that are rare across the
 * selected documents count for more than words that appear everywhere.
 */
function rankChunks(question, chunks) {
  const questionTerms = [...new Set(tokenize(question))];
  if (questionTerms.length === 0 || chunks.length === 0) return [];

  const indexed = chunks.map((chunk) => ({
    chunk,
    frequencies: termFrequencies(tokenize(chunk.content)),
  }));

  const idf = new Map(
    questionTerms.map((term) => {
      const docsWithTerm = indexed.filter((item) => item.frequencies.has(term)).length;
      return [term, Math.log(1 + chunks.length / (1 + docsWithTerm))];
    }),
  );

  const maxScore = questionTerms.reduce((sum, term) => sum + idf.get(term), 0);

  return indexed
    .map(({ chunk, frequencies }) => {
      const score = questionTerms.reduce((sum, term) => {
        const count = frequencies.get(term) || 0;
        return count > 0 ? sum + idf.get(term) * (1 + Math.log(count)) : sum;
      }, 0);

      return { ...chunk, relevanceScore: score / maxScore };
    })
    .filter((chunk) => chunk.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore || a.chunkIndex - b.chunkIndex);
}

/** Opening chunks of each document, used when nothing matches (e.g. "summarize this"). */
function openingChunks(chunks, limit) {
  const byFile = new Map();

  for (const chunk of [...chunks].sort((a, b) => a.chunkIndex - b.chunkIndex)) {
    const key = String(chunk.file);
    if (!byFile.has(key)) byFile.set(key, []);
    byFile.get(key).push(chunk);
  }

  const picked = [];
  for (let round = 0; picked.length < limit; round += 1) {
    let addedThisRound = false;

    for (const fileChunks of byFile.values()) {
      if (fileChunks[round] && picked.length < limit) {
        picked.push(fileChunks[round]);
        addedThisRound = true;
      }
    }

    if (!addedThisRound) break;
  }

  return picked;
}

async function retrieveRelevantChunks({ question, userId, fileIds }) {
  if (!question?.trim() || !userId || !Array.isArray(fileIds) || fileIds.length === 0) {
    return [];
  }

  const chunks = await DocumentChunk.find({ user: userId, file: { $in: fileIds } })
    .select("file content chunkIndex")
    .lean();

  const ranked = rankChunks(question, chunks).slice(0, MAX_RETRIEVED_CHUNKS);

  return ranked.length > 0 ? ranked : openingChunks(chunks, MAX_RETRIEVED_CHUNKS);
}

module.exports = { retrieveRelevantChunks, rankChunks, openingChunks, tokenize };
