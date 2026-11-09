const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const { env } = require("./config/env");
const handleAuth = require("./middlewares/authMiddleware");
const handleError = require("./middlewares/errorHandler");
const { httpError } = require("./utils/httpError");

const app = express();

// Behind a proxy (Render, Railway, ...) so secure cookies and rate limits see the real client.
if (env.isProd) app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ message: "Campus OS API is running" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/folder", handleAuth, require("./routes/folderRoutes"));
app.use("/api/files", handleAuth, require("./routes/libraryRoutes"));
app.use("/api/ai", handleAuth, require("./routes/aiRoutes"));
app.use("/api/chats", handleAuth, require("./routes/chatRoutes"));

app.use("/api", (req, res, next) => next(httpError(404, "Route not found")));
app.use(handleError);

module.exports = app;
