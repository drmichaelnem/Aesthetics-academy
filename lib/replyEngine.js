const fs = require('fs');
const path = require('path');
const {
  hasSent,
  markSent,
  isFirstReply,
  markKnown,
  setLastTopic,
  hasSentTreatmentCta,
  markTreatmentCtaSent,
} = require('./conversationState');

const REPLIES_PATH = path.join(__dirname, '..', 'replies.json');

function loadConfig() {
  const raw = fs.readFileSync(REPLIES_PATH, 'utf8');
  return JSON.parse(raw);
}

function keywordsMatch(keywords, normalizedText) {
  return keywords.some((keyword) => normalizedText.includes(keyword.trim().toLowerCase()));
}

function findConcreteReply(config, normalized) {
  const treatments = config.treatments || [];
  const matchedTreatments = [];

  for (const treatment of treatments) {
    if (!keywordsMatch(treatment.keywords, normalized)) continue;
    if (treatment.excludeKeywords && keywordsMatch(treatment.excludeKeywords, normalized)) {
      return { id: null, entry: null, isTreatment: false };
    }
    matchedTreatments.push(treatment);
  }

  if (matchedTreatments.length >= 2) {
    return { id: 'multi-treatment', entry: config.multiTreatmentReply, isTreatment: false };
  }
  if (matchedTreatments.length === 1) {
    return { id: matchedTreatments[0].id, entry: matchedTreatments[0], isTreatment: true };
  }

  for (const rule of config.rules) {
    if (keywordsMatch(rule.keywords, normalized)) {
      return { id: rule.id, entry: rule, isTreatment: false };
    }
  }

  return { id: null, entry: null, isTreatment: false };
}

function composeText(entry, includeGreeting, ctaText) {
  if (!entry || !entry.body) return null;
  let text = ctaText ? `${entry.body}\n\n${ctaText}` : entry.body;
  if (includeGreeting && entry.greeting) {
    text = `${entry.greeting}\n\n${text}`;
  }
  return text;
}

function resolveAndSend(id, entry, senderId, isTreatment, config) {
  if (senderId && hasSent(senderId, id)) return null;

  const includeGreeting = !senderId || isFirstReply(senderId);
  const includeCta = isTreatment && config.treatmentCta && (!senderId || !hasSentTreatmentCta(senderId));
  const text = composeText(entry, includeGreeting, includeCta ? config.treatmentCta : null);
  if (!text) return null;

  if (senderId) {
    markSent(senderId, id);
    markKnown(senderId);
    if (isTreatment) markTreatmentCtaSent(senderId);
  }

  return text;
}

function matchReply(incomingText, senderId) {
  if (!incomingText) return null;
  const config = loadConfig();
  const normalized = incomingText.trim().toLowerCase();

  const { id, entry, isTreatment } = findConcreteReply(config, normalized);

  const text = resolveAndSend(id, entry, senderId, isTreatment, config);

  if (entry && senderId) {
    const topic = detectTreatmentTopic(incomingText);
    if (topic) setLastTopic(senderId, topic);
  }

  return text;
}

function matchCommentReply(commentText, captionText, senderId) {
  const config = loadConfig();

  let { id, entry, isTreatment } = findConcreteReply(config, (commentText || '').trim().toLowerCase());

  if (!entry && captionText) {
    ({ id, entry, isTreatment } = findConcreteReply(config, captionText.trim().toLowerCase()));
  }

  if (!entry) return null;

  return resolveAndSend(id, entry, senderId, isTreatment, config);
}

function detectTreatmentTopic(incomingText) {
  if (!incomingText) return null;
  const config = loadConfig();
  const normalized = incomingText.trim().toLowerCase();

  for (const treatment of config.treatments || []) {
    const matchedKeyword = treatment.keywords.find((keyword) =>
      normalized.includes(keyword.trim().toLowerCase())
    );
    if (matchedKeyword) return matchedKeyword;
  }

  return null;
}

module.exports = { matchReply, matchCommentReply, detectTreatmentTopic };
