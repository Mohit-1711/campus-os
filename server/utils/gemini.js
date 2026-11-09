const { GoogleGenAI } = require("@google/genai");
const { env } = require("../config/env");
const { httpError } = require("./httpError");

const MAX_OUTPUT_TOKENS = 2048;
const REQUEST_TIMEOUT_MS = 45000;

let client = null;

// Created lazily so the server can start (and be tested) without an API key.
function getClient() {
  if (!env.geminiApiKey) {
    throw httpError(503, "The AI service is not configured on the server.");
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: env.geminiApiKey,
      httpOptions: { timeout: REQUEST_TIMEOUT_MS },
    });
  }

  return client;
}

/** Turn a stored message list into Gemini turns (must start with a user turn). */
function toGeminiTurns(history) {
  const turns = history.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  while (turns.length > 0 && turns[0].role !== "user") turns.shift();

  return turns;
}

/** Translate SDK / network failures into errors the client can show. */
function toFriendlyError(error) {
  if (error.statusCode) return error;

  const status = error.status;
  const message = String(error.message || "");

  if (status === 429) {
    return httpError(429, "The AI is receiving too many requests right now. Please try again in a moment.");
  }

  if (status === 400 || status === 401 || status === 403 || status === 404) {
    console.error("[Gemini] Request rejected:", status, message);
    return httpError(502, "The AI service rejected the request. Check the server's GEMINI_API_KEY and GEMINI_MODEL.");
  }

  if (/timeout|timed out|abort/i.test(message)) {
    return httpError(504, "The AI took too long to respond. Please try again.");
  }

  return httpError(502, "The AI service is unavailable right now. Please try again.");
}

/**
 * Ask Gemini a question. `systemInstruction` holds the rules, `history` the earlier
 * turns of this chat, and `prompt` the new user turn (question + document excerpts).
 */
async function generateAnswer({ systemInstruction, history = [], prompt }) {
  const startedAt = Date.now();

  try {
    const response = await getClient().models.generateContent({
      model: env.geminiModel,
      contents: [...toGeminiTurns(history), { role: "user", parts: [{ text: prompt }] }],
      // No temperature/top_p/top_k: Gemini 3.5+ models deprecate sampling parameters.
      config: { systemInstruction, maxOutputTokens: MAX_OUTPUT_TOKENS },
    });

    const answer = response.text?.trim();

    if (!answer) {
      throw httpError(502, "The AI returned an empty answer. Try rephrasing your question.");
    }

    return answer;
  } catch (error) {
    console.error(`[Gemini] Failed after ${Date.now() - startedAt}ms:`, error.message);
    throw toFriendlyError(error);
  }
}

module.exports = { generateAnswer };
