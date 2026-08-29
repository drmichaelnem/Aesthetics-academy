const sentReplies = new Map();

function hasSent(senderId, replyId) {
  const sent = sentReplies.get(senderId);
  return sent ? sent.has(replyId) : false;
}

function markSent(senderId, replyId) {
  if (!sentReplies.has(senderId)) sentReplies.set(senderId, new Set());
  sentReplies.get(senderId).add(replyId);
}

module.exports = { hasSent, markSent };
