const express = require('express');
const { matchReply, matchCommentReply } = require('../lib/replyEngine');
const { sendInstagramMessage, sendPrivateReply, getMediaCaption } = require('../lib/instagramApi');
const { extractPhoneNumber } = require('../lib/phoneDetector');

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

async function handleMessagingEvent(event) {
  const isStoryReply = event.message && event.message.reply_to && event.message.reply_to.story;
  if (!event.message || event.message.is_echo || isStoryReply) return;

  const senderId = event.sender.id;
  const text = event.message.text;

  const phoneNumber = extractPhoneNumber(text);
  if (phoneNumber) {
    // TODO: once WhatsApp is connected, send a staff alert here instead of just logging.
    console.log(`Phone number left by Instagram sender ${senderId}: ${phoneNumber}`);
  }

  const reply = matchReply(text, senderId);
  if (reply) {
    try {
      await sendInstagramMessage(senderId, reply);
    } catch (err) {
      console.error('Failed to send Instagram reply:', err.message);
    }
  }
}

async function handleCommentChange(change) {
  console.log('IG comment webhook payload:', JSON.stringify(change));

  const comment = change.value;
  if (!comment || !comment.id) return;

  const commenterId = comment.from && comment.from.id;
  const commentText = comment.text;
  const mediaId = comment.media && comment.media.id;

  let captionText = null;
  if (mediaId) {
    try {
      captionText = await getMediaCaption(mediaId);
    } catch (err) {
      console.error('Failed to fetch media caption:', err.message);
    }
  }

  const reply = matchCommentReply(commentText, captionText, commenterId);
  if (reply) {
    try {
      await sendPrivateReply(comment.id, reply);
    } catch (err) {
      console.error('Failed to send private reply to comment:', err.message);
    }
  }
}

router.post('/', async (req, res) => {
  res.sendStatus(200);

  const entries = req.body.entry || [];
  for (const entry of entries) {
    for (const event of entry.messaging || []) {
      await handleMessagingEvent(event);
    }

    for (const change of entry.changes || []) {
      if (change.field === 'comments') {
        await handleCommentChange(change);
      }
    }
  }
});

module.exports = router;
