require("dotenv").config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || "development";
const isProd = nodeEnv === "production";

const env = {
  nodeEnv,
  isProd,
  port: Number(process.env.PORT) || 5000,

  // Support legacy environment variable name.
  mongoUri: process.env.MONGO_URI || process.env.MONGO_URL,

  jwtSecret: process.env.JWT_SECRET,

  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  // Cross-domain cookies require SameSite=None and Secure.
  cookieSameSite: process.env.COOKIE_SAME_SITE || (isProd ? "none" : "lax"),

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
};

function validateEnv() {
  const missing = [];

  if (!env.mongoUri) missing.push("MONGO_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Copy .env.example to .env and fill it in.`,
    );
  }

  const { cloudName, apiKey, apiSecret } = env.cloudinary;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn(
      "[config] Cloudinary is not configured - file uploads will fail.",
    );
  }

  if (!env.geminiApiKey) {
    console.warn(
      "[config] GEMINI_API_KEY is not set - the AI assistant will not answer.",
    );
  }
}

module.exports = { env, validateEnv };
