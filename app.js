const express = require("express");
const { router: authRoutes } = require("./routes/authRoutes");
const { router: folderRoutes } = require("./routes/folderRoutes");
const handleError = require("./middlewares/errorHandler");
const handleAuth = require("./middlewares/authMiddleware");

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    message: "College Buddy API is running",
  });
});
app.use("/api/auth", authRoutes);
app.use("/", handleAuth, folderRoutes);
//kept this after routes since the purpose of using this is to catch error of the routes so inshort it runs after routes
app.use(handleError);

module.exports = app;
