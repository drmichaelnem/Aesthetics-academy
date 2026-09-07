const fetch = require('node-fetch');

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

async function sendWhatsappMessage(to, text) {
  const accessToken = process.env.WA_ACCESS_TOKEN;
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const url = `${GRAPH_API_BASE}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp send failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

async function sendLeadAlert(phoneNumber, topic) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = process.env.WHATSAPP_ALERT_RECIPIENT;
  const url = `${GRAPH_API_BASE}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'template',
      template: {
        name: 'new_lead_from_instagram',
        language: { code: 'he' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: phoneNumber }, { type: 'text', text: topic }],
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp lead alert failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

module.exports = { sendWhatsappMessage, sendLeadAlert };
