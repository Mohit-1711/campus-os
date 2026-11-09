const { httpError } = require("./httpError");

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const isObjectId = (value) => OBJECT_ID_PATTERN.test(String(value));

function assertObjectId(value, label = "ID") {
  if (!isObjectId(value)) {
    throw httpError(400, `Invalid ${label}.`);
  }
}

/** Returns a trimmed, length-checked string or throws a 400. */
function requireText(value, { label = "Name", max = 100 } = {}) {
  if (typeof value !== "string" || !value.trim()) {
    throw httpError(400, `${label} is required.`);
  }

  const text = value.trim();

  if (text.length > max) {
    throw httpError(400, `${label} cannot exceed ${max} characters.`);
  }

  return text;
}

function parsePagination(query, { defaultLimit = 20, maxLimit = 50 } = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? defaultLimit : Number(query.limit);

  const valid =
    Number.isInteger(page) &&
    Number.isInteger(limit) &&
    page >= 1 &&
    limit >= 1 &&
    limit <= maxLimit;

  if (!valid) {
    throw httpError(
      400,
      `Invalid pagination. Page must be at least 1 and limit between 1 and ${maxLimit}.`,
    );
  }

  return { page, limit, skip: (page - 1) * limit };
}

module.exports = { isObjectId, assertObjectId, requireText, parsePagination };
