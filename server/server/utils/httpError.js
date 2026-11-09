/** An Error that carries the HTTP status the error handler should reply with. */
class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

const httpError = (statusCode, message) => new HttpError(statusCode, message);

module.exports = { HttpError, httpError };
