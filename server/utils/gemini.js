const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateStudyResponse(prompt) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.4,
          maxOutputTokens: 1000,
        },
      });

      return response.text;
    } catch (error) {
      const isTemporary =
        error.status === 503 || error.status === 500 || error.status === 429;

      if (!isTemporary || attempt === maxAttempts) {
        throw error;
      }

      const delay = 1000 * 2 ** (attempt - 1);

      console.log(
        `Gemini temporary failure. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`,
      );

      await sleep(delay);
    }
  }
}

module.exports = { generateStudyResponse };
