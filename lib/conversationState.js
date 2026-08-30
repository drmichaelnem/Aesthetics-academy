const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours of inactivity = treat sender as new again

const sessions = new Map(); // senderId -> { lastContactAt, sentReplies }
const manualHandoff = new Set();

function getSession(senderId) {
  const session = sessions.get(senderId);
  if (session && Date.now() - session.lastContactAt < SESSION_TTL_MS) {
    return session;
  }
  return null;
}

function getOrCreateSession(senderId) {
  const existing = getSession(senderId);
  if (existing) return existing;
  const fresh = { lastContactAt: Date.now(), sentReplies: new Set() };
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
  session.lastContactAt = Date.now();
}

function isFirstReply(senderId) {
  return !getSession(senderId);
}

function markKnown(senderId) {
  const session = getOrCreateSession(senderId);
  session.lastContactAt = Date.now();
}

function markManualHandoff(senderId) {
  manualHandoff.add(senderId);
}

function isManualHandoff(senderId) {
  return manualHandoff.has(senderId);
}

module.exports = {
  hasSent,
  markSent,
  isFirstReply,
  markKnown,
  markManualHandoff,
  isManualHandoff,
};
