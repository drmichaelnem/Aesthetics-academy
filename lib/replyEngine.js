const fs = require('fs');
const path = require('path');
const { hasSent, markSent, isFirstReply, markKnown } = require('./conversationState');

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
  const matchedTreatments = [];

  for (const treatment of treatments) {
    if (!keywordsMatch(treatment.keywords, normalized)) continue;
    if (treatment.excludeKeywords && keywordsMatch(treatment.excludeKeywords, normalized)) {
      return { id: null, entry: null };
    }
    matchedTreatments.push(treatment);
  }

  if (matchedTreatments.length >= 2) {
    return { id: 'multi-treatment', entry: config.multiTreatmentReply };
  }
  if (matchedTreatments.length === 1) {
    return { id: matchedTreatments[0].id, entry: matchedTreatments[0] };
  }

  for (const rule of config.rules) {
    if (keywordsMatch(rule.keywords, normalized)) {
      return { id: rule.id, entry: rule };
    }
  }

  return { id: 'default', entry: config.defaultReply ? { body: config.defaultReply } : null };
}

function composeText(entry, includeGreeting) {
  if (!entry || !entry.body) return null;
  if (includeGreeting && entry.greeting) {
    return `${entry.greeting}\n\n${entry.body}`;
  }
  return entry.body;
}

function matchReply(incomingText, senderId) {
  if (!incomingText) return null;
  const config = loadConfig();
  const normalized = incomingText.trim().toLowerCase();

  const { id, entry } = findReply(config, normalized);
  if (senderId && hasSent(senderId, id)) return null;

  const includeGreeting = !senderId || isFirstReply(senderId);
  const text = composeText(entry, includeGreeting);
  if (!text) return null;

  if (senderId) {
    markSent(senderId, id);
    markKnown(senderId);
  }

  return text;
}

module.exports = { matchReply };
