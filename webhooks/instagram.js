const express = require('express');
const { matchReply, matchCommentReply, detectTreatmentTopic } = require('../lib/replyEngine');
const { sendInstagramMessage, sendPrivateReply, getUserProfileName } = require('../lib/instagramApi');
const { sendLeadAlert } = require('../lib/whatsappApi');
const { extractPhoneNumber } = require('../lib/phoneDetector');
const {
  markManualHandoff,
  isManualHandoff,
  getLastTopic,
  markHumanTakeover,
  isHumanTakeover,
  recordBotMessage,
  consumeBotMessage,
} = require('../lib/conversationState');

const router = express.Router();

// Auto-replies to post/reel comments are paused until re-enabled.
const COMMENT_AUTO_REPLIES_ENABLED = false;

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

async function replyToSender(senderId, text) {
  recordBotMessage(senderId, text);
  await sendInstagramMessage(senderId, text);
}

async function handleMessagingEvent(event) {
  if (!event.message) return;

  if (event.message.is_echo) {
    // An echo the bot didn't send means someone from the team is answering by
    // hand - stay out of that conversation from here on.
    const customerId = event.recipient.id;
    if (!consumeBotMessage(customerId, event.message.text)) {
      markHumanTakeover(customerId);
    }
    return;
  }

  const senderId = event.sender.id;
  const text = event.message.text;

  // A phone number is a lead, so the alert always goes out - even after the
  // conversation was handed off to a human (e.g. the sender sent a photo first).
  // Once a team member is answering by hand, the bot doesn't reply at all.
  const phoneNumber = extractPhoneNumber(text);
  if (phoneNumber) {
    const topic = detectTreatmentTopic(text) || getLastTopic(senderId) || 'פנייה כללית';

    let instagramName = null;
    try {
      instagramName = await getUserProfileName(senderId);
    } catch (err) {
      console.error('Failed to fetch Instagram profile name:', err.message);
    }

    try {
      await sendLeadAlert(phoneNumber, topic, instagramName);
    } catch (err) {
      console.error('Failed to send WhatsApp lead alert:', err.message);
    }

    if (isHumanTakeover(senderId)) return;

    try {
      await replyToSender(senderId, 'קיבלתי 🙂\nנציגה שלנו תחזור אליך בהקדם האפשרי');
    } catch (err) {
      console.error('Failed to send phone-number confirmation reply:', err.message);
    }
    return;
  }

  const isStoryReply = event.message.reply_to && event.message.reply_to.story;
  const hasAttachment = event.message.attachments && event.message.attachments.length > 0;
  if (isStoryReply || hasAttachment) {
    // A shared post/reel or a story reply gives us no reliable context to answer
    // from, so hand this whole conversation off to a human from here on.
    markManualHandoff(senderId);
    return;
  }

  if (isManualHandoff(senderId)) return;

  const reply = matchReply(text, senderId);
  if (reply) {
    try {
      await replyToSender(senderId, reply);
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

  const reply = matchCommentReply(commentText, commenterId);
  if (reply) {
    try {
      if (commenterId) recordBotMessage(commenterId, reply);
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
      if (COMMENT_AUTO_REPLIES_ENABLED && change.field === 'comments') {
        await handleCommentChange(change);
      }
    }
  }
});

module.exports = router;
