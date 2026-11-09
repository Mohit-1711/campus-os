const { env, validateEnv } = require("./config/env");
const connectDB = require("./config/db");

async function startServer() {
  validateEnv();
  await connectDB();

  const app = require("./app");

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
