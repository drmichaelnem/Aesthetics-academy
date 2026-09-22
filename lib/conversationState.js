const sessions = new Map(); // senderId -> { sentReplies }
const manualHandoff = new Set();

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

function markKnown(senderId) {
  getOrCreateSession(senderId);
}

function markManualHandoff(senderId) {
  manualHandoff.add(senderId);
}

function isManualHandoff(senderId) {
  return manualHandoff.has(senderId);
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
  markManualHandoff,
  isManualHandoff,
  setLastTopic,
  getLastTopic,
  hasSentTreatmentCta,
  markTreatmentCtaSent,
};
