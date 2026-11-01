const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    timeout: 30000,
  },
});

async function generateGeminiResponse(prompt) {
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("A valid prompt is required.");
  }

  const startTime = Date.now();

  try {
    console.log("[Gemini] Request started");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: 1000,
      },
    });

    const answer = response.text?.trim();

    if (!answer) {
      throw new Error("Gemini returned an empty response.");
    }

    console.log(`[Gemini] Completed in ${Date.now() - startTime}ms`);

    return answer;
  } catch (error) {
    console.error(
      `[Gemini] Failed after ${Date.now() - startTime}ms:`,
      error.message,
    );

    throw error;
  }
}

module.exports = { generateGeminiResponse };
