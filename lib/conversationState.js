const sentReplies = new Map();
const knownSenders = new Set();

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

module.exports = { hasSent, markSent, isFirstReply, markKnown };
