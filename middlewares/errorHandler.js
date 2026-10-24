function handleError(err, req, res, next) {
  console.error(err);

  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || "Internal Server Error";

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    errorMessage = "File exceeds the 10 MB size limit";
  }

  res.status(statusCode).json({
    status: "failed",
    error: errorMessage,
  });
}

module.exports = handleError;
