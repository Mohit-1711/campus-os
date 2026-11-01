const DocumentChunk = require("../models/documentChunkModel");

const MAX_RETRIEVED_CHUNKS = 5;

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function calculateRelevance(question, content) {
  const questionWords = [...new Set(tokenize(question))];
  const contentWords = tokenize(content);

  if (questionWords.length === 0 || contentWords.length === 0) {
    return 0;
  }

  const contentWordSet = new Set(contentWords);

  const matchedWords = questionWords.filter((word) => contentWordSet.has(word));

  return matchedWords.length / questionWords.length;
}

async function retrieveRelevantChunks({ question, userId, fileIds }) {
  if (
    !question?.trim() ||
    !userId ||
    !Array.isArray(fileIds) ||
    fileIds.length === 0
  ) {
    return [];
  }

  const chunks = await DocumentChunk.find({
    user: userId,
    file: { $in: fileIds },
  })
    .select("file content chunkIndex")
    .lean();

  const rankedChunks = chunks
    .map((chunk) => ({
      ...chunk,
      relevanceScore: calculateRelevance(question, chunk.content),
    }))
    .filter((chunk) => chunk.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, MAX_RETRIEVED_CHUNKS);

  return rankedChunks;
}

module.exports = { retrieveRelevantChunks };
