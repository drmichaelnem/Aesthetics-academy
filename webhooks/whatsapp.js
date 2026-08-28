const express = require('express');
const { matchReply } = require('../lib/replyEngine');
const { sendWhatsappMessage } = require('../lib/whatsappApi');

const router = express.Router();

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WA_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

router.post('/', async (req, res) => {
  res.sendStatus(200);

  const entries = req.body.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      const messages = (change.value && change.value.messages) || [];
      for (const message of messages) {
        if (message.type === 'text') {
          const from = message.from;
          const text = message.text.body;
          const reply = matchReply(text);
          if (reply) {
            try {
              await sendWhatsappMessage(from, reply);
            } catch (err) {
              console.error('Failed to send WhatsApp reply:', err.message);
            }
          }
        }
      }
    }
  }
});

module.exports = router;
