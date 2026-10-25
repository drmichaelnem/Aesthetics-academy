const fetch = require('node-fetch');

const GRAPH_API_BASE = 'https://graph.instagram.com/v21.0';

async function sendInstagramMessage(recipientId, text) {
  const accessToken = process.env.IG_PAGE_ACCESS_TOKEN;
  const url = `${GRAPH_API_BASE}/me/messages?access_token=${accessToken}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Instagram send failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

async function sendPrivateReply(commentId, text) {
  const accessToken = process.env.IG_PAGE_ACCESS_TOKEN;
  const url = `${GRAPH_API_BASE}/me/messages?access_token=${accessToken}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Instagram private reply failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

async function getUserProfileName(igsid) {
  const accessToken = process.env.IG_PAGE_ACCESS_TOKEN;
  const url = `${GRAPH_API_BASE}/${igsid}?fields=name,username&access_token=${accessToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Instagram profile lookup failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data.name || data.username || null;
}

async function graphGet(pathAndQuery) {
  const accessToken = process.env.IG_PAGE_ACCESS_TOKEN;
  const separator = pathAndQuery.includes('?') ? '&' : '?';
  const response = await fetch(`${GRAPH_API_BASE}/${pathAndQuery}${separator}access_token=${accessToken}`);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Instagram GET ${pathAndQuery.split('?')[0]} failed: ${response.status} ${errorBody}`);
  }
  return response.json();
}

// True when the conversation with this sender already holds a message that came
// from the business side (a team member or an earlier bot reply).
async function hasEarlierBusinessMessage(igsid) {
  const conversations = await graphGet(`me/conversations?platform=instagram&user_id=${igsid}`);
  const conversation = conversations.data && conversations.data[0];
  if (!conversation) return false;

  const details = await graphGet(`${conversation.id}?fields=messages`);
  const messages = (details.messages && details.messages.data) || [];

  // The API returns the newest messages first; the last few are enough to tell.
  for (const { id } of messages.slice(0, 10)) {
    const message = await graphGet(`${id}?fields=from`);
    if (message.from && message.from.id !== igsid) return true;
  }
  return false;
}

module.exports = { sendInstagramMessage, sendPrivateReply, getUserProfileName, hasEarlierBusinessMessage };
