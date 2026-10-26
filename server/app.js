const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { router: authRoutes } = require("./routes/authRoutes");
const { router: folderRoutes } = require("./routes/folderRoutes");
const { router: fileRoutes } = require("./routes/fileRoutes");
const handleError = require("./middlewares/errorHandler");
const handleAuth = require("./middlewares/authMiddleware");

const app = express();

const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({
    message: "College Buddy API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/folder", handleAuth, folderRoutes);
app.use("/api/folder", handleAuth, fileRoutes);

app.use(handleError);

module.exports = app;
