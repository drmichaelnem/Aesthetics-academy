const sessions = new Map(); // senderId -> { sentReplies }
const manualHandoff = new Set();
const humanTakeover = new Set(); // a team member has answered by hand
const historyChecked = new Set(); // conversations confirmed to have started with the bot
const pendingBotTexts = new Map(); // recipientId -> texts the bot sent, not yet seen as echoes

function getSession(senderId) {
  return sessions.get(senderId) || null;
}

function getOrCreateSession(senderId) {
  const existing = getSession(senderId);
  if (existing) return existing;
  const fresh = { sentReplies: new Set() };
  sessions.set(senderId, fresh);
  return fresh;
}

function hasSent(senderId, replyId) {
  const session = getSession(senderId);
  return session ? session.sentReplies.has(replyId) : false;
}

function markSent(senderId, replyId) {
  const session = getOrCreateSession(senderId);
  session.sentReplies.add(replyId);
}

function isFirstReply(senderId) {
  return !getSession(senderId);
}

function isKnown(senderId) {
  return (
    sessions.has(senderId) ||
    historyChecked.has(senderId) ||
    manualHandoff.has(senderId) ||
    humanTakeover.has(senderId)
  );
}

function markHistoryChecked(senderId) {
  historyChecked.add(senderId);
}

function markKnown(senderId) {
  getOrCreateSession(senderId);
}

function markManualHandoff(senderId) {
  manualHandoff.add(senderId);
}

function isManualHandoff(senderId) {
  return manualHandoff.has(senderId) || humanTakeover.has(senderId);
}

function markHumanTakeover(senderId) {
  humanTakeover.add(senderId);
}

function isHumanTakeover(senderId) {
  return humanTakeover.has(senderId);
}

// Instagram echoes back every message sent from the account, both the bot's and a
// human's. Recording the bot's own texts lets us tell the two apart.
function recordBotMessage(recipientId, text) {
  const texts = pendingBotTexts.get(recipientId) || [];
  texts.push(text.trim());
  pendingBotTexts.set(recipientId, texts);
}

function consumeBotMessage(recipientId, text) {
  const texts = pendingBotTexts.get(recipientId);
  if (!texts || !text) return false;
  const index = texts.indexOf(text.trim());
  if (index === -1) return false;
  texts.splice(index, 1);
  if (texts.length === 0) pendingBotTexts.delete(recipientId);
  return true;
}

function setLastTopic(senderId, topic) {
  const session = getOrCreateSession(senderId);
  session.lastTopic = topic;
}

function getLastTopic(senderId) {
  const session = getSession(senderId);
  return session ? session.lastTopic || null : null;
}

function hasSentTreatmentCta(senderId) {
  const session = getSession(senderId);
  return session ? Boolean(session.treatmentCtaSent) : false;
}

function markTreatmentCtaSent(senderId) {
  const session = getOrCreateSession(senderId);
  session.treatmentCtaSent = true;
}

module.exports = {
  hasSent,
  markSent,
  isFirstReply,
  markKnown,
  isKnown,
  markHistoryChecked,
  markManualHandoff,
  isManualHandoff,
  markHumanTakeover,
  isHumanTakeover,
  recordBotMessage,
  consumeBotMessage,
  setLastTopic,
  getLastTopic,
  hasSentTreatmentCta,
  markTreatmentCtaSent,
};
