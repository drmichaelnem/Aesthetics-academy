const PHONE_REGEX = /(?:\+?972[-\s]?|0)5\d(?:[-\s]?\d){7}/;

function extractPhoneNumber(text) {
  if (!text) return null;
  const match = text.match(PHONE_REGEX);
  return match ? match[0] : null;
}

module.exports = { extractPhoneNumber };
