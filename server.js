require('dotenv').config();
const express = require('express');

const instagramWebhook = require('./webhooks/instagram');
const whatsappWebhook = require('./webhooks/whatsapp');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Aesthetics Academy message bot is running.');
});

app.use('/webhook/instagram', instagramWebhook);
app.use('/webhook/whatsapp', whatsappWebhook);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
