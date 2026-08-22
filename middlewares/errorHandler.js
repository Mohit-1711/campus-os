function handleError(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || "Internal Server Error";

  res.status(statusCode).json({
    status: "failed",
    error: errorMessage,
  });
}

module.exports = handleError;
