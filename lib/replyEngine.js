const fs = require('fs');
const path = require('path');

const REPLIES_PATH = path.join(__dirname, '..', 'replies.json');

function loadConfig() {
  const raw = fs.readFileSync(REPLIES_PATH, 'utf8');
  return JSON.parse(raw);
}

function matchReply(incomingText) {
  if (!incomingText) return null;
  const config = loadConfig();
  const normalized = incomingText.trim().toLowerCase();

  for (const rule of config.rules) {
    const matched = rule.keywords.some((keyword) =>
      normalized.includes(keyword.trim().toLowerCase())
    );
    if (matched) return rule.reply;
  }

  return config.defaultReply || null;
}

module.exports = { matchReply };
