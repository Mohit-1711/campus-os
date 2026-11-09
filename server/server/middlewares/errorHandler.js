const { env } = require("../config/env");

/** Turns anything thrown in a route into a consistent `{ message }` JSON response. */
function handleError(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File exceeds the 10 MB size limit.";
  } else if (err.name === "MulterError") {
    statusCode = 400;
    message = "The upload could not be processed. Send a single file in the 'file' field.";
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body is not valid JSON.";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors || {})[0]?.message || "Validation failed.";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "One of the provided values is invalid.";
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "That record already exists.";
  }

  if (statusCode >= 500) {
    console.error(err);

    // Never leak internals to the client in production.
    if (env.isProd) {
      message = "Something went wrong on our side. Please try again.";
    }
  }

  return res.status(statusCode).json({ message });
}

module.exports = handleError;
