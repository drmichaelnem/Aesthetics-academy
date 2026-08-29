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

async function getMediaCaption(mediaId) {
  const accessToken = process.env.IG_PAGE_ACCESS_TOKEN;
  const url = `${GRAPH_API_BASE}/${mediaId}?fields=caption&access_token=${accessToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Instagram media lookup failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data.caption || '';
}

module.exports = { sendInstagramMessage, sendPrivateReply, getMediaCaption };
