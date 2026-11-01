const fetch = require('node-fetch');

// Instagram long-lived access tokens expire after ~60 days. Refreshing one
// returns a token valid for another 60 days, so doing it daily keeps the bot
// from ever losing access (as happened when the token expired on 27-Oct-26).
const REFRESH_URL = 'https://graph.instagram.com/refresh_access_token';
const RENDER_API_BASE = 'https://api.render.com/v1';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FIRST_REFRESH_DELAY_MS = 60 * 1000;

async function refreshInstagramToken() {
  const currentToken = process.env.IG_PAGE_ACCESS_TOKEN;
  if (!currentToken) return;

  const response = await fetch(`${REFRESH_URL}?grant_type=ig_refresh_token&access_token=${currentToken}`);
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    const message = (data.error && data.error.message) || response.status;
    throw new Error(`Instagram token refresh failed: ${message}`);
  }

  // The rest of the bot reads the token from process.env on every call.
  process.env.IG_PAGE_ACCESS_TOKEN = data.access_token;
  const days = Math.round(data.expires_in / 86400);
  console.log(`Instagram token refreshed, valid for ${days} more days`);

  await saveTokenToRender(data.access_token);
}

// Without this, a restart or deploy would bring back the old token from the
// Render settings, which still expires 60 days after it was created.
async function saveTokenToRender(token) {
  const apiKey = process.env.RENDER_API_KEY;
  const serviceId = process.env.RENDER_SERVICE_ID;
  if (!apiKey || !serviceId) {
    console.warn('RENDER_API_KEY/RENDER_SERVICE_ID not set - refreshed Instagram token kept in memory only');
    return;
  }

  const response = await fetch(`${RENDER_API_BASE}/services/${serviceId}/env-vars/IG_PAGE_ACCESS_TOKEN`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ value: token }),
  });
  if (!response.ok) {
    throw new Error(`Saving refreshed Instagram token to Render failed: ${response.status} ${await response.text()}`);
  }
  console.log('Refreshed Instagram token saved to Render settings');
}

function runRefresh() {
  refreshInstagramToken().catch((err) => console.error(err.message));
}

function startInstagramTokenRefresher() {
  setTimeout(runRefresh, FIRST_REFRESH_DELAY_MS);
  setInterval(runRefresh, REFRESH_INTERVAL_MS);
}

module.exports = { startInstagramTokenRefresher, refreshInstagramToken };
