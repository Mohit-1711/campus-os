const express = require("express");
const { router: authRoutes } = require("./routes/authRoutes");
const handleError = require("./middlewares/errorHandler");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "College Buddy API is running",
  });
});

app.use("/api/auth", authRoutes);
//kept this after routes since the purpose of using this is to catch error of the routes so inshort it runs after routes
app.use(handleError);

module.exports = app;
