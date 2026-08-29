const fs = require('fs');
const path = require('path');
const { hasSent, markSent } = require('./conversationState');

const REPLIES_PATH = path.join(__dirname, '..', 'replies.json');

function loadConfig() {
  const raw = fs.readFileSync(REPLIES_PATH, 'utf8');
  return JSON.parse(raw);
}

function keywordsMatch(keywords, normalizedText) {
  return keywords.some((keyword) => normalizedText.includes(keyword.trim().toLowerCase()));
}

function findReply(config, normalized) {
  const treatments = config.treatments || [];
  const matchedTreatments = treatments.filter((treatment) =>
    keywordsMatch(treatment.keywords, normalized)
  );

  if (matchedTreatments.length >= 2) {
    return { id: 'multi-treatment', text: config.multiTreatmentReply || null };
  }
  if (matchedTreatments.length === 1) {
    return { id: matchedTreatments[0].id, text: matchedTreatments[0].reply };
  }

  for (const rule of config.rules) {
    if (keywordsMatch(rule.keywords, normalized)) {
      return { id: rule.id, text: rule.reply };
    }
  }

  return { id: 'default', text: config.defaultReply || null };
}

function matchReply(incomingText, senderId) {
  if (!incomingText) return null;
  const config = loadConfig();
  const normalized = incomingText.trim().toLowerCase();

  const { id, text } = findReply(config, normalized);
  if (!text) return null;

  if (senderId) {
    if (hasSent(senderId, id)) return null;
    markSent(senderId, id);
  }

  return text;
}

module.exports = { matchReply };
