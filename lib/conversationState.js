const sentReplies = new Map();
const knownSenders = new Set();
const manualHandoff = new Set();

function hasSent(senderId, replyId) {
  const sent = sentReplies.get(senderId);
  return sent ? sent.has(replyId) : false;
}

function markSent(senderId, replyId) {
  if (!sentReplies.has(senderId)) sentReplies.set(senderId, new Set());
  sentReplies.get(senderId).add(replyId);
}

function isFirstReply(senderId) {
  return !knownSenders.has(senderId);
}

function markKnown(senderId) {
  knownSenders.add(senderId);
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
