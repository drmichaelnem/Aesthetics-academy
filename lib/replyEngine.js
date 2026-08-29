const fs = require('fs');
const path = require('path');

const REPLIES_PATH = path.join(__dirname, '..', 'replies.json');

function loadConfig() {
  const raw = fs.readFileSync(REPLIES_PATH, 'utf8');
  return JSON.parse(raw);
}

function keywordsMatch(keywords, normalizedText) {
  return keywords.some((keyword) => normalizedText.includes(keyword.trim().toLowerCase()));
}

function matchReply(incomingText) {
  if (!incomingText) return null;
  const config = loadConfig();
  const normalized = incomingText.trim().toLowerCase();

  const treatments = config.treatments || [];
  const matchedTreatments = treatments.filter((treatment) =>
    keywordsMatch(treatment.keywords, normalized)
  );

  if (matchedTreatments.length >= 2) {
    return config.multiTreatmentReply || null;
  }
  if (matchedTreatments.length === 1) {
    return matchedTreatments[0].reply;
  }

  for (const rule of config.rules) {
    if (keywordsMatch(rule.keywords, normalized)) return rule.reply;
  }

  return config.defaultReply || null;
}

module.exports = { matchReply };
