const express = require('express');
const { matchReply } = require('../lib/replyEngine');
const { sendInstagramMessage } = require('../lib/instagramApi');

const router = express.Router();

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('IG webhook verification attempt:', {
    mode,
    match: token === process.env.IG_VERIFY_TOKEN,
  });

  if (mode === 'subscribe' && token === process.env.IG_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

router.post('/', async (req, res) => {
  res.sendStatus(200);

  const entries = req.body.entry || [];
  for (const entry of entries) {
    const messagingEvents = entry.messaging || [];
    for (const event of messagingEvents) {
      const isStoryReply = event.message && event.message.reply_to && event.message.reply_to.story;
      if (event.message && !event.message.is_echo && !isStoryReply) {
        const senderId = event.sender.id;
        const text = event.message.text;
        const reply = matchReply(text, senderId);
        if (reply) {
          try {
            await sendInstagramMessage(senderId, reply);
          } catch (err) {
            console.error('Failed to send Instagram reply:', err.message);
          }
        }
      }
    }
  }
});

module.exports = router;
